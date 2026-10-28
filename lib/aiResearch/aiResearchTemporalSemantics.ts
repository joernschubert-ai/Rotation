import { researchEvidenceReferences } from './aiResearchEvidenceReferences';
function day(value:unknown):number|null{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const t=Date.parse(value+'T00:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===value?t:null;
}
/** Calendar age describes timing, not pattern invalidation or predictive relevance. */
export function pnfCalendarAge(trigger:unknown,chart:unknown):number|null{
 const a=day(trigger),b=day(chart);return a===null||b===null||a>b?null:Math.round((b-a)/86400000);
}
export interface TemporalFinding {code:string;market?:string;quote?:string;correction:string;}
/** Limited wording checks. A missing confirmation may weaken a thesis; it does not forbid discussing one. */
export function auditTemporalInterpretation(blocks:Array<{market:string;body:string}>,indices:Record<string,any>):TemporalFinding[]{
 const findings:TemporalFinding[]=[];
 for(const block of blocks){
  const own=indices[block.market];if(!own)continue;
  for(const sentence of block.body.split(/(?<=[.!?])\s+|\n/)){
   if(/historisch/i.test(sentence)&&/Indexmittel|Renditemittel|Mittelwert|Folgerendite/i.test(sentence)&&/(?:der|in den|über die)\s+letzten\s+20\s+Sitzungen/i.test(sentence)&&Array.isArray(own.historicalStudies)&&own.historicalStudies.some((h:any)=>h.currentMatch===true)&&!/\bnicht\b/i.test(sentence))findings.push({code:'HISTORY_FORWARD_AS_RECENT',market:block.market,quote:sentence.trim(),correction:'Die gelieferten Studien messen FOLGENDE 20 Sitzungen nach früheren Vergleichsfällen. Sie sind keine Rendite der letzten 20 aktuellen Sitzungen. Heutige beobachtete Rendite separat aus dem eigenen Chart lesen.'});
   if(/frühe\s+These|Reboundthese|Rebound[- ]?These|Rebound/i.test(sentence)&&/ungestützt|nicht\s+(?:möglich|zulässig)|ausgeschlossen/i.test(sentence)&&/solange|erst\s+(?:nach|wenn)/i.test(sentence)&&/Säule|P&F|Skala/i.test(sentence)&&!/nicht\s+allein|allein\s+nicht|\bkönnte\b|\bwürde\b/i.test(sentence))findings.push({code:'EARLY_THESIS_CONFIRMATION_GATE_REVIEW',market:block.market,quote:sentence.trim(),correction:'Prüfhinweis zur Begründung: Eine noch fehlende Säulenumkehr oder P&F-Bestätigung darf als Gegenbeleg gewichtet werden. Sie ist keine zwingende Voraussetzung, um eine frühe Gegenidee anhand anderer eigener Belege zu diskutieren. Daraus folgt keine Verpflichtung zu einer bullischen oder bearischen Einschätzung.'});
   if(/These.*(?:Schwäche|bearisch)|(?:Schwäche|bearisch).*These/i.test(sentence)&&/plausibel.*solange/i.test(sentence)&&/Breakdown/i.test(sentence)&&/noch\s+nicht\s+ausgelöst/i.test(sentence))findings.push({code:'THESIS_TRIGGER_LOGIC_REVIEW',market:block.market,quote:sentence.trim(),correction:'Die frühe bearische These und der noch offene bearische Breakdown sind getrennt. Eine spätere Auslösung würde den formalen bearischen Befund bestätigen; das bloße Ausbleiben der Auslösung begründet nicht allein die Schwächethese. Dies ist ein Begründungshinweis, keine Widerlegung der Marktmeinung.'});
   if(!/bestätigt|\bCONFIRMED\b/i.test(sentence)||/historisch|Auslösung|\d{4}-\d{2}-\d{2}|\b\d{1,2}\.\d{1,2}\.\d{4}\b|früher|damalig|Kalendertage/i.test(sentence))continue;
   for(const id of researchEvidenceReferences(sentence)){
    const cite=/^([NR])-F-PF([01])-(LAST|ADV)$/.exec(id);if(!cite)continue;
    const prefix=block.market==='NASDAQ'?'N':'R';if(cite[1]!==prefix)continue;
    const p=own.completedChart?.formations?.pointFigure?.[Number(cite[2])],e=cite[3]==='ADV'?(p?.advanced?.version==='PNF_ADVANCED_CLOSE_GRID_V52'&&p?.advanced?.asOfDate===own.completedChart?.asOfDate?p.advanced.latest:null):p?.latest;
    const age=pnfCalendarAge(e?.confirmedAt,own.completedChart?.asOfDate);
    if(age===null||age===0||e?.status!=='CONFIRMED')continue;
    findings.push({code:'PNF_EVENT_TIME_CONTEXT_MISSING',market:block.market,quote:sentence.trim(),correction:`${id}: gelieferte Auslösung am ${e.confirmedAt}, ${age} Kalendertage vor Chartstand ${own.completedChart.asOfDate}. Die Bestätigung ist historisch; ein heute erfüllter Schwellenwert ist kein neues Ereignis. Das Alter widerlegt das Muster nicht automatisch. Einordnungshinweis, keine Behauptung einer falschen Auslösung.`});
   }
  }
 }
 return findings;
}
