import type { DomainPriceCondition, ResearchConcepts } from './aiResearchConcepts';
export interface ConditionBinding {
 instrument:'NASDAQ_PUT'|'NASDAQ_CALL'|'RUSSELL_CALL';
 status:'BOUND'|'MISSING'|'AMBIGUOUS'|'UNSUPPORTED';
 selectedId?:string;price?:number;asOfDate?:string|null;direction?:'UP'|'DOWN';effect?:'STRENGTHENS'|'WEAKENS';explanation:string;
}
/** Explicit selection only; never chooses a replacement or edits the model's prose. */
export function bindSelectedConditions(text:string,concepts:ResearchConcepts,input:string):ConditionBinding[]{
 const headings=[...text.matchAll(/^\s*(?:#{1,6}\s*)?(?:\*\*)?(Nasdaq(?:-100)?(?: Put| Call)|Russell(?: 2000)? Call)[^\n]*$/gim)];
 const sections=headings.map((h,i)=>({instrument:(/Russell/i.test(h[1])?'RUSSELL_CALL':/Put/i.test(h[1])?'NASDAQ_PUT':'NASDAQ_CALL') as ConditionBinding['instrument'],body:text.slice(h.index!+h[0].length,headings[i+1]?.index??text.length)}));
 const supplied=new Set([...input.matchAll(/^\[([^\]\n]+)\]/gm)].map(m=>m[1]));
 return (['NASDAQ_PUT','NASDAQ_CALL','RUSSELL_CALL'] as const).map(instrument=>{
  const own=sections.filter(s=>s.instrument===instrument);
  if(own.length!==1)return {instrument,status:own.length?'AMBIGUOUS':'MISSING',explanation:'Genau ein eigener Instrumentabschnitt erforderlich. Keine automatische Preisbedingung gewählt.'};
  const markers=[...own[0].body.matchAll(/^\s*(?:\*\*)?Preisbedingung(?:\*\*)?\s*:(?:\*\*)?\s*([^\n]*)$/gim)];
  if(markers.length!==1)return {instrument,status:markers.length?'AMBIGUOUS':'MISSING',explanation:'Keine eindeutige Auswahlzeile „Preisbedingung: ID“. Keine automatische Ersatzwahl.'};
  const token=/^(?:([A-Za-z0-9-]+)|\[([A-Za-z0-9-]+)\]|\(([A-Za-z0-9-]+)\))$/.exec(markers[0][1].trim());
  if(!token)return {instrument,status:'UNSUPPORTED',explanation:'Auswahlzeile enthält keine einzelne eindeutige Referenzkennung. Keine automatische Ersatzwahl.'};
  const selectedId=token[1]??token[2]??token[3],market=instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ',index=concepts.indices[market];
  const matches=(index?.conditions??[]).filter((c:DomainPriceCondition)=>c.id===selectedId&&c.role==='REFERENCE'&&c.state==='OPEN'&&Number.isFinite(c.price)&&c.price>0&&supplied.has(c.id));
  if(matches.length!==1||!index?.asOfDate)return {instrument,status:'UNSUPPORTED',selectedId,explanation:'Auswahl ist keine eindeutig gelieferte offene Referenz dieses Marktes mit bekanntem Chartdatum. Keine Übernahme oder Ersatzwahl.'};
  const c=matches[0],put=instrument==='NASDAQ_PUT',favorable=put?c.direction==='DOWN':c.direction==='UP';
  return {instrument,status:'BOUND',selectedId,price:c.price,asOfDate:index.asOfDate,direction:c.direction,effect:favorable?'STRENGTHENS':'WEAKENS',explanation:`App-Zuordnung: Schluss ${c.direction==='UP'?'über':'unter'} ${c.price} (${c.label}, Stand ${index.asOfDate}) würde die ${put?'Put':'Call'}-Idee richtungsbezogen ${favorable?'stärken':'schwächen'}. Keine Einstiegsfreigabe oder berechnete Optionsrendite. Freie Modellprosa wird damit nicht bestätigt.`};
 });
}
