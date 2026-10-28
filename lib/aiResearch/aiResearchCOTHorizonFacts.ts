export interface COTHorizonGroup {
 group:string;observationDate:string;netPosition:number|null;netState:'NET_LONG'|'NET_SHORT'|'FLAT'|'UNKNOWN';
 horizons:Array<{weeks:number;delta:number|null;previousNet:number|null;shift:'TOWARD_LONG'|'TOWARD_SHORT'|'UNCHANGED'|'UNKNOWN';fact:string}>;
}
export function cotCoverageNotes(facts:COTHorizonGroup[]):string[]{
 return facts.flatMap(f=>{
  const week=f.horizons.find(h=>h.weeks===1),longer=f.horizons.filter(h=>h.weeks!==1&&h.delta!==null&&week?.delta!==null&&Math.sign(h.delta!)!==Math.sign(week?.delta??0)&&h.delta!==0&&week?.delta!==0);
  if(!week||week.delta===null||!longer.length)return [];
  return [(f.group==='ASSET_MANAGER'?'Asset Manager':'Leveraged Money')+': Die letzte Woche und mindestens ein längerer Zeitraum weisen in unterschiedliche Richtungen. Wochenfakt: '+week.fact+' Längere Horizonte getrennt lesen; kein automatisches Kauf-/Verkaufssignal.'];
 });
}
export function explicitSignificanceClaim(text:string):boolean{
 return /statistisch\w*[^.!?]{0,25}signifik|statistically[^.!?]{0,25}significant|(?:significant|signifikant\w*)\s+(?:excess returns?|mehrertrag|divergenzen|renditen)|(?:divergenzen|mehrertrag|excess returns?)[^.!?]{0,35}(?:signifikant|significant)/iu.test(text);
}
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const number=(v:number)=>v.toLocaleString('de-DE',{maximumFractionDigits:0});
export function buildCOTHorizonFacts(summaries:any[]):COTHorizonGroup[]{
 return summaries.filter(s=>s&&['ASSET_MANAGER','LEVERAGED_MONEY'].includes(s.group)).map(s=>{
  const netPosition=finite(s.netPosition)?s.netPosition:null;
  const netState=netPosition===null?'UNKNOWN':netPosition>0?'NET_LONG':netPosition<0?'NET_SHORT':'FLAT';
  const horizons=([{weeks:1,key:'weeklyChange'},{weeks:4,key:'change4W'},{weeks:13,key:'change13W'}] as const).map(({weeks,key})=>{
   const delta=finite(s[key])?s[key] as number:null,previousNet=netPosition!==null&&delta!==null?netPosition-delta:null;
   const shift=delta===null?'UNKNOWN' as const:delta>0?'TOWARD_LONG' as const:delta<0?'TOWARD_SHORT' as const:'UNCHANGED' as const;
   const fact=delta===null?'Keine geeignete Veränderung über diesen Zeitraum geliefert.':
    'Nettoänderung über '+weeks+' '+(weeks===1?'Woche':'Wochen')+': '+(delta>0?'+':'')+number(delta)+' Kontrakte'+(previousNet===null?'':' ('+number(previousNet)+' → '+number(netPosition!)+')')+'. '+
    (shift==='TOWARD_LONG'?'Verschiebung in Richtung Long; kein Nachweis steigender Kurse.':shift==='TOWARD_SHORT'?'Verschiebung in Richtung Short; kein Nachweis fallender Kurse.':'Nettoposition im Zeitraum unverändert.');
   return {weeks,delta,previousNet,shift,fact};
  });
  return {group:s.group,observationDate:String(s.reportDate??''),netPosition,netState,horizons};
 });
}
/** Explicit group + period only; a vague sentence is ambiguous, not proof of a false horizon. */
export function cotHorizonInterpretationNotes(text:string,facts:COTHorizonGroup[]):string[]{
 const notes:string[]=[];
 for(const sentence of text.split(/[.!?](?:\s|$)|,\s*(?:aber|während|while|but)\s*/iu)){
  const own=facts.filter(f=>new RegExp(f.group==='ASSET_MANAGER'?'asset managers?':'leveraged money','iu').test(sentence));
  if(own.length!==1)continue;
  const f=own[0],weeks=/13\s*(?:wochen|weeks)|dreizehn/iu.test(sentence)?13:/4\s*(?:wochen|weeks)|vier wochen/iu.test(sentence)?4:/wöchentlich|wochenänderung|letzte[nr]? woche|weekly|one week|1\s*woche/iu.test(sentence)?1:null;
  const up=/steigend|gestiegen|zugenommen|erhöht|increased|increasing/iu.test(sentence),down=/gesunken|abgenommen|abgebaut|reduziert|decreased|declining/iu.test(sentence);
  if(up===down)continue;
  if(weeks===null){notes.push('Eine Veränderung bei '+(f.group==='ASSET_MANAGER'?'Asset Manager':'Leveraged Money')+' wurde ohne klaren Zeitraum beschrieben. Wochen-, Vierwochen- und Dreizehnwochenwerte getrennt anhand der Faktentabelle lesen.');continue;}
  const h=f.horizons.find(h=>h.weeks===weeks);
  // Only explicit net-position changes, not a smaller short overhang or gross positions.
  if(h&&h.delta!==null&&/nettoposition|netto.long|net position|net long/iu.test(sentence)&&!/(?:short|negativ)/iu.test(sentence)&&((up&&h.delta<0)||(down&&h.delta>0)))notes.push('Die genannte Nettoveränderung widerspricht dem '+weeks+'-Wochen-Fakt: '+h.fact);
 }
 return [...new Set(notes)];
}
