/** Citation syntax only; existence and content are checked separately. Never edit prose. */
export function researchEvidenceReferences(text:string):string[]{
 const ids:string[]=[];
 const known=/^(?:[NRG](?:[-_][A-Za-z0-9]+)+|NEWS(?:[-_][A-Za-z0-9]+)+|[NR]\d+)$/;
 const codeLike=/^[\p{L}][\p{L}\p{N}]*(?:[-_][\p{L}\p{N}]+)+$/u;
 for(const group of text.matchAll(/\[([^\]\n]{1,300})\]|\(([^()\n]{1,300})\)/g)){
  const square=group[1]!==undefined,body=group[1]??group[2];
  if(/https?:\/\/|www\./i.test(body))continue;
  const linked=square&&/^\(\s*(?:https?:\/\/|\/)/i.test(text.slice(group.index!+group[0].length));
  // Whole identifiers, including underscores. Ordinary parentheses are not citations.
  for(const token of body.split(/[,;\/\s]+/).filter(Boolean)){
   if(known.test(token)||(square&&!linked&&codeLike.test(token)))ids.push(token);
  }
 }
 return [...new Set(ids)];
}
