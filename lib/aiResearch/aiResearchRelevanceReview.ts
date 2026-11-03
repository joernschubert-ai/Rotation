/** Offline review of an already validated canonical view. Never a model judge, score, or repaired selection. */
type Source={id:string;market:string;domain?:string;asOf:string|null;text:string;values?:Record<string,unknown>};
type Choice={order:number;side:string;sourceId:string;source:Source};
type Input={canonicalView:{snapshotTimestamp:string;sourceChoiceProvenance:string;markets:Array<{market:string;priceAndStructure:Array<Source|null>;domainSources:Array<Source|null>}>};priorities:Array<{instrument:string;arguments:Choice[];changeCondition:unknown}>};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
function closeOf(s:Source|undefined){
 const supplied=s?.values?.close;
 if(finite(supplied))return supplied;
 // Only the explicit canonical close sentence, never an inferred chart target or date.
 const token=s?.text.match(/^Abgeschlossener Schlusskurs (-?\d+(?:\.\d+)?);/)?.[1];
 return token===undefined?null:Number(token);
}
function maOf(s:Source){
 if(finite(s.values?.average))return s.values.average;
 const token=s.text.match(/\bMA(?:20|50|200) (-?\d+(?:\.\d+)?)(?:\.| )/)?.[1];
 return token===undefined?null:Number(token);
}
function patternStatus(s:Source){
 const forming=/\bFORMING\b/.test(s.text);
 const historical=/CONFIRMED = HISTORISCH/.test(s.text);
 const trigger=s.text.match(/(?:Bedingung jetzt|Trigger jetzt) (true|false|unbekannt)\b/)?.[1];
 const column=/Säule gegenläufig|COUNTER_TO_CURRENT_COLUMN/.test(s.text)?'COUNTER':/Säule gleichgerichtet|ALIGNED_WITH_CURRENT_COLUMN/.test(s.text)?'ALIGNED':'UNKNOWN';
 const date=s.text.match(/Auslösung (\d{4}-\d{2}-\d{2})\b/)?.[1];
 const end=s.asOf?Date.parse(s.asOf):NaN,start=date?Date.parse(date):NaN;
 const age=Number.isFinite(end)&&Number.isFinite(start)&&end>=start?Math.floor((end-start)/86400000):null;
 return {formation:forming?'FORMING_UNTRIGGERED':historical?'HISTORICAL_TRIGGER':/\bCONFIRMED\b/.test(s.text)?'CONFIRMED_RECORD':'OTHER_OR_UNKNOWN',currentPriceCondition:trigger==='true'?'MET':trigger==='false'?'NOT_MET':'UNKNOWN',column,triggerAgeCalendarDaysAtChart:age,
  limit:'Historical trigger, current column and current price condition remain separate. No fresh confirmation or reversal inferred.'};
}
export function reviewRelevance(input:Input){
 const markets=input.canonicalView.markets;
 return {version:'OFFLINE_RELEVANCE_REVIEW_V1',scope:'SAVED_CANONICAL_SELECTION_ONLY',snapshotTimestamp:input.canonicalView.snapshotTimestamp,sourceChoiceProvenance:input.canonicalView.sourceChoiceProvenance,
  instruments:input.priorities.map(row=>{
   const market=row.instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ';
   const own=markets.find(m=>m.market===market),states=(own?.priceAndStructure??[]).filter((s):s is Source=>!!s),closeSource=states.find(s=>/-F-CLOSE$/.test(s.id)),close=closeOf(closeSource);
   const selected=new Set(row.arguments.map(a=>a.sourceId));
   const cards=row.arguments.map(a=>{
    const s=a.source,ma=/-F-MA(?:20|50|200)$/.test(s.id),pf=/-F-PF[01]-(?:LAST|FORM|ADV)$/.test(s.id);
    const average=ma?maOf(s):null;
    const sameObservation=!!s.asOf&&s.asOf===closeSource?.asOf;
    const distance=sameObservation&&finite(close)&&finite(average)&&average>0?{close,average,points:close-average,pctOfAverage:(close/average-1)*100}:null;
    return {modelOrder:a.order,modelSide:a.side,sourceId:s.id,asOf:s.asOf,canonicalText:s.text,
     role:ma?'PRICE_RELATION':pf?'PNF_PATTERN_STATE':s.id==='G-PUT_TIMING'?'DERIVED_APP_TIMING_CONTEXT':'OTHER_APP_FINDING',
     sharedBasisGroup:ma||pf?market+':SAME_INDEX_PRICE_SERIES':null,
     distance,pattern:pf?patternStatus(s):null,
     caution:ma?'Die MA-Seite ist eine Zahlenrelation, keine Signalstärke, Steigung, neuer Bruch oder geprüfte Unterstützung.':pf?'Der Musterzustand beruht auf derselben Index-Preisreihe; daraus folgt kein unabhängiger Zusatzbeweis.':s.id==='G-PUT_TIMING'?'Supplied app decision context is not an independent market observation or entry approval.':null};
   });
   const sides=row.arguments.map(a=>a.side),sideRuns=sides.reduce((n,s,i)=>n+(i===0||s!==sides[i-1]?1:0),0);
   return {instrument:row.instrument,cards,changeCondition:row.changeCondition,
    reviewNotes:{sideRuns,sideBlockOrder:sides.length>1&&new Set(sides).size>1&&sideRuns===2,
     sideBlockMeaning:'Describes list structure only; grouping by side neither proves nor disproves relevance quality.',
     unselectedPriceStructureReferences:states.filter(s=>!selected.has(s.id)&&!/-F-CLOSE$/.test(s.id)).map(s=>s.id),
     omissionMeaning:'Unselected references remain available. No mandatory domain coverage or error is inferred.',
     neutralContextSources:(own?.domainSources??[]).filter((s):s is Source=>!!s).map(s=>s.id),
     neutralContextUse:'PRESENT_IN_APP_BUT_MODEL_USE_NOT_VERIFIED',
     dependencyMeaning:'Same price-series provenance is not measured correlation. Source count is not independent evidence count.'}};
  }),rankingQuality:'NOT_AUTOMATICALLY_VERIFIED',sourceOrderChanged:false,originalChanged:false,tradePermission:'NOT_DERIVED',modelRequestsUsed:0};
}
