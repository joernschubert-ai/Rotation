import type {prepareContextTrial} from './aiResearchContextTrial';
import {buildCanonicalContextView} from './aiResearchCanonicalView';
import {reviewRelevance} from './aiResearchRelevanceReview';
type Prepared=ReturnType<typeof prepareContextTrial>;
/** Tables preserve every original property and value. No statistic, note or null is omitted. */
function table(rows:Array<Record<string,unknown>>){
 const columns=[...new Set(rows.flatMap(r=>Object.keys(r)))];
 // The encoder only accepts homogeneous records: absence must never become null.
 if(rows.some(r=>columns.some(k=>!Object.hasOwn(r,k))))throw Error('COMPACT_HETEROGENEOUS_RECORDS');
 const objectColumns:Record<string,string[]>={};
 for(const k of columns){const values=rows.map(r=>r[k]);if(values.length>1&&values.every(v=>v!==null&&typeof v==='object'&&!Array.isArray(v))){const keys=Object.keys(values[0] as object);if(values.every(v=>JSON.stringify(Object.keys(v as object))===JSON.stringify(keys)))objectColumns[k]=keys;}}
 return {columns,objectColumns,rows:rows.map(r=>columns.map(k=>objectColumns[k]?objectColumns[k].map(key=>(r[k] as Record<string,unknown>)[key]):r[k]))};
}
function records(t:ReturnType<typeof table>){return t.rows.map(row=>Object.fromEntries(t.columns.map((k,i)=>[k,t.objectColumns[k]?Object.fromEntries(t.objectColumns[k].map((key,j)=>[key,(row[i] as unknown[])[j]])):row[i]])));}
export function packNeutral(neutral:Record<string,Array<Record<string,unknown>>>){
 const packed=Object.fromEntries(Object.entries(neutral).map(([key,rows])=>[key,table(rows)]));
 if(JSON.stringify(unpackNeutral(packed))!==JSON.stringify(neutral))throw Error('COMPACT_ROUNDTRIP_FAILED');
 return packed;
}
export function unpackNeutral(packed:Record<string,ReturnType<typeof table>>){return Object.fromEntries(Object.entries(packed).map(([k,t])=>[k,records(t)]));}
export function appRelevance(p:Prepared){
 const canonicalView=buildCanonicalContextView(p);
 // This is an app catalogue, not a fabricated model choice. No order/side is used as model evidence.
 const priorities=['NASDAQ_PUT','RUSSELL_CALL'].map(instrument=>{
  const market=instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ';
  const sources=p.context.facts.facts.filter(s=>s.market===market&&/^[NR]-F-(?:MA20|MA50|MA200|PF[01]-(?:LAST|FORM|ADV))$/.test(s.id)&&p.observedIds.includes(s.id));
  return {instrument,arguments:sources.map((source,index)=>({order:index+1,side:'APP_CATALOGUE_ONLY',sourceId:source.id,source})),changeCondition:null};
 });
 const reviewed=reviewRelevance({canonicalView,priorities});
 return {version:'APP_RELEVANCE_FACTS_V1',origin:'APP_CALCULATED_NOT_MODEL',snapshotTimestamp:p.context.facts.snapshotTimestamp,
  sources:reviewed.instruments.flatMap(r=>r.cards.map(({modelOrder,modelSide,...fact})=>fact)),
  timingContext:{sourceId:'G-PUT_TIMING',meaning:'Abgeleiteter App-Kontext, kein unabhängiger Marktbeweis oder neue Einstiegserlaubnis.'},
  limits:'MA-Abstand ist keine Signalstärke/Steigung. Musteralter ist kein Verfall. Gleiche Preisreihe ist keine gemessene Korrelation. Keine festen Gewichte oder unabhängigen Stimmen.'};
}
export function compactRelevanceUser(original:string,relevance:ReturnType<typeof appRelevance>){
 const lines=original.split('\n'),at=lines.findIndex(line=>line.startsWith('{"cot":'));
 if(at<0)throw Error('COMPACT_NEUTRAL_SECTION_MISSING');
 const neutral=JSON.parse(lines[at]);
 if(Object.keys(neutral).join(',')!=='cot,history,groupComparisons')throw Error('COMPACT_NEUTRAL_KEYS');
 const packed=packNeutral(neutral),replacement='APP_KONTEXT_TABELLEN: columns sind Feldnamen für rows-Werte. objectColumns gibt Feldnamen für entsprechend eingebettete Objekt-Wertearrays an. Alle Originalfelder/Werte einschließlich null bleiben erhalten. '+JSON.stringify(packed);
 lines[at]=replacement;
 const forms:Record<string,string>={FORMING_UNTRIGGERED:'F',HISTORICAL_TRIGGER:'H',CONFIRMED_RECORD:'C',OTHER_OR_UNKNOWN:'U'};
 const traits={ma:relevance.sources.filter(f=>f.distance).map(f=>[f.sourceId,f.distance!.points,f.distance!.pctOfAverage]),
  pnf:relevance.sources.filter(f=>f.pattern).map(f=>[f.sourceId,forms[f.pattern!.formation],f.pattern!.currentPriceCondition==='MET'?true:f.pattern!.currentPriceCondition==='NOT_MET'?false:null,f.pattern!.column==='ALIGNED'?'A':f.pattern!.column==='COUNTER'?'C':'U',f.pattern!.triggerAgeCalendarDaysAtChart])};
 const appendix='APP_BELEGMERKMALE: ma=[id,SchlussMinusMA_Punkte,AbstandProzentDerMA]; pnf=[id,Status,Preisbedingung,Säule,AuslösungsalterKalendertageAmChartstand]. Status F=FORMING/nicht ausgelöst,H=historisch,C=CONFIRMED-Datensatz,U=unbekannt; Säule A=gleichgerichtet,C=gegenläufig,U=unbekannt. null nicht ergänzen. Abstand ist keine Signalstärke, Alter kein Verfall. MA/P&F desselben Index teilen Preisdatengrundlage; keine unabhängigen Stimmen. Put-Timing ist abgeleiteter App-Kontext. '+JSON.stringify(traits);
 const user=lines.join('\n')+'\n'+appendix;
 if(user.length>26000)throw Error('COMPACT_RELEVANCE_INPUT_LIMIT:'+user.length);
 return {user,stats:{originalCharacters:original.length,compactContextCharacters:replacement.length,originalContextCharacters:lines[at]===replacement?original.split('\n')[at].length:0,finalCharacters:user.length,limit:26000,remainingCharacters:26000-user.length},
  preservation:{neutralRoundTrip:true,otherLinesUnchanged:true,sourceFactsChanged:false,permissionsChanged:false,conditionsChanged:false}};
}
