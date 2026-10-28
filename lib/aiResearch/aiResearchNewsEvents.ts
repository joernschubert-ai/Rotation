import type { NewsCardsResult } from './aiResearchNewsCards';
type NewsKind='CPI'|'PPI'|'PCE'|'EMPLOYMENT'|'MONETARY_POLICY'|'BOND_YIELDS'|'EARNINGS'|'GEOPOLITICS'|'UNKNOWN';
type Mode='QUESTION_OR_EXPLAINER'|'PREVIEW_OR_EXPECTATION'|'CORRECTION_OR_DENIAL_HINT'|'REPORT_LIKE'|'UNRESOLVED';
const types:Array<[NewsKind,RegExp]>=[['CPI',/\bcpi\b|consumer price index|verbraucherpreisindex/iu],['PPI',/\bppi\b|producer price index|erzeugerpreisindex/iu],['PCE',/\bpce\b|personal consumption expenditures/iu],['EMPLOYMENT',/payroll|employment report|jobs report|arbeitsmarktbericht/iu],['MONETARY_POLICY',/\bfomc\b|federal reserve|\bfed\b|zinsentscheid/iu],['BOND_YIELDS',/\btreasur(?:y|ies)\b|bond yields?|anleiherendite/iu],['EARNINGS',/\bearnings\b|\bguidance\b|quartalszahlen/iu],['GEOPOLITICS',/\bwar\b|\bsanctions?\b|\btariffs?\b|krieg|sanktion|zölle/iu]];
function periodHints(text:string){
 const aliases=[['january','jan','januar'],['february','feb','februar'],['march','mar','märz'],['april','apr'],['may','mai'],['june','jun','juni'],['july','jul','juli'],['august','aug'],['september','sep','sept'],['october','oct','oktober','okt'],['november','nov'],['december','dec','dezember','dez']];
 const regex=new RegExp('\\b('+aliases.flat().join('|')+')\\.?\\s+(20\\d{2})\\b','giu'),result=new Set<string>();
 for(const m of text.matchAll(regex)){const index=aliases.findIndex(a=>a.includes(m[1].toLocaleLowerCase('de')));if(index>=0)result.add(m[2]+'-'+String(index+1).padStart(2,'0'));}
 return [...result].sort();
}
/** Lexical structure only. Candidate links never merge sources or count as independent events. */
export function buildNewsEventContext(input:NewsCardsResult){
 const records=input.cards.map(card=>{
  const text=card.title+' '+(card.summary??''),kinds=types.filter(([,re])=>re.test(text)).map(([kind])=>kind),periods=periodHints(text);
  const mode:Mode=/\?|\bwhy\b|here.s why|explainer|explained|warum|wieso/iu.test(card.title)?'QUESTION_OR_EXPLAINER':/\b(?:correction|corrected|denies|denial|revised|revisions?)\b|korrektur|dementi|revidiert/iu.test(card.title)?'CORRECTION_OR_DENIAL_HINT':/\b(?:ahead of|upcoming|expected|expectations?|preview|will|to monitor|this week)\b|vorschau|erwartet|bevorstehend/iu.test(card.title)?'PREVIEW_OR_EXPECTATION':/\b(?:release[sd]?|reports?|rose|fell|topped|increased|declined|moves?|hit|climbing)\b|veröffentlicht|gestiegen|gefallen/iu.test(card.title)?'REPORT_LIKE':'UNRESOLVED';
  const series=kinds.filter(k=>['CPI','PPI','PCE','EMPLOYMENT'].includes(k));
  const candidateKey=series.length===1&&periods.length===1?series[0]+'|'+periods[0]:null;
  const rising=/\b(?:higher|rise[sn]?|risin[g]?|spike[sd]?|climb\w*|increas\w*)\b|steig\w*|höher/iu.test(card.title),falling=/\b(?:lower|fall\w*|fell|sank|sink\w*|declin\w*|cooling)\b|fall\w*|sinken|niedriger/iu.test(card.title);
  const wordingDirection=!kinds.includes('BOND_YIELDS')?'UNRESOLVED':rising&&falling?'MIXED':rising?'UP_WORDING':falling?'DOWN_WORDING':'UNRESOLVED';
  return {sourceCardId:card.id,sourceIds:[...card.sourceIds],publishedAt:card.publishedAt,firstSeenAt:card.firstSeenAt,
   contentLevel:card.contentLevel,kinds:kinds.length?kinds:['UNKNOWN' as NewsKind],modeHint:mode,periodHints:periods,periodRole:'UNVERIFIED_MONTH_REFERENCE' as const,candidateKey,
   bondYieldWording:wordingDirection,scopeHint:/\bfrench\b|frankreich/iu.test(text)?'MULTIPLE_OR_NON_US_REVIEW':/\bu\.?s\.?\b|treasur/iu.test(text)?'US_REFERENCE_HINT':'UNRESOLVED',
   personalFinanceReview:/social security|income tax|taxable|retirement|sozialversicherung|einkommensteuer/iu.test(text),
   marketHints:[...card.marketHints],eventAt:null,eventStatus:'UNVERIFIED' as const,novelty:'UNKNOWN' as const,consensus:null,surprise:'UNKNOWN' as const,observedPriceReaction:'NOT_SUPPLIED' as const,indexDirection:'NOT_DETERMINED' as const};
 });
 const keys=[...new Set(records.flatMap(r=>r.candidateKey?[r.candidateKey]:[]))];
 const eventCandidates=keys.map(key=>({key,relationship:'CANDIDATE_SHARED_SERIES_AND_MONTH' as const,sourceCardIds:records.filter(r=>r.candidateKey===key).map(r=>r.sourceCardId),confirmedSameEvent:false,mergeSources:false}));
 const topics=[...new Set(records.flatMap(r=>r.kinds))].map(kind=>({kind,relationship:'TOPIC_ONLY' as const,sourceCardIds:records.filter(r=>r.kinds.includes(kind)).map(r=>r.sourceCardId),independentEventCount:null}));
 const up=records.filter(r=>r.bondYieldWording==='UP_WORDING'),down=records.filter(r=>r.bondYieldWording==='DOWN_WORDING');
 const opposingWordings=up.length&&down.length?{status:'OPPOSING_HEADLINE_WORDING_REVIEW' as const,upSourceIds:up.map(r=>r.sourceCardId),downSourceIds:down.map(r=>r.sourceCardId),confirmedContradiction:false,reason:'Richtungssprache ist keine gemessene Marktreaktion. Datum, Ereigniszeit, Laufzeit, Länderbezug und Frage/Vorschau unterscheiden; verschiedene Meldungen können gleichzeitig zutreffen.'}:null;
 return {version:'NEWS_EVENT_CONTEXT_V1' as const,asOf:input.asOf,sourceGroups:records.length,records,eventCandidates,topicGroups:topics,opposingWordings,independentEventCount:null,
  unknownEventIdentityCount:records.length,excludedSources:input.excluded,duplicateSourceCount:input.duplicateSourceCount,
  limitations:[
   'All classifications are lexical review hints, not verified facts about event identity, sentiment or index impact.',
   'Explicit month plus CPI/PPI/PCE/employment series creates only a candidate link. Missing year/ambiguous months stay unresolved; publication date is never used as reference period.',
   'Questions, previews, revisions and report-like titles remain distinct hints. Report-like wording does not verify a completed release.',
   'No source is merged or removed by these event links. Syndication and repeated publications are not independent confirmations.',
   'No full text, independently verified publication time, event time, consensus surprise, novelty or causal price reaction is supplied. No new provider or model call.'
  ]};
}
