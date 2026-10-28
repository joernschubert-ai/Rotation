/** Descriptive positioning only. No market vote, entry gate or model request. */
export const COT_SEMANTICS_VERSION = 'COT_SEMANTICS_V63';
export const cotNumber = (x:unknown):number|null => typeof x==='number'&&Number.isFinite(x)?x:null;
const fmt=(x:number|null)=>x===null?'unbekannt':String(Number(x.toFixed(3)));
export function cotChangeMeaning(netValue:unknown,deltaValue:unknown){
 const net=cotNumber(netValue),delta=cotNumber(deltaValue);
 if(net===null||delta===null)return {previous:null,meaning:'unbekannt',pattern:'UNKNOWN'};
 const previous=net-delta;
 if(!Number.isFinite(previous))return {previous:null,meaning:'unbekannt',pattern:'UNKNOWN'};
 const same=delta===0;
 const meaning=same?(net===0?'neutral unverändert':net>0?'Netto-Longüberhang unverändert':'Netto-Shortüberhang unverändert'):
  net===0?'jetzt neutral':previous===0?(net>0?'neutral zu netto long':'neutral zu netto short'):
  previous<0&&net>0?'Wechsel von netto short zu netto long':previous>0&&net<0?'Wechsel von netto long zu netto short':
  net>0?(delta>0?'Netto-Longüberhang größer':'Netto-Longüberhang kleiner'):(delta>0?'Netto-Shortüberhang kleiner':'Netto-Shortüberhang größer');
 return {previous,meaning,pattern:same?'UNCHANGED':net===0||previous===0?'NEUTRAL_TRANSITION':previous*net<0?'SIGN_CROSSING':delta>0?'TOWARD_LONG':'TOWARD_SHORT'};
}
export function cotGroupCard(group:any){
 const g=group&&typeof group==='object'?group:{},net=cotNumber(g.netPosition);
 const state=net===null?'unbekannt':net>0?'netto long':net<0?'netto short':'neutral';
 const changes=[1,4,13,26].map(weeks=>{
  const delta=cotNumber((Array.isArray(g.changes)?g.changes:[]).find((h:any)=>h?.weeks===weeks)?.delta);
  return {weeks,delta,...cotChangeMeaning(net,delta)};
 });
 const week=changes[0].delta;
 const conflicts=changes.filter(h=>[4,13].includes(h.weeks)&&week!==null&&h.delta!==null&&week!==0&&h.delta!==0&&Math.sign(week)!==Math.sign(h.delta)).map(h=>h.weeks);
 const readings=changes.filter(h=>h.weeks!==26).map(h=>`${h.weeks}W: ${h.meaning} (${fmt(h.delta)})`);
 const full=changes.map(h=>`${h.weeks} Wochen: ${fmt(h.delta)} Kontrakte; Ausgangsnetto ${fmt(h.previous)} → ${fmt(net)}; ${h.meaning}`);
 const aligned=changes.filter(h=>[4,13].includes(h.weeks)&&week!==null&&week!==0&&h.delta!==null&&h.delta!==0&&Math.sign(week)===Math.sign(h.delta)).map(h=>h.weeks);
 const conflict=conflicts.length?`1W-Konflikt nur gegen ${conflicts.map(w=>w+'W').join('/')}${aligned.length?'; gleichgerichtet mit '+aligned.map(w=>w+'W').join('/'):''}.`:'Kein belegter 1-vs-4/13-Richtungskonflikt; fehlende/Nulländerung ist keine Bestätigung.';
 return {group:typeof g.group==='string'?g.group:'UNKNOWN',net,state,changes,conflicts,
  text:`${g.group??'unbekannte Gruppe'}: ${fmt(net)} Kontrakte, ${state}. ${full.join('; ')}. ${conflict} Geliefertes Rangperzentil ${fmt(cotNumber(g.percentile52W))}, z-Score ${fmt(cotNumber(g.zScore))}; nicht mit einem Min-Max-COT-Index verwechseln. Fensterabdeckung und Kalenderabstände nicht unabhängig verifiziert. Keine Bruttotransaktionen, Motive, automatische Preisrichtung oder Extrem-Umkehrregel ableiten.`,
  promptText:`${g.group??'unbekannte Gruppe'}: ${fmt(net)} Kontrakte, ${state}; ${readings.join('; ')}. ${conflict} Rangperzentil ${fmt(cotNumber(g.percentile52W))}, z ${fmt(cotNumber(g.zScore))}; kein Min-Max-Index/Umkehrsignal. Nettoänderung ≠ Bruttotransaktion/Preisprognose.`};
}
