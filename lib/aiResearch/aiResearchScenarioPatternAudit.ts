type Fact={id:string;market:string;text:string;status:string};
type Finding={market:string;field:string;sourceId:string|null;code:string;quote:string;canonicalText:string|null;withhold:true};
const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
function suppliedDirection(f:Fact){
 const named=f.text.match(/\bRichtung (BULLISH|BEARISH)\b/);
 if(named)return named[1]==='BULLISH'?'UP':'DOWN';
 const stated=f.text.match(/, (bullisch|bearisch), (?:CONFIRMED|FORMING)\b/);
 return stated?stated[1]==='bullisch'?'UP':'DOWN':null;
}
/** Deliberately narrow: explicit cited pattern predicates only, never a full semantic truth check. */
export function auditScenarioPatterns(scenarios:unknown[],facts:Fact[]){
 const findings:Finding[]=[];
 for(const raw of scenarios){const s=object(raw);if(!['NASDAQ','RUSSELL_2000'].includes(s.market))continue;
  const prefix=s.market==='NASDAQ'?'N-F-':'R-F-';
  const selected=new Set(['supports','opposes','contextSources'].flatMap(k=>Array.isArray(s[k])?s[k].filter((v:unknown)=>typeof v==='string'):[]));
  for(const field of ['reason','counterargument']){
   if(typeof s[field]!=='string')continue;
   for(const sentence of s[field].split(/(?<=[.!?])\s+|\n/)){
    const refs=[...sentence.matchAll(/\b(?:[NR]-F-)?PF[01]-(?:LAST|FORM|ADV)\b/g)];
    const add=(code:string,sourceId:string|null=null,f:Fact|undefined=undefined)=>findings.push({market:s.market,field,sourceId,code,quote:sentence,canonicalText:f?.text??null,withhold:true});
    if(!refs.length&&/(?:P&F|PNF_)/i.test(sentence)&&/\b(?:Double|Triple|Catapult|Trap|FORMING|CONFIRMED|bullisch\w*|bearisch\w*|bestätigt\w*|ausgelöst\w*)\b/i.test(sentence)&&!/(?:keine?\w*\s+P&F|P&F[^.!?]{0,35}(?:fehlen|nicht verfügbar))/i.test(sentence))add('PNF_CLAIM_WITHOUT_REFERENCE');
    for(const match of refs){
     // Short aliases are resolved only inside the explicit own-market scenario. Original text is untouched.
     const token=match[0],id=/^[NR]-F-/.test(token)?token:prefix+token;
     const f=facts.find(f=>f.id===id);
     if(!f||f.market!==s.market||f.status==='MISSING'){add('PNF_REFERENCE_NOT_OWN_SOURCE',id,f);continue;}
     if(!selected.has(id))add('PNF_REFERENCE_NOT_SELECTED',id,f);
     const before=sentence.slice(0,match.index).split(/[;:]/).pop()!.slice(-140);
     const after=sentence.slice(match.index!+token.length).slice(0,140);
     const talksAboutColumn=/\bSäule\w*\b/i.test(before);
     const direct=after.match(/^[\s\]\)]*(?:(?:ist|war|bleibt|wirkt|wirkte|gilt als|galt als)\s+)?(bullisch\w*|bearisch\w*)\b/i);
     const adjective=before.match(/\b(bullisch\w*|bearisch\w*)\s+(?:(?:P&F|PNF)[- ]*)?(?:(?:Double|Triple|Top|Bottom|Breakout|Breakdown|Muster|Ausbruch|Signal|Catapult|Trap|Reversed)\s*){1,6}[\s\[(]*$/i);
     const negatedAdjective=/\b(?:nicht|kein\w*|unbestätigt\w*)\b/i.test(before.slice(-80));
     const claim=!talksAboutColumn?(direct?.[1]??(negatedAdjective?null:adjective?.[1])):null;
     const expected=suppliedDirection(f);
     if(claim&&expected&&(/^bullisch/i.test(claim)?'UP':'DOWN')!==expected)add('PNF_PATTERN_DIRECTION_CONTRADICTION',id,f);
     // Negated qualifications and explicit column statements are not promoted to pattern claims.
     if(!talksAboutColumn&&!/\b(?:nicht|kein\w*|unbestätigt\w*)\b/i.test(before.slice(-80))){
      const confirmedAfter=/^[\s\]\)]*(?:(?:ist|bleibt|gilt als)\s+)?(?:bereits\s+)?(?:bestätigt|ausgelöst|CONFIRMED)\b/i.test(after);
      const confirmedBefore=/(?:bestätigt\w*|ausgelöst\w*)\s+(?:(?:bullisch\w*|bearisch\w*|P&F|Double|Triple|Top|Bottom|Breakout|Breakdown|Muster|Ausbruch|Signal)\s*){1,7}[\s\[(]*$/i.test(before);
      if(/\bFORMING\b/.test(f.text)&&(confirmedAfter||confirmedBefore))add('PNF_FORMING_AS_CONFIRMED',id,f);
     }
     // Do not infer an English pattern name's new effect from its old-trend name.
    }
   }
  }
 }
 return {version:'SCENARIO_PATTERN_AUDIT_V1',findings,scope:'Explizite eigene P&F-Verweise, Auswahlbindung, direkte deutsche Muster-Richtungsprädikate und ausgewählte FORMING-Bestätigungsbehauptungen. Aktuelle Säule ist separat. Keine vollständige Sprach-, Status-, COT-, Nachrichten- oder Prognoseprüfung; kein Befund bestätigt keine Richtigkeit.',semanticTruthVerified:false};
}


