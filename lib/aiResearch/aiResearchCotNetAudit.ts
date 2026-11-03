type Source={id:string;group:string;netState:string};
type Finding={code:string;quote:string;explanation:string;withhold:boolean};
/** A group's predicate ends at the next group name. No state is borrowed from its neighbour. */
export function auditCotNetClaims(text:string,sources:Source[]):Finding[]{
 const findings:Finding[]=[];
 for(const sentence of text.split(/(?<=[.!?;])\s+|\n/)){
  if(/[„“«»"]/.test(sentence)||/\b(?:wenn|falls|würde|könnte)\b/i.test(sentence))continue;
  const mentions=[...sentence.matchAll(/\b(?:Leveraged[ _-]?Money|Asset[ _-]?Managers?)\b/gi)];
  for(let i=0;i<mentions.length;i++){
   const name=mentions[i],start=name.index!+name[0].length,end=mentions[i+1]?.index??sentence.length;
   const span=sentence.slice(start,end);
   // Past transitions, negation, quotations and shared implicit predicates require human reading.
   if(/\b(?:nicht|kein\w*|ohne|zuvor|vorher|damals|früher|Ausgangsnetto|Wechsel\w*|wechsel\w*|war\w*)\b/i.test(span)||/\bvor\s+\d+\s*(?:W\b|Wochen?)/i.test(span))continue;
   const claim=/\bnetto[ -]?(long|short)\b/i.exec(span);
   if(!claim||claim.index>100)continue;
   const group=/^Leveraged/i.test(name[0])?'LEVERAGED_MONEY':'ASSET_MANAGER',own=sources.filter(s=>s.group===group);
   if(own.length===1&&['NET_LONG','NET_SHORT','FLAT'].includes(own[0].netState)&&own[0].netState!=='NET_'+claim[1].toUpperCase())findings.push({code:'COT_NET_STATE_CONTRADICTION',quote:sentence,explanation:own[0].id+' hat den berechneten Nettozustand '+own[0].netState+'. Geprüft wurde nur die Aussage nach '+name[0]+' bis zum nächsten Gruppennamen.',withhold:true});
  }
 }
 return findings;
}
