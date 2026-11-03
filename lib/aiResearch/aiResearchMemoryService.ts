import {recordMemoryMaintenance,maintenanceErrorCode,type MemoryMaintenanceLog} from './aiResearchMemoryMaintenanceLog';
import {completedDailyCutoff} from './aiResearchChartContext';
import {digest,object,finite,validDay,makeMemoryRecord,unpackMemoryRecord,makeMemoryForecast,evaluateMemoryForecast,MEMORY_VERSION,type MemoryBar,type MemoryForecast} from './aiResearchMemoryProtocol';
import {storeMemoryRecord,readMemoryRecord,listMemoryRecords,storeMemoryForecast,readMemoryForecast,listMemoryForecasts,storeMemoryBars,barsForForecast,storeMemoryAssessment,storedMemoryAssessments} from './aiResearchMemoryStore';
export async function archiveResearchMemory(result:unknown,task:string,provenance:Record<string,unknown>|null=null){
 try{
  const now=new Date().toISOString(),entry=makeMemoryRecord(result,task,now,provenance),written=await storeMemoryRecord(entry);
  const report=object(object(result).report),facts=object(report.appFacts),cutoff=completedDailyCutoff(new Date(now));
  const bars:MemoryBar[]=[];
  if(entry.meta.kind!=='SYNTHETIC_DIAGNOSTIC')for(const [market,id]of [['NASDAQ','N-F-CLOSE'],['RUSSELL_2000','R-F-CLOSE']] as const){const f=Array.isArray(facts.facts)?facts.facts.find((f:any)=>f.id===id):null;if(f&&f.market===market&&f.status!=='MISSING'&&validDay(f.asOf)&&f.asOf<=cutoff&&finite(f.values?.close)&&f.values.close>0)bars.push({market,date:f.asOf,close:f.values.close,observedAt:now,source:'STORED_APP_DAILY_CLOSE_AS_SUPPLIED'});}
  try{await storeMemoryBars(bars);}catch{/* Record remains immutable even when close intake is unavailable. */}
  return {ok:true,version:MEMORY_VERSION,recordId:entry.meta.id,newRecord:written,modelRequestsUsed:0,forecastInferred:false};
 }catch{return {ok:false,version:MEMORY_VERSION,modelRequestsUsed:0,message:'Gedächtnisablage nicht bestätigt; der normale Bericht bleibt erhalten. Kein weiterer KI-Aufruf.'};}
}
export async function registerMemoryForecast(input:unknown){
 const r=object(input),record=await readMemoryRecord(String(r.sourceRecordId??''));if(!record)throw Error('FORECAST_SOURCE_NOT_FOUND');unpackMemoryRecord(record);
 const plan=makeMemoryForecast(record.meta,input,new Date().toISOString()),written=await storeMemoryForecast(plan);
 return {ok:true,newForecast:written,forecast:written?plan:await readMemoryForecast(plan.id),modelRequestsUsed:0,attribution:'USER_REGISTERED'};
}
async function inspectForecast(plan:MemoryForecast){
 const bars=await barsForForecast(plan),current=evaluateMemoryForecast(plan,bars,new Date().toISOString()),stored=await storedMemoryAssessments(plan);
 return {plan,currentSourceAssessment:current,storedAssessments:stored.map((s:any,i)=>{if(!s)return null;const c=current.outcomes[i];const samePath=c.metrics&&digest(c.metrics.sourceDates)===digest(s.metrics?.sourceDates)&&current.anchor?.date===s.anchor?.date;return {original:s,currentSourceCheck:c.status==='SOURCE_CONFLICT'?'SOURCE_CONFLICT':samePath?'SAME_OBSERVED_PATH':'OBSERVED_PATH_CHANGED_REVIEW'};})};
}
export async function inspectResearchMemory(recordOffset=0,forecastOffset=0){
 if(![recordOffset,forecastOffset].every(v=>Number.isInteger(v)&&v>=0&&v<=100000))throw Error('MEMORY_INVALID_PAGE');
 const [records,forecasts]=await Promise.all([listMemoryRecords(recordOffset),listMemoryForecasts(false,forecastOffset)]);
 return {ok:true,version:MEMORY_VERSION,readOnly:true,modelRequestsUsed:0,page:{recordOffset,forecastOffset,recordPageSize:20,forecastPageSize:10},records,forecasts:await Promise.all(forecasts.filter((p):p is MemoryForecast=>!!p).map(async plan=>{try{return await inspectForecast(plan!);}catch{return {plan:plan!,currentSourceAssessment:null,storedAssessments:[],evaluationMessage:'Auswertung derzeit nicht verfügbar; Szenario bleibt unverändert gespeichert.'};}})),
  limits:'Seitenweise 20 normale Protokolle und 10 Szenarien; ältere Einträge werden nicht gelöscht. Quellenlisten sind keine Prognosen. USER_REGISTERED ist keine KI-Prognose. AI_GENERATED sind ausdrücklich erzeugte, inhaltlich ungeprüfte Szenarien; primär 20 Intervalle, 5/10 sekundär. ABSTAIN bleibt im getrennten Szenarioarchiv, ohne Richtungsauswertung. Keine gepoolte Trefferquote, Optionsrendite oder aktive Erinnerungsnutzung.'};
}
export async function readResearchMemoryRecord(id:string){const entry=await readMemoryRecord(id);return entry?{ok:true,readOnly:true,modelRequestsUsed:0,meta:entry.meta,original:unpackMemoryRecord(entry)}:{ok:false,readOnly:true,modelRequestsUsed:0,message:'Protokolleintrag nicht vorhanden.'};}
/** Only this explicit cron task fetches two daily index series; no research/model endpoint is called. */
async function fetchOutcomeBars(market:'NASDAQ'|'RUSSELL_2000',symbol:string,now:string):Promise<MemoryBar[]>{
 const response=await fetch('https://query1.finance.yahoo.com/v8/finance/chart/'+encodeURIComponent(symbol)+'?interval=1d&range=3mo',{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'},cache:'no-store',signal:AbortSignal.timeout(3500)});
 if(!response.ok)throw Error('MEMORY_PRICE_HTTP_'+response.status);
 const body=await response.json(),chart=body?.chart?.result?.[0];if(chart?.meta?.symbol&&chart.meta.symbol!==symbol)throw Error('MEMORY_WRONG_SYMBOL');
 const times=chart?.timestamp,closes=chart?.indicators?.quote?.[0]?.close;if(!Array.isArray(times)||!Array.isArray(closes))throw Error('MEMORY_PRICE_FORMAT');
 const cutoff=completedDailyCutoff(new Date(now)),bars:MemoryBar[]=[];
 for(let i=0;i<Math.min(times.length,closes.length);i++){if(!finite(times[i])||!finite(closes[i])||closes[i]<=0)continue;const day=new Date(times[i]*1000).toISOString().slice(0,10);if(validDay(day)&&day<=cutoff)bars.push({market,date:day,close:closes[i],observedAt:now,source:'YAHOO_1D_CLOSE_AS_SUPPLIED'});}
 return bars.slice(-100);
}
export async function maintainResearchMemory(){
 const started=Date.now(),deadline=started+10000,now=new Date(started).toISOString();
 const log:MemoryMaintenanceLog={startedAt:now,finishedAt:now,status:'FAILED',stage:'PRICE_FETCH',completedCloseCutoff:completedDailyCutoff(new Date(now)),sources:[],barsSubmitted:0,newBarsStored:0,pendingFetched:0,forecastsChecked:0,forecastErrors:0,budgetSkipped:0,errorCode:null};
 let result:Record<string,unknown>;
 try{
  const identities=[{market:'NASDAQ',symbol:'^NDX'},{market:'RUSSELL_2000',symbol:'^RUT'}];
  const fetched=await Promise.allSettled([fetchOutcomeBars('NASDAQ','^NDX',now),fetchOutcomeBars('RUSSELL_2000','^RUT',now)]);
  log.sources=fetched.map((r,i)=>({market:identities[i].market,symbol:identities[i].symbol,ok:r.status==='fulfilled',observations:r.status==='fulfilled'?r.value.length:0,firstDate:r.status==='fulfilled'?r.value[0]?.date??null:null,lastDate:r.status==='fulfilled'?r.value[r.value.length-1]?.date??null:null,errorCode:r.status==='rejected'?maintenanceErrorCode(r.reason,true):null}));
  const bars=fetched.flatMap(r=>r.status==='fulfilled'?r.value:[]);log.barsSubmitted=bars.length;log.stage='BAR_STORAGE';if(bars.length)log.newBarsStored=await storeMemoryBars(bars);
  log.stage='PENDING_EVALUATION';const pending=await listMemoryForecasts(true);log.pendingFetched=pending.filter(Boolean).length;let processed=0;
  for(const plan of pending){if(!plan){log.forecastErrors++;break;}if(Date.now()>deadline-3000){log.budgetSkipped=log.pendingFetched-processed-log.forecastErrors;break;}try{const prices=await barsForForecast(plan),assessment=evaluateMemoryForecast(plan,prices,new Date().toISOString());await storeMemoryAssessment(plan,assessment);processed++;}catch{log.forecastErrors++;}}
  log.forecastsChecked=processed;log.status=log.sources.some(s=>!s.ok||!s.observations)||log.forecastErrors||log.budgetSkipped?'PARTIAL':'COMPLETE';log.stage='FINISHED';
  result={ok:true,version:MEMORY_VERSION,completedCloseObservations:bars.length,priceSourcesFailed:fetched.filter(r=>r.status==='rejected').length,forecastsChecked:processed,modelRequestsUsed:0,marketHistoryChanged:false};
 }catch(error){log.errorCode=maintenanceErrorCode(error);result={ok:false,version:MEMORY_VERSION,modelRequestsUsed:0,message:'Gedächtnisauswertung nicht vollständig verfügbar; Marktsnapshot bleibt unabhängig gespeichert.'};}
 log.finishedAt=new Date().toISOString();
 let diagnostic:{id:string|null;persisted:boolean}={id:null,persisted:false};
 try{diagnostic=await recordMemoryMaintenance(log);}catch{/* Optional diagnostic never changes the market snapshot or legacy maintenance result. */}
 console.info('RESEARCH_MEMORY_MAINTENANCE',JSON.stringify({startedAt:log.startedAt,status:log.status,stage:log.stage,sources:log.sources,newBarsStored:log.newBarsStored,forecastsChecked:log.forecastsChecked,forecastErrors:log.forecastErrors,budgetSkipped:log.budgetSkipped,diagnosticPersisted:diagnostic.persisted}));
 return {...result,maintenanceDiagnostic:{...diagnostic,status:log.status}};
}
