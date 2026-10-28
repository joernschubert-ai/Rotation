import { researchEvidenceReferences } from './aiResearchEvidenceReferences';
import { modelEvidenceRegistry } from './aiResearchModelEvidenceRegistry';
import type { SemanticFinding } from './aiResearchSemanticBindingAudit';

/** Matches explicit claims to own source conditions; it does not infer the market forecast. */
export function auditBoundPatternClaims(blocks:Array<{market:string;title:string;body:string}>,concepts:Record<string,any>,inputText?:string):SemanticFinding[]{
 const registry=modelEvidenceRegistry(inputText??''),findings:SemanticFinding[]=[];
 for(const block of blocks){
  const prefix=block.market==='NASDAQ'?'N-F':'R-F',instrument=/Put/iu.test(block.title)?'NASDAQ_PUT':block.market==='NASDAQ'?'NASDAQ_CALL':'RUSSELL_CALL';
  const favorable=instrument==='NASDAQ_PUT'?'DOWN':'UP',conditions=concepts[block.market]?.conditions??[];
  for(const sentence of block.body.split(/(?<=[.!?])\s+|\n/)){
   const text=sentence.trim(),refs=researchEvidenceReferences(text);if(!text)continue;
   const add=(code:string,correction:string,severity:SemanticFinding['severity']='REVIEW')=>findings.push({code,market:block.market,quote:text,severity,correction:(severity==='CONTRADICTION'?'Widerspruch: ':'Prüfhinweis: ')+correction});
   for(const c of conditions.filter((c:any)=>c.role==='PATTERN_TRIGGER'&&new RegExp('^'+prefix+'-PF[01]-FORM-TRIGGER$').test(c.id))){
    const owner=c.id.replace(/-TRIGGER$/,''),cited=refs.includes(owner)||refs.includes(c.id)&&registry.has(c.id);
    if(!cited)continue;
    const bull=/\b(?:Bullish|bullisch\w*)[- ]?(?:Triggers?|Ausbruch|Auslösung)|(?:Triggers?|Auslösung)[^.!?]{0,25}\bbullisch\w*/iu.test(text);
    const bear=/\b(?:Bearish|bearisch\w*)[- ]?(?:Triggers?|Ausbruch|Auslösung)|(?:Triggers?|Auslösung)[^.!?]{0,25}\bbearisch\w*/iu.test(text);
    const negated=/\b(?:nicht|kein\w*|unbelegt)\b/iu.test(text);
    if(!negated&&((c.direction==='DOWN'&&bull&&!bear)||(c.direction==='UP'&&bear&&!bull)))add('BOUND_PATTERN_DIRECTION_CONTRADICTION',`${owner}: Die eigene Musterpreisbedingung ist ${c.direction} ${c.price}, also ${c.direction==='DOWN'?'bearisch':'bullisch'}. Ein Triggername darf diese Wirkungsrichtung nicht umkehren. Die Preisbedingung allein ist keine neue Musterbestätigung.`,'CONTRADICTION');
    const ownName=instrument==='NASDAQ_PUT'?'Put':'Call';
    const strengthens=new RegExp('(?:Stärkung|stärkt|stärken|günstig)[^.!?]{0,25}'+ownName+'|'+ownName+'[^.!?]{0,25}(?:stärkt|stärken|Stärkung)','iu').test(text);
    const failureScenario=/scheitert|scheitern|gescheitert|Fehlausbruch|Fehlsignal|Rückeroberung/iu.test(text);
    if(!negated&&!failureScenario&&strengthens&&c.direction!==favorable)add('BOUND_PATTERN_EFFECT_CONTRADICTION',`${c.id}: ${c.direction} ${c.price} schwächt richtungsbezogen ${instrument}. Der Trigger belegt keine Stärkung dieses Instruments. Eine andere begründete Marktthese bleibt möglich.`,'CONTRADICTION');
   }
   const histories=refs.filter(id=>/^HIST-TEMPORAL-\d+$/.test(id));
   if(histories.length&&!refs.some(id=>/^[NR]-F-H\d+$/.test(id))&&!/\b(?:nicht|kein\w*)\b/iu.test(text)&&/(?:positiv\w*|negativ\w*)\s+(?:mittlere?\w*\s+)?Rendite|Rendite[^.!?]{0,25}(?:positiv|negativ)/iu.test(text)){
    for(const id of histories){const value=registry.get(id)?.value;
     if(Array.isArray(value)&&(value.length===5||value.length===6&&(typeof value[5]!=='number'||!Number.isFinite(value[5]))))add('TEMPORAL_MEAN_NOT_IN_MODEL_VIEW',`${id} enthält hier keinen numerischen Renditemittelwert. Ein positiver/negativer Durchschnitt ist mit dieser Kurzansicht allein nicht belegt; vollständige App-Daten sind davon getrennt.`);
     if(Array.isArray(value)&&value.length===6&&typeof value[5]==='number'&&Number.isFinite(value[5])){
      const positive=/positiv\w*\s+(?:mittlere?\w*\s+)?Rendite|Rendite[^.!?]{0,25}positiv/iu.test(text),negative=/negativ\w*\s+(?:mittlere?\w*\s+)?Rendite|Rendite[^.!?]{0,25}negativ/iu.test(text);
      if(positive&&value[5]<0||negative&&value[5]>0)add('TEMPORAL_MEAN_SIGN_CONTRADICTION',`${id}: Der gelieferte Mittelwert folgender 20 Intervalle nach Episodenstarts ist ${value[5]} %. Tageszustandsstudien sind eine andere Stichprobe.`, 'CONTRADICTION');
     }
    }
   }
  }
 }
 return findings;
}
