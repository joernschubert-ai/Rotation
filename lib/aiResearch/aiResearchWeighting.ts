import type { SynthesisEvidence } from './aiResearchSynthesisEvidence';
import { buildInstrumentBriefs } from './aiResearchInstrumentBriefs';

export const WEIGHT_POLICY='RESEARCH_START_WEIGHTS_35_35_10_15_5_V2';
export const BLOCK_WEIGHTS={APP:35,CHART:35,COT:10,HISTORY:15,NEWS:5} as const;
export type WeightBlock=keyof typeof BLOCK_WEIGHTS;
export type BlockReading='SUPPORTS'|'OPPOSES'|'MIXED'|'UNKNOWN';
export type MarketReading='BULLISH'|'BEARISH'|'MIXED'|'UNKNOWN';
export type MarketEvaluations=Partial<Record<WeightBlock,{reading:MarketReading;reason:string}>>;
export interface ContributionOrigin { source:'SHARED_INDEX_CONTEXT'|'LEGACY_INSTRUMENT';evaluations?:MarketEvaluations;notes?:string[];unresolved?:WeightBlock[]; }
type Instrument='NASDAQ_PUT'|'NASDAQ_CALL'|'RUSSELL_CALL';
type Market='NASDAQ'|'RUSSELL_2000';
const keys=Object.keys(BLOCK_WEIGHTS) as WeightBlock[];
const obj=(v:unknown):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:null;
const str=(v:unknown,n=220)=>typeof v==='string'?v.trim().slice(0,n):'';
const round=(v:number)=>Math.round(v*100)/100;
const validDay=(value:string)=>{const time=Date.parse(value+'T00:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===value;};
export interface WeightedNews {
 id:string; title:string;summary:string;publisher:string;url:string;publishedAt:string;
 relevance:'HIGH'|'MEDIUM'|'LOW';factor:number;reason:string;eventKey:string;
 fullArticleVerified:false;direction:'NOT_DETERMINED';eventRiskReview:boolean;
}
function titleKey(title:string){return title.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();}
function canonicalUrl(value:unknown){try{const u=new URL(String(value));if(!['http:','https:'].includes(u.protocol))return '';u.hash='';for(const key of Array.from(u.searchParams.keys()))if(/^(utm_|gclid|fbclid)/i.test(key))u.searchParams.delete(key);return u.toString();}catch{return '';}}
/** Lexical index relevance is explicit and testable; it does not infer surprise, truth or price direction. */
export function classifyNewsRelevance(title:string,summary:string,market:Market){
 const value=title+' '+summary;
 const own=market==='NASDAQ'?/\bnasdaq(?:[ -]?100)?\b|\b(?:nvidia|microsoft|apple|amazon|alphabet|google|meta platforms|tesla|broadcom|semiconductor|semiconductors|halbleiter|chipmaker|chipmakers)\b/iu:/\brussell(?:[ -]?2000)?\b|\bsmall[ -]?caps?\b|\bregional banks?\b|regionalbanken|kleinunternehmen|smaller companies|small businesses/iu;
 const macro=/\b(?:fed|fomc|ecb|inflation|cpi|payrolls|unemployment|recession|tariffs?|sanctions?|war|wars|oil|treasur(?:y|ies)|interest rates?|rate cuts?|rate hikes?|liquidity)\b|zinsentscheid|zinsen|arbeitsmarkt|rezession|zölle|krieg|sanktion|ölpreis|kreditvergabe|credit availability/iu;
 const driver=/\b(?:earnings|guidance|export|restriction|restrictions|tariffs?|sanctions?|war|inflation|fed|fomc|credit|loans?|merger|acquisition)\b|quartalszahlen|ausblick|export|zinsentscheid|kredit|krieg|zölle/iu;
 const recap=/\b(?:rises?|falls?|gains?|drops?|rall(?:y|ies)|selloff|sell-off|stocks? (?:today|close)|market recap)\b|steigt|fällt|steig[et]n|fallen|tagesrückblick/iu;
 if(own.test(value)&&recap.test(title)&&!driver.test(value))return {relevance:'LOW' as const,factor:0.2,reason:'Kursrückblick mit Indexbezug; kein neuer Auslöser aus dem gelieferten Text erkennbar.'};
 if(own.test(value))return {relevance:'HIGH' as const,factor:1,reason:'Direkter Index-, Branchen- oder Unternehmensbezug im gelieferten Text; Wirkungsstärke noch nicht nachgewiesen.'};
 if(macro.test(value))return {relevance:'MEDIUM' as const,factor:0.5,reason:'Möglicher makroökonomischer Übertragungsweg; konkrete Indexwirkung muss begründet werden.'};
 return {relevance:'LOW' as const,factor:0.2,reason:'Allgemeiner Kontext ohne erkannten direkten Indexbezug.'};
}
export function selectWeightedNews(evidence:SynthesisEvidence[],market:Market,reference:string){
 const at=Date.parse(reference),seenUrl=new Set<string>(),seenTitle=new Map<string,number>();
 const selected:WeightedNews[]=[];let excluded=0,duplicates=0;
 const sourceRows=evidence.filter(e=>e.kind==='NEWS'&&e.available).slice().sort((a,b)=>String(b.data.publishedAt??'').localeCompare(String(a.data.publishedAt??'')));
 for(const row of sourceRows){
  const d=obj(row.data),title=str(d.title,240),publishedAt=str(d.publishedAt,40),time=Date.parse(publishedAt),url=canonicalUrl(d.url),key=titleKey(title);
  if(!title||!url||!validDay(publishedAt.slice(0,10))||!/(?:Z|[+-]\d{2}:\d{2})$/.test(publishedAt)||!Number.isFinite(at)||!Number.isFinite(time)||time>at||at-time>7*86400000){excluded++;continue;}
  const prior=seenTitle.get(key);
  if(seenUrl.has(url)||(prior!==undefined&&Math.abs(prior-time)<=2*86400000)){duplicates++;continue;}
  seenUrl.add(url);seenTitle.set(key,time);
  const summary=str(d.summary,300),classification=classifyNewsRelevance(title,summary,market);
  selected.push({id:row.id,title,summary,publisher:str(d.publisher,80),url,publishedAt,...classification,eventKey:key,fullArticleVerified:false,direction:'NOT_DETERMINED',eventRiskReview:/\b(?:war|fomc|sanctions?|invasion|missile|emergency|default)\b|krieg|notfall|sanktion|zinsentscheid|zahlungsausfall/iu.test(title+' '+summary)});
 }
 selected.sort((a,b)=>b.factor-a.factor||b.publishedAt.localeCompare(a.publishedAt)||a.id.localeCompare(b.id));
 return {items:selected.slice(0,3),eligibleEvents:selected.length,omitted:Math.max(0,selected.length-3),excluded,duplicates,
  relevanceFactor:selected.length?selected[0].factor:0,
  limits:'Dedupliziert nach URL oder gleichem normalisiertem Titel binnen 48 Stunden, keine vollständige ereignisübergreifende Semantik. Nur gelieferte Überschrift/RSS-Zusammenfassung, kein Volltext oder vollständiger Nachrichtenstrom. Ereigniszeit, Überraschung und Einpreisung nicht festgestellt. Aktualitätsgrenze sieben Kalendertage; keine Vollständigkeitsgarantie.'};
}
export function buildWeightingContexts(evidence:SynthesisEvidence[],reference:string){
 const app=obj(evidence.find(e=>e.id==='APP'&&e.available)?.data),structures=obj(app.instrumentStructure);
 const at=Date.parse(reference),fresh=(date:unknown,maxDays:number)=>{if(typeof date!=='string'||!validDay(date))return false;const time=Date.parse(date+'T00:00:00Z');return Number.isFinite(at)&&Number.isFinite(time)&&time<=at&&at-time<=maxDays*86400000;};
 return buildInstrumentBriefs(evidence).map(b=>{
  const market:Market=b.instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ',own=obj(structures[market]);
  const breadth=obj(own.breadth),rawBreadth=['b20','b50','b200'].map(k=>num(breadth[k])??num(obj(breadth[k]).value));
  const validPercent=(v:unknown)=>{const n=num(v);return n!==null&&n>=0&&n<=100;};
  const structureKnown=!fresh(own.referenceDate,5)||(market==='RUSSELL_2000'&&own.available!==true)?0:[...rawBreadth,own.participation,own.quality].filter(validPercent).length;
  const chartEvidence=evidence.find(e=>e.id==='CHART_'+market&&e.available&&fresh(e.data.asOfDate,5)),chart=obj(chartEvidence?.data),momentum=obj(chart.momentum);
  const chartKnown=chartEvidence?[obj(momentum.fast).returnPct,obj(momentum.slow).returnPct,...(Array.isArray(chart.movingAverages)?chart.movingAverages:[]).slice(0,3).map(m=>obj(m).distancePct)].filter(v=>num(v)!==null).length:0;
  const cot=b.cot.filter(c=>fresh(c.reportDate,14)&&num(c.netPosition)!==null&&num(c.weeklyChange)!==null);
  const latestDate=cot.map(c=>c.reportDate).sort().reverse()[0];
  const cotKnown=new Set(cot.filter(c=>c.reportDate===latestDate).map(c=>c.group)).size;
  const history=b.histories.find(h=>h.family==='OWN_TREND'&&h.currentMatch&&fresh(h.asOfDate,5)&&h.sampleSize>0&&h.meanPct!==null&&h.baselineMeanPct!==null);
  const news=selectWeightedNews(evidence,market,reference);
  const fractions:Record<WeightBlock,number>={APP:Math.min(1,structureKnown/5),CHART:Math.min(1,chartKnown/5),COT:Math.min(1,cotKnown/2),HISTORY:history?1:0,NEWS:news.relevanceFactor};
  const issues:Record<WeightBlock,string>={APP:'Eigene Breite 20/50/200, Teilnahme und Qualität; keine Nasdaq-Struktur als Russell-Ersatz. Gemeinsame Kursursprünge sind abhängig.',CHART:'Abgeschlossene eigene Kurse, Momentum und MA-Abstände; mehrere Preisindikatoren sind keine unabhängigen Stimmen.',COT:'Zwei datierte TFF-Gruppen mit Wochenänderung, keine Legacy-Commercials-/Kleinanlegeranalyse oder bewiesene Kurswirkung.',HISTORY:'Nur zum beobachteten Snapshot-Markttag passender OWN_TREND-Vergleich; überlappende Indexrenditen, keine Optionsrendite oder validierte Prognose.',NEWS:'Relevanz HIGH 100 %, MEDIUM 50 %, LOW 20 % innerhalb des 5-%-Blocks; stärkste zulässige Relevanz zählt, nicht Artikelanzahl. Richtung und Wirkungsstärke bleiben Interpretation.'};
  return {instrument:b.instrument,market,policy:WEIGHT_POLICY,reference,horizon:'20_TRADING_SESSIONS_CONTEXT_NOT_FORECAST',blocks:keys.map(key=>({key,baseWeight:BLOCK_WEIGHTS[key],dataFraction:round(fractions[key]),effectiveWeight:round(BLOCK_WEIGHTS[key]*fractions[key]),limitation:issues[key]})),news};
 });
}
export type WeightingContext=ReturnType<typeof buildWeightingContexts>[number];
export function parseBlockReadings(raw:string|undefined):Partial<Record<WeightBlock,BlockReading>>{
 if(typeof raw!=='string')return {};
 const result:Partial<Record<WeightBlock,BlockReading>>={},seen=new Set<string>();
 for(const token of raw.split(';')){
  const m=/^\s*(APP|CHART|COT|HISTORY|NEWS)\s*=\s*(SUPPORTS|OPPOSES|MIXED|UNKNOWN)\s*$/.exec(token);
  if(!m)return {};
  if(seen.has(m[1]))return {};seen.add(m[1]);result[m[1] as WeightBlock]=m[2] as BlockReading;
 }
 return result;
}
/** Fixed arithmetic on model-selected qualitative readings; not empirical alpha or automatic permission. */
export function applyResearchWeights(instrument:Instrument,readings:Partial<Record<WeightBlock,BlockReading>>,context:WeightingContext,origin?:ContributionOrigin){
 if(context.instrument!==instrument)throw Error('Weighting instrument mismatch');
 const blocks=context.blocks.map(block=>{
  const selected=readings[block.key],reading:BlockReading=block.effectiveWeight===0||origin?.unresolved?.includes(block.key)?'UNKNOWN':selected??'UNKNOWN';
  const signed=reading==='SUPPORTS'?1:reading==='OPPOSES'?-1:reading==='MIXED'?0:null;
  return {...block,reading,contribution:signed===null?null:round(block.effectiveWeight*signed),modelSelectedReading:origin?.source==='SHARED_INDEX_CONTEXT'?null:selected??null,readingOrigin:origin?.source==='SHARED_INDEX_CONTEXT'?'SERVER_FROM_MARKET' as const:'MODEL_INSTRUMENT' as const,marketReading:origin?.evaluations?.[block.key]?.reading??null,reason:origin?.evaluations?.[block.key]?.reason??null,needsClarification:origin?.unresolved?.includes(block.key)??false};
 });
 const assessedWeight=round(blocks.filter(b=>b.contribution!==null).reduce((s,b)=>s+b.effectiveWeight,0)),availableWeight=round(blocks.reduce((s,b)=>s+b.effectiveWeight,0));
 return {policy:WEIGHT_POLICY,instrument,horizon:context.horizon,blocks,availableWeight,assessedWeight,unassessedWeight:round(100-assessedWeight),
  assessedBalance:assessedWeight?round(blocks.reduce((s,b)=>s+(b.contribution??0),0)):null,
  status:assessedWeight===100?'COMPLETE' as const:assessedWeight>0?'PARTIAL' as const:'UNASSESSED' as const,
  news:context.news,source:origin?.source??'LEGACY_INSTRUMENT',reviewNotes:origin?.notes??[],automaticExecution:false,predictiveEdgeValidated:false,
  meaning:'Feste Gewichtspunkte aus qualitativer KI-Beurteilung der Instrumentthese. MIXED heißt ausdrücklich gemischt, UNKNOWN ist nicht beurteilt. Fehlende/relevanzreduzierte Anteile bleiben offen, keine Umverteilung. Saldo ist weder Wahrscheinlichkeit, Optionsrendite, Master Score noch Einstiegsreife. Frühe Gegenhypothesen bleiben unabhängig möglich.'};
}
export type WeightedReview=ReturnType<typeof applyResearchWeights>;
/** One market view, opposite exposures. This conversion is arithmetic, not an investment forecast. */
export function instrumentReadings(instrument:Instrument,evaluations:MarketEvaluations):Partial<Record<WeightBlock,BlockReading>>{
 return Object.fromEntries(keys.map(key=>{
  const value=evaluations[key]?.reading??'UNKNOWN';
  return [key,value==='MIXED'||value==='UNKNOWN'?value:(value==='BULLISH')===(instrument!=='NASDAQ_PUT')?'SUPPORTS':'OPPOSES'];
 }));
}
/** Missing/invalid individual fields remain unknown; a valid sibling block is retained. */
export function parseMarketEvaluations(raw:string):Record<'NASDAQ_CONTEXT'|'RUSSELL_CONTEXT',MarketEvaluations|undefined>{
 const result:Record<'NASDAQ_CONTEXT'|'RUSSELL_CONTEXT',MarketEvaluations|undefined>={NASDAQ_CONTEXT:undefined,RUSSELL_CONTEXT:undefined};
 const headers=[...raw.matchAll(/^(NASDAQ_CONTEXT|RUSSELL_CONTEXT|NASDAQ_PUT|NASDAQ_CALL|RUSSELL_CALL):[ \t]*$/gm)];
 for(const name of ['NASDAQ_CONTEXT','RUSSELL_CONTEXT'] as const){
  const positions=headers.map((h,i)=>({h,i})).filter(({h})=>h[1]===name);
  if(!positions.length)continue;
  result[name]={};if(positions.length!==1)continue;
  const {h,i}=positions[0],body=raw.slice(h.index!+h[0].length,headers[i+1]?.index??raw.length),seen=new Set<string>();
  for(const row of body.matchAll(/^(APP|CHART|COT|HISTORY|NEWS):[ \t]*([^\n\r]*)/gm)){
   const key=row[1] as WeightBlock;if(seen.has(key)){result[name]![key]={reading:'UNKNOWN',reason:'Mehrfach widersprüchlich angegeben.'};continue;}seen.add(key);
   const m=/^(BULLISH|BEARISH|MIXED|UNKNOWN)(?:[ \t]*[|—–][ \t]*(.*))?[ \t]*$/.exec(row[2].trim());
   result[name]![key]={reading:m?m[1] as MarketReading:'UNKNOWN',reason:m?.[2]?.trim().slice(0,350)??''};
  }
 }
 return result;
}
export function compactWeightingContext(context:WeightingContext){return {policy:context.policy,instrument:context.instrument,weights:BLOCK_WEIGHTS,effectiveCaps:Object.fromEntries(context.blocks.map(b=>[b.key,b.effectiveWeight])),newsRefs:context.news.items.map(n=>n.id)};}
