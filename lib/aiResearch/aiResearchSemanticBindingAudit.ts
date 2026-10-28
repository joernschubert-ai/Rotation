import { researchEvidenceReferences } from './aiResearchEvidenceReferences';
import { auditRoleBindings } from './aiResearchRoleBindingAudit';
type Row=Record<string,any>;
export interface SemanticFinding {code:string;market:string;quote:string;severity:'CONTRADICTION'|'REVIEW';correction:string;}
const number=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)?v:null;
const object=(v:unknown):Row=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Row:{};
/** Explicit source-bound contradictions and separately labelled review hints, never a market vote. */
export function auditSemanticBindings(blocks:Array<{market:string;title:string;body:string}>,indices:Record<string,any>,concepts:Record<string,any>):SemanticFinding[]{
 const findings:SemanticFinding[]=[];
 for(const b of blocks){
  const own=indices[b.market]??{},prefix=b.market==='NASDAQ'?'N-F':'R-F',breadth=object(own.structure?.breadth),groups=Array.isArray(own.cotFacts?.groups)?own.cotFacts.groups:[];
  const points=Array.isArray(own.completedChart?.formations?.pointFigure)?own.completedChart.formations.pointFigure:[];
  const events=points.flatMap((p:any,i:number)=>[['LAST',p.latest],['FORM',p.forming],['ADV',p.advanced?.latest]].filter(([,e])=>e&&typeof e==='object').map(([kind,event]:any)=>({id:`${prefix}-PF${i}-${kind}`,event})));
  for(const raw of b.body.split(/(?<=[.!?])\s+|\n/)){
   const s=raw.trim();if(!s)continue;
   const refs=researchEvidenceReferences(s),cited=refs.filter(id=>id.startsWith(prefix+'-'));
   const add=(code:string,severity:SemanticFinding['severity'],correction:string)=>findings.push({code,market:b.market,quote:s,severity,correction:(severity==='REVIEW'?'Prüfhinweis: ':'Widerspruch: ')+correction});
   const negated=/\b(?:nicht|kein\w*)\b/iu.test(s),hypothetical=/\b(?:wenn|falls|würde|könnte|sollte|künftig)\b/iu.test(s);
   if(cited.includes(prefix+'-BREADTH')||cited.includes(prefix+'-STRUCTURE')){
    for(const m of s.matchAll(/\bB(20|50|200)\s*(?:liegt\s+)?(?:bei|von|:|=)?\s*(\d+(?:[.,]\d+)?)\s*%/gi)){
     const expected=number(object(breadth['b'+m[1]]).value)??number(breadth['b'+m[1]]),stated=Number(m[2].replace(',','.'));
     if(expected!==null&&Math.abs(expected-stated)>0.051&&!hypothetical&&!negated)add('BREADTH_VALUE_CONTRADICTION','CONTRADICTION',`Eigener B${m[1]}-Wert ${expected} %, nicht ${stated} %. Ein anderes Universum/Datum wäre eigens zu belegen.`);
    }
    if(/\b(?:Stabilität|stabil|verbessert|verschlechtert|gestiegen|gefallen)\b/iu.test(s)&&!hypothetical&&!negated&&!refs.some(id=>/PATH|HISTORY|WINDOW/.test(id)))add('BREADTH_LEVEL_AS_TREND_REVIEW','REVIEW',`Der zitierte Breitenbeleg beschreibt ein Niveau (${JSON.stringify(breadth)}), keinen zeitlichen Vergleich. Stabilität/Veränderung braucht eigene vergleichbare frühere Werte. Eine anders belegte Entwicklung bleibt möglich.`);
    if(/\b(?:um|durchgehend|alle)\s+\d+(?:[.,]\d+)?\s*%/iu.test(s)&&Object.keys(breadth).length&&!hypothetical&&!negated)add('BREADTH_AGGREGATION_REVIEW','REVIEW',`Breite 20/50/200 getrennt lesen: ${JSON.stringify(breadth)}. Eine grobe Sammelformulierung darf einen abweichenden MA50-Anteil nicht verdecken; keine feste Toleranzgrenze unterstellt.`);
   }
   for(const id of cited){
    const match=new RegExp('^'+prefix+'-COT(\\d+)$').exec(id);if(!match)continue;const group=groups[Number(match[1])];if(!group)continue;
    if(/\bstatistisch\s+(?:nicht\s+)?signifikant\w*\b|\bnichtsignifikant\w*\b/iu.test(s)&&!/nicht\s+(?:belegt|untersucht)|kein\w*[^.!?]{0,30}(?:Nachweis|Test|Beleg)/iu.test(s))add('COT_SIGNIFICANCE_NOT_ESTABLISHED','REVIEW',`${group.group}: geliefert sind Positionen und Veränderungen, kein statistischer Signifikanztest. Signifikanz ist weder belegt noch widerlegt.`);
    else if(/\bsignifikant\w*\b/iu.test(s)&&!negated)add('COT_SIZE_QUALIFIER_REVIEW','REVIEW',`${group.group}: „signifikant“ ist hier nicht fachlich belegt. Nettozustand und Betrag sind von Extrempositionierung oder statistischer Signifikanz zu trennen.`);
    const week=number(group.changes?.find((h:any)=>h.weeks===1)?.delta);
    const explicit=/1W\s+und\s+13W[^.!?]{0,60}(?:Konflikt|gegen)[^.!?]{0,35}4W/iu.test(s);
    const four=number(group.changes?.find((h:any)=>h.weeks===4)?.delta),thirteen=number(group.changes?.find((h:any)=>h.weeks===13)?.delta);
    if(explicit&&week!==null&&four!==null&&thirteen!==null&&week!==0&&four!==0&&thirteen!==0&&Math.sign(four)===Math.sign(thirteen)&&Math.sign(week)!==Math.sign(four)&&!negated)add('COT_CONFLICT_PAIR_CONTRADICTION','CONTRADICTION',`${group.group}: 1W ${week} gegen 4W ${four} und 13W ${thirteen}; 4W und 13W sind gleichgerichtet. Nettozustand bleibt davon getrennt.`);
   }
   for(const ref of events.filter((e:any)=>cited.includes(e.id))){
    const e=ref.event,trigger=number(e.confirmationLevel),invalid=number(e.invalidationLevel),adverse=/Call/i.test(b.title)?e.bias==='BEARISH':/Put/i.test(b.title)?e.bias==='BULLISH':false;
    if(adverse&&/(?:Fehlen|Ausbleiben|ausbleibt|nicht\s+erfolgt)[^.!?]{0,55}Widerlegung|Widerlegung[^.!?]{0,50}(?:nicht\s+erfolgt|ausbleibt|fehlt)/iu.test(s)&&/stütz|plausibel|spricht\s+für|profitiert/iu.test(s)&&!/\btrotz\b|Gegenargument|spricht\s+gegen|nicht\s+gestützt/iu.test(s))add('ADVERSE_PNF_AS_SUPPORT_REVIEW','REVIEW',`${ref.id}: fehlende Widerlegung des ${e.bias==='BEARISH'?'bearischen':'bullischen'} Gegenmusters stützt die eigene ${/Call/i.test(b.title)?'Call':'Put'}-These nicht selbst. Frühe Gegenideen dürfen mit anderen Befunden bestehen.`);
    if(/Widerlegung|invalidier/iu.test(s)&&/Trigger/iu.test(s)&&trigger!==null&&invalid!==null&&trigger!==invalid&&!negated){
     const values=[...s.matchAll(/\d+(?:[.,]\d+)?/g)].map(m=>Number(m[0].replace(',','.')));
     if(values.some(v=>Math.abs(v-trigger)<0.01)&&!values.some(v=>Math.abs(v-invalid)<0.01))add('PNF_TRIGGER_INVALIDATION_NUMBER_CONTRADICTION','CONTRADICTION',`${ref.id}: Trigger ${trigger} und mustereigene Widerlegung ${invalid} sind unterschiedliche Marken. Der Triggerwert ist hier nicht die Widerlegungsmarke.`);
    }
    if(/(?:Überwindung|Rückkehr\s+über)[^.!?]{0,65}(?:Breakdown|Abwärts)[- ]?Triggers?/iu.test(s)&&/Bedingung|Widerlegung|Wende|Erholung/iu.test(s)&&!negated)add('PNF_TRIGGER_RECLAIM_ROLE_REVIEW','REVIEW',`${ref.id}: Rückkehr über den alten Trigger ${trigger??'unbekannt'} ist nicht automatisch Musterwiderlegung (${invalid??'unbekannt'}). Eine separat begründete Kursreferenz bleibt möglich.`);
   }
   const conditions=(concepts[b.market]?.conditions??[]).filter((c:any)=>cited.includes(c.id));
   if(conditions.length===1){
    const c=conditions[0];
    if(c.state==='ALREADY_MET'&&/noch\s+offen|noch\s+ausstehend|erstmals\s+(?:über|unter)/iu.test(s)&&!hypothetical&&!negated)add('FULFILLED_CONDITION_CLAIMED_OPEN','CONTRADICTION',`${c.id}: ${c.direction} ${c.price} ist am gelieferten Schluss bereits erfüllt. Kein noch offener erstmaliger Bruch; ein erneutes Ereignis müsste gesondert beobachtet werden.`);
    if(c.state==='OPEN'&&/^(?:Für\s+(?:den|einen|die)?\s*(?:Nasdaq|Russell)?[^.!?]{0,30}Call\s+spricht|Die\s+Call[- ]These\s+stützt\s+sich)/iu.test(s)&&/Hoffnung|Möglichkeit|Rückkehr|noch\s+offen/iu.test(s)&&!hypothetical)add('FUTURE_CONDITION_AS_CURRENT_SUPPORT_REVIEW','REVIEW',`${c.id} ist eine künftige bedingte Stärkung/Schwächung, kein bereits beobachteter positiver Kursbefund. Eine ausdrücklich bedingte Zukunftsthese bleibt erlaubt.`);
   }
   if(cited.some(id=>new RegExp('^'+prefix+'-H\\d+$').test(id))&&/garantiert|sichere?\s+(?:Rendite|Gewinn|Erholung)|bewiesene?\s+Gewinnwahrscheinlichkeit/iu.test(s)&&!negated)add('HISTORY_GUARANTEE_NOT_ESTABLISHED','REVIEW','Historische folgende Indexrenditen und deren Verteilung belegen keine sichere nächste Rendite, Gewinnwahrscheinlichkeit oder Optionsrendite.');
  }
 }
 return [...findings,...auditRoleBindings(blocks)];
}
