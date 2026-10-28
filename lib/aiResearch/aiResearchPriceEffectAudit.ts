export interface PriceEffectFinding {code:string;market?:string;quote?:string;correction:string;}
/** Narrow conditional-direction checks, not a forecast, causal model or options valuation. */
export function auditPriceEffects(blocks:Array<{market:string;title:string;body:string}>,indices:Record<string,any>):PriceEffectFinding[]{
 const findings:PriceEffectFinding[]=[];
 for(const block of blocks){
  const conditions=indices[block.market]?.conditions??[];
  const put=/Put/i.test(block.title);
  for(const sentence of block.body.split(/(?<=[.!?])\s+|\n/)){
   if(/\b(?:nicht|kein\w*)\b|Optionspreis|implizite\s+Volatilität|Zeitwert|\bIV\b/i.test(sentence))continue;
   for(const clause of sentence.split(/\s+(?:oder|sowie)\s+/i)){
    const mentioned=new Set([...clause.matchAll(/\b[NR](?:-[A-Za-z0-9]+)+\b/g)].map(m=>m[0]));
    const refs=conditions.filter((c:any)=>mentioned.has(c.id));
    const directions=[...new Set(refs.map((c:any)=>c.direction))];
    // Mixed up/down evidence cannot be assigned to one effect safely.
    if(directions.length!==1)continue;
    const direction=directions[0],rise=/Erholung|Kursanstieg|Aufwärtsbewegung/i.test(clause),fall=/Kursrückgang|Abwärtsbewegung|weitere\s+Schwäche/i.test(clause);
    if(rise&&!fall&&/durch|infolge|ausgelöst/i.test(clause)&&direction==='DOWN'&&!/anschließend|später|danach|Shortcover|überverkauft/i.test(clause))findings.push({code:'PRICE_CONDITION_RECOVERY_DIRECTION_CONFLICT',market:block.market,quote:sentence.trim(),correction:`${refs.map((c:any)=>c.id).join(', ')} beschreibt eine Abwärtsbedingung, keine Rückkehr über eine höhere Referenz. Ein Unterschreiten wirkt richtungsbezogen zugunsten einer Put-Fortsetzung und gegen eine Call-Erholung. Eine spätere Gegenbewegung wäre eine zusätzliche Hypothese, keine Wirkung dieser Referenz allein.`});
    const stronger=/stärk\w*\s+(?:die\s+|eine\s+)?(?:Put|Call)|(?:Put|Call)[- ](?:Idee|Fortsetzung|Erholung)[^.!?]{0,15}\bstärken/i.test(clause);
    const weaker=/schwäch\w*\s+(?:die\s+|eine\s+)?(?:Put|Call)|(?:Put|Call)[- ](?:Idee|Fortsetzung|Erholung)[^.!?]{0,15}\bschwächen/i.test(clause);
    if(stronger===weaker)continue;
    const named=[...new Set([...clause.matchAll(/\b(Put|Call)\b/gi)].map(m=>m[1].toLowerCase()))];
    if(named.length>1)continue;
    const targetPut=named.length?named[0]==='put':put;
    const favorable=targetPut?direction==='DOWN':direction==='UP';
    if(stronger!==favorable)findings.push({code:'PRICE_CONDITION_INSTRUMENT_EFFECT_CONFLICT',market:block.market,quote:sentence.trim(),correction:`${refs.map((c:any)=>c.id).join(', ')}: ${direction==='UP'?'Aufwärts':'Abwärts'}bedingung würde die ${targetPut?'Put':'Call'}-Idee richtungsbezogen ${favorable?'stärken':'schwächen'}. Keine automatische Einstiegsfreigabe und keine Aussage über konkrete Optionspreise.`});
   }
  }
 }
 return findings;
}
