import {newsRelevance} from './aiResearchNewsRelevance';
import type {AIResearchReport} from './aiResearchTypes';
import {buildScenarioEvidenceFrame} from './aiResearchScenarioMeaning';
type Instrument='NASDAQ_PUT'|'NASDAQ_CALL'|'RUSSELL_CALL';
const obj=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const sign=(v:unknown)=>finite(v)?v>0?'UP':v<0?'DOWN':'FLAT':'UNKNOWN';
const topicNames:Record<string,string>={INFLATION:'Inflation',MONETARY_POLICY:'Fed / Geldpolitik',BOND_YIELDS:'Anleiherenditen',LABOUR:'Arbeitsmarkt',GROWTH:'Wachstum / Konjunktur',EARNINGS:'Unternehmenszahlen',GEOPOLITICS:'Geopolitik'};
/** Display-only projection. Entry labels describe existing app permissions, never grant new ones. */
export function instrumentDashboard(report:AIResearchReport,instrument:Instrument,frameCurrent:boolean,modelStance?:string){
 const market=instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ',prefix=market==='NASDAQ'?'N-F':'R-F',favorable=instrument==='NASDAQ_PUT'?'DOWN':'UP',name=instrument==='NASDAQ_PUT'?'Nasdaq Put':instrument==='NASDAQ_CALL'?'Nasdaq Call':'Russell Call';
 const stamp=report.appFacts?.snapshotTimestamp??'';
 const rawFacts=frameCurrent?(report.appFacts?.facts??[]).filter(f=>f.status!=='MISSING'&&f.asOf!==null&&Number.isFinite(Date.parse(f.asOf))&&Date.parse(f.asOf)<=Date.parse(stamp)):[];
 const usable=rawFacts.filter(f=>rawFacts.filter(other=>other.id===f.id).length===1);
 const own=usable.filter(f=>f.market===market);
 const one=(id:string)=>{const rows=own.filter(f=>f.id===id);return rows.length===1?rows[0]:null;};
 const close=one(prefix+'-CLOSE'),closeValue=finite(close?.values.close)&&close!.values.close>0?close!.values.close:null;
 const windows=[1,5,20].map(count=>{const f=one(prefix+'-WINDOW-'+count),v=obj(f?.values),valid=closeValue!==null&&f?.asOf===close?.asOf&&v.sessions===count&&v.toDate===close?.asOf&&typeof v.fromDate==='string'&&Number.isFinite(Date.parse(v.fromDate))&&v.fromDate<v.toDate&&finite(v.returnPct);return {intervals:count,returnPct:valid?v.returnPct as number:null,fromDate:valid?v.fromDate:null,toDate:valid?v.toDate:null,direction:valid?sign(v.returnPct):'UNKNOWN',effect:!valid||v.returnPct===0?'NEUTRAL':sign(v.returnPct)===favorable?'FAVORABLE':'ADVERSE'};});
 const flowRows=report.decisionSupport?.flows.filter(f=>f.instrument===name)??[],flow=flowRows.length===1?flowRows[0]:null;
 const execution=typeof flow?.execution==='string'?flow.execution:'UNKNOWN';
 const activeExecutions=['SMALL STARTER','PARTIAL SIZE','FULL SIZE','BUILD POSITION','ADD POSITION','FULL LONG'];
 const approved=frameCurrent&&flow?.eligible===true&&finite(flow.modelSize)&&flow.modelSize>0&&flow.modelSize<=100&&activeExecutions.includes(execution);
 const putTiming=instrument==='NASDAQ_PUT'?obj(usable.find(f=>f.id==='G-PUT_TIMING'&&f.market==='SHARED')?.values.context):{};
 const explicitPreparation=frameCurrent&&!approved&&instrument==='NASDAQ_PUT'&&['EARLY','BUILD','STRONG'].includes(putTiming.timing)&&['DEFENSIVE_BUILD','STRUCTURAL_BUILD','TACTICAL_BUILD','STRONG_BUILD'].includes(putTiming.decision);
 const unclassifiedPermission=frameCurrent&&flow?.eligible===true&&finite(flow.modelSize)&&flow.modelSize>0&&flow.modelSize<=100&&!approved;
 const status=!frameCurrent?{code:'UNAVAILABLE',label:'Datenstand prüfen',tone:'neutral',reason:'Kein passender aktueller App-Datenstand.'}:approved?{code:'APP_APPROVED',label:execution==='SMALL STARTER'?'Kann starten · App-Freigabe':['BUILD POSITION','ADD POSITION'].includes(execution)?'Ausbau freigegeben · App':'App-Freigabe aktiv',tone:'good',reason:'TradeStack, Timing und Positionsmodell melden diesen Flow als freigegeben.'}:unclassifiedPermission?{code:'APP_PERMISSION_REVIEW',label:'App-Freigabe / Ausführung prüfen',tone:'watch',reason:'Freigabe mit positiver Modellgröße geliefert, Ausführungsmodus hier nicht eindeutig als Einstieg zugeordnet.'}:explicitPreparation?{code:'APP_PREPARATION',label:'In Anbahnung · noch keine Freigabe',tone:'watch',reason:'Das eigene Put-Timing meldet Vorbereitung; der Flow ist noch nicht gemeinsam freigegeben.'}:modelStance==='CONTEXT_SUPPORTS'?{code:'MODEL_INTEREST',label:'KI sieht Potenzial · noch nicht starten',tone:'watch',reason:'Stützende KI-Kontexteinordnung, aber keine App-Freigabe. Keine bestätigte frühe Einstiegsphase.'}:{code:'WATCH',label:'Beobachten · kein Einstieg frei',tone:'neutral',reason:flow?.reason??'Keine passende gemeinsame App-Freigabe vorhanden.'};
 const cot=own.filter(f=>f.domain==='COT'&&new RegExp('^'+prefix+'-COT\\d+$').test(f.id)).map(f=>{
  const v=obj(f.values),net=finite(v.net)?v.net:null,changes=(Array.isArray(v.changes)?v.changes:[]).map(obj);
  const change=(weeks:number)=>{const rows=changes.filter(c=>c.weeks===weeks);if(rows.length!==1)return {delta:null,previous:null,valid:false};const c=rows[0],consistent=finite(c.delta)&&finite(c.previous)&&net!==null&&Math.abs(net-c.previous-c.delta)<1e-7;return {delta:finite(c.delta)?c.delta:null,previous:consistent?c.previous:null,valid:consistent};};
  return {id:f.id,group:v.group==='LEVERAGED_MONEY'?'Leveraged Money':v.group==='ASSET_MANAGER'?'Asset Manager':'Gruppe unbekannt',asOf:f.asOf,net,state:net===null?'unbekannt':net>0?'Netto long':net<0?'Netto short':'Netto null',week:change(1),fourWeeks:change(4),text:f.text,priceDirectionInferred:false};
 });
 const frames=frameCurrent?buildScenarioEvidenceFrame(usable,stamp).rows:[];
 const pnf=[0,1].map(scale=>{
  const id=prefix+'-PF'+scale+'-LAST',f=one(id),r=frames.find(r=>r.sourceId===id),forming=one(prefix+'-PF'+scale+'-FORM'),fr=frames.find(r=>r.sourceId===forming?.id);
  const scaleRows=frames.filter(r=>r.market===market&&new RegExp('^'+prefix+'-PF'+scale+'-(LAST|ADV|FORM)$').test(r.sourceId)),columns=[...new Set(scaleRows.map(r=>r.columnDirection).filter(Boolean))];
  const column=columns.length===1?columns[0]:null;
  const condition=one(prefix+'-PF'+scale+'-FORM-TRIGGER'),cv=obj(condition?.values);
  const open=forming&&condition&&condition.asOf===forming.asOf&&cv.state==='OPEN'&&cv.role==='PATTERN_TRIGGER'&&['UP','DOWN'].includes(cv.direction)&&finite(cv.price)&&cv.price>0?{price:cv.price,direction:cv.direction,id:condition.id}:null;
  const grid=/P&F ([0-9.]+) %, ([0-9]+) Umkehrboxen/.exec(f?.text??forming?.text??'');
  return {id,scaleLabel:grid?grid[1].replace('.',',')+' % · '+grid[2]+' Boxen':'Skala '+(scale+1)+' · Rasterdetails öffnen',available:!!f||!!forming,asOf:f?.asOf??forming?.asOf??null,historicalDirection:r?.historicalDirection??null,historicalStatus:r?.status??'UNKNOWN',columnDirection:column,columnRelation:r?.columnRelation??'UNKNOWN',triggerSatisfied:r?.currentConditionSatisfied??null,effect:!column?'NEUTRAL':column===favorable?'FAVORABLE':'ADVERSE',forming:forming?{direction:fr?.historicalDirection??null,trigger:open}:null,text:f?.text??null,formingText:forming?.text??null};
 });
 const known=pnf.filter(p=>p.available&&p.columnDirection),effects=new Set(known.map(p=>p.effect));
 const pnfSummary=!known.length?'P&F-Richtung nicht eindeutig':effects.size>1?'P&F: gemischte Säulenlage':effects.has('FAVORABLE')?'P&F-Säule stützt die Idee':'P&F-Säule liefert Gegenwind';
 const relevance=(f:any)=>{const v=obj(f.values),source=report.sources.find(s=>s.url===v.url),title=source?.title??f.text.split(/\. Nur Überschrift;|\. Auszug:/)[0];return newsRelevance(title,source?.summary??'',market);};
 const newsCandidates=usable.filter(f=>f.domain==='Nachrichten'&&f.market==='SHARED');
 const newsFacts=newsCandidates.filter(f=>relevance(f).eligibleForBrief&&Array.isArray(obj(f.values).marketHints)&&(obj(f.values).marketHints.includes(market)||obj(f.values).marketHints.includes('SHARED_MACRO'))).sort((a,b)=>Number(Date.parse(stamp)-Date.parse(a.asOf!)>168*3600000)-Number(Date.parse(stamp)-Date.parse(b.asOf!)>168*3600000)||relevance(a).priority-relevance(b).priority||Date.parse(b.asOf!)-Date.parse(a.asOf!)||a.id.localeCompare(b.id));
 const shared=(id:string)=>obj(usable.find(f=>f.id===id&&f.market==='SHARED')?.values.context);
 const hist=shared('G-APP_HISTORY'),risk=shared('G-CRASH'),credit=shared('G-CREDIT');
 const contextNotes:string[]=[];
 if(hist.legacyTimeBasis)contextNotes.push('Historische Tageszähler sind gespeicherte Beobachtungstage, keine verifizierte Zahl von Börsensitzungen.');
 if(obj(hist.datedComparisons).policy==='DATED_OBSERVED_SESSION_COMPARISONS_V1'&&obj(hist.datedComparisons).price5dAvailable!==true)contextNotes.push('Datierter SPX-Vergleich fehlt; keine ersatzweise als 5 Sitzungen ausgegebene Snapshot-Differenz.');
 if(hist.persistentDistribution===true||hist.prolongedBearRegime===true||obj(putTiming.meta).persistentDistribution===true)contextNotes.push('Gespeicherte Distributionshistorie wirkt nach. Aktuelle Verbesserung und historische Belastung sind verschiedene Zeitebenen.');
 if(instrument==='NASDAQ_PUT'&&obj(putTiming.meta).earlyStructuralTrigger===true&&obj(putTiming.meta).earlyCurrentTrigger===false)contextNotes.push('Put-Vorbereitung stammt aus dem strukturellen Regelzweig; der separate aktuelle Frühtrigger ist nicht erfüllt.');
 if(Object.keys(risk).length)contextNotes.push('Crashwert ist ein Modellindikator; keine kalibrierte Ereigniswahrscheinlichkeit.');
 if(Object.keys(credit).length&&credit.dateAlignmentVerified!==true)contextNotes.push('Kreditindikator: Datumsabgleich HYG/IEF ist nicht verifiziert.');

 const news=newsFacts.slice(0,2).map(f=>{const v=obj(f.values),source=report.sources.find(s=>s.url===v.url),title=source?.title??f.text.split(/\. Nur Überschrift;|\. Auszug:/)[0],url=typeof v.url==='string'?v.url:null;return {id:f.id,title,asOf:f.asOf,publisher:typeof v.publisher==='string'?v.publisher:null,url,contentLevel:v.contentLevel==='EXCERPT'?'Auszug':'Nur Überschrift',olderContext:Date.parse(stamp)-Date.parse(f.asOf!)>168*3600000,scope:Array.isArray(v.marketHints)&&v.marketHints.includes(market)?'Indexbezug laut Quellenmerkmal':'Gemeinsamer Makrokontext',text:f.text};});
 const topics=[...new Set(newsFacts.slice(0,2).flatMap(f=>{const h=obj(f.values).topicHints;return Array.isArray(h)?h.filter((t:unknown)=>typeof t==='string'&&topicNames[t as string]).map((t:string)=>topicNames[t]):[];}))];
 return {version:'INSTRUMENT_DASHBOARD_V3',contextNotes,newsOmitted:newsCandidates.length-newsFacts.length,market,favorableDirection:favorable,status,appModelSize:approved?flow!.modelSize:null,execution,blockReason:approved?null:flow?.reason??null,index:{close:closeValue,asOf:close?.asOf??null,label:'Letzter abgeschlossener Indexschluss',windows},cot,pnf,pnfSummary,news,newsSummary:topics.length?'Im Fokus: '+topics.join(', ')+'. Keine verifizierte Marktreaktion geliefert.':news.length?'Datierte Meldungen dieses Quellenstands; Wirkung auf den Index nicht festgestellt.':'Keine passende datierte Nachricht im Quellenstand verfügbar.',sourceSnapshot:stamp,modelRequestsUsed:0,entryPermissionChanged:false,limits:'Stand des gespeicherten Berichts, keine Livekurse. Veränderungszeiträume bleiben getrennt. COT-Farben zeigen Bestandsverschiebung, keinen Preisbeweis. P&F-Facetten ersetzen keine App-Freigabe.'};
}
