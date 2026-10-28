import { buildNewsCards, buildNewsCardsFromEvidence } from './aiResearchNewsCards';
import { buildNewsEventContext } from './aiResearchNewsEvents';
const object = (x:unknown):Record<string,unknown> => x !== null && typeof x==='object' && !Array.isArray(x) ? x as Record<string,unknown> : {};
const str = (x:unknown) => typeof x==='string' ? x : undefined;
/** Extract only supplied data. Never load a report, cache, provider or model. */
export function diagnoseSavedNews(payload:unknown, explicitAsOf?:string) {
  const outer=object(payload), report=object(outer.report ?? payload);
  const asOf=explicitAsOf?.trim() || str(report.snapshotTimestamp);
  if(!asOf) throw new Error('Analysezeitpunkt fehlt. Bitte einen ISO-Zeitpunkt mit Zeitzone angeben.');
  let cards;
  if(Array.isArray(report.sources)) {
    if(report.sources.length>300) throw new Error('Maximal 300 Quellen pro Diagnose.');
    cards=buildNewsCards(report.sources.map((raw,i)=>{const s=object(raw);return {
      id:'SAVED_NEWS_'+i,title:str(s.title)??'',url:str(s.url)??'',publisher:str(s.publisher),summary:str(s.summary),
      publishedAt:str(s.publishedAt),firstSeenAt:str(s.firstSeenAt)
    };}),asOf);
  } else if(Array.isArray(report.evidence)) {
    if(report.evidence.length>500) throw new Error('Maximal 500 Evidenzzeilen pro Diagnose.');
    cards=buildNewsCardsFromEvidence(report.evidence.map(raw=>{const e=object(raw);return {
      id:str(e.id)??'',kind:str(e.kind)??'',available:e.available===true,data:object(e.data)
    };}),asOf);
  } else throw new Error('Keine Quellen gefunden. Erwartet: report.sources, sources oder evidence.');
  return {ok:true,modelRequestsUsed:0,persistence:'NONE',referenceSource:explicitAsOf?.trim()?'EXPLICIT_AS_OF':'SAVED_SNAPSHOT_TIMESTAMP',
    inputCoverage:'Nur eingefügte Quellen. Bereits vorher ausgelassene Nachrichten sind nicht rekonstruierbar.',...cards,eventContext:buildNewsEventContext(cards)};
}
