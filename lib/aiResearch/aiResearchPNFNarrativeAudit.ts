import { researchEvidenceReferences } from './aiResearchEvidenceReferences';
export interface PNFAuditFinding {code:string;market?:string;quote?:string;correction:string;}
const families=[
 ['PNF_DOUBLE_TOP_BREAKOUT',/PNF_DOUBLE_TOP_BREAKOUT|Double[ -]Top[ -]Breakout/i],
 ['PNF_TRIPLE_TOP_BREAKOUT',/PNF_TRIPLE_TOP_BREAKOUT|Triple[ -]Top[ -]Breakout/i],
 ['PNF_DOUBLE_BOTTOM_BREAKDOWN',/PNF_DOUBLE_BOTTOM_BREAKDOWN|Double[ -]Bottom[ -]Breakdown/i],
 ['PNF_TRIPLE_BOTTOM_BREAKDOWN',/PNF_TRIPLE_BOTTOM_BREAKDOWN|Triple[ -]Bottom[ -]Breakdown/i],
 ['PNF_BULL_TRAP',/PNF_BULL_TRAP|Bull[ -]Trap/i],
 ['PNF_BEAR_TRAP',/PNF_BEAR_TRAP|Bear[ -]Trap/i],
 ['PNF_BULLISH_SIGNAL_REVERSED',/PNF_BULLISH_SIGNAL_REVERSED|Bullish[ -]Signal[ -]Reversed/i],
 ['PNF_BEARISH_SIGNAL_REVERSED',/PNF_BEARISH_SIGNAL_REVERSED|Bearish[ -]Signal[ -]Reversed/i],
 ['PNF_BULLISH_CATAPULT',/PNF_BULLISH_CATAPULT|Bullish[ -]Catapult/i],
 ['PNF_BEARISH_CATAPULT',/PNF_BEARISH_CATAPULT|Bearish[ -]Catapult/i],
] as const;
/** Narrow explicit event-status checks; hypotheses and market direction are not classified. */
export function auditPNFNarrative(blocks:Array<{market:string;body:string}>,indices:Record<string,any>):PNFAuditFinding[]{
 const findings:PNFAuditFinding[]=[];
 for(const block of blocks){
  const points=indices[block.market]?.completedChart?.formations?.pointFigure;
  if(!Array.isArray(points))continue;
  const prefix=block.market==='NASDAQ'?'N':'R';
  const events=points.flatMap((p:any,i:number)=>[['LAST',p.latest],['FORM',p.forming],['ADV',p.advanced?.version==='PNF_ADVANCED_CLOSE_GRID_V52'&&p.advanced?.asOfDate===indices[block.market]?.completedChart?.asOfDate?p.advanced.latest:null]].filter(([,e])=>e&&typeof e==='object').map(([kind,e]:any)=>({id:`${prefix}-F-PF${i}-${kind}`,scale:p.boxPercent,event:e})));
  for(const sentence of block.body.split(/(?<=[.!?])\s+|\n/)){
   const named=families.filter(([,pattern])=>pattern.test(sentence)).map(([family])=>family);
   if(named.length!==1||!/bestätigt|\bCONFIRMED\b|ausgelöst|vollzogen/i.test(sentence))continue;
   if(/(?:noch\s+)?nicht\s+(?:als\s+\w+\s+)?(?:bestätigt|ausgelöst|vollzogen)|keine?\s+(?:\w+\s+){0,3}(?:Bestätigung|bestätigt)|unbestätigt|\b(?:falls|wenn|könnte|würde|sollte)\b/i.test(sentence))continue;
   const scaleMatch=/(?:P&F\s*)?(0[.,]5|1(?:[.,]0)?)\s*%/i.exec(sentence),scale=scaleMatch?Number(scaleMatch[1].replace(',','.')):null;
   const own=events.filter(e=>e.event.family===named[0]&&(scale===null||e.scale===scale));
   if(own.length){
    const unconfirmed=own.every(e=>e.event.status==='FORMING'&&!e.event.confirmedAt&&!e.event.invalidatedAt);
    if(unconfirmed)findings.push({code:'PNF_FORMING_CLAIMED_CONFIRMED',market:block.market,quote:sentence.trim(),correction:`${named[0]}${scale===null?'':` auf ${scale} %`}: Die gelieferte Formation entsteht erst (FORMING), eine Auslösung ist nicht geliefert. Das korrigiert den Ereignisstatus; eine frühe bearische oder bullische Markthypothese bleibt mit anderen Belegen möglich.`});
    if(own.every(e=>e.event.status==='INVALIDATED'||!!e.event.invalidatedAt)&&!/historisch|früher|damalig|widerlegt|ungültig/i.test(sentence))findings.push({code:'PNF_INVALIDATED_CLAIMED_CURRENT',market:block.market,quote:sentence.trim(),correction:`Die zugeordnete Formation ${named[0]} ist widerlegt. Eine historische Auslösung und die heutige Markthypothese sind davon getrennt zu beurteilen.`});
   }
   const cited=researchEvidenceReferences(sentence);
   for(const id of new Set(cited)){
    const ref=events.find(e=>e.id===id);if(!ref||ref.event.family===named[0])continue;
    findings.push({code:'PNF_EVENT_REFERENCE_MISMATCH',market:block.market,quote:sentence.trim(),correction:`${id} beschreibt ${ref.event.family} (${ref.event.status??'Status unbekannt'}), nicht die als bestätigt bezeichnete Formation ${named[0]}. Eine vorhandene Belegnummer beweist keine inhaltliche Passung. Die freie Richtungshypothese wird damit nicht automatisch widerlegt.`});
   }
  }
 }
 return findings;
}
