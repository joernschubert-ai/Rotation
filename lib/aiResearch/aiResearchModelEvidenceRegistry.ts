type Direction='UP'|'DOWN';
type Effect='STRENGTHENS'|'WEAKENS';
export interface ModelEvidenceReference {
 id:string;kind:'SOURCE_ROW'|'BOUND_CONDITION';value:unknown;parentId?:string;
 direction?:Direction;state?:'OPEN';price?:number;
 bindings?:Array<{instrument:string;effect:Effect}>;
}
const layouts:Record<string,{instrument:string;prefix:string}>={
 'N-BIND-PUT':{instrument:'NASDAQ_PUT',prefix:'N-F'},
 'N-BIND-CALL':{instrument:'NASDAQ_CALL',prefix:'N-F'},
 'R-BIND-CALL':{instrument:'RUSSELL_CALL',prefix:'R-F'}
};
const object=(x:unknown):Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:{};

/** Only model source rows and validated, explicitly allowed BIND children become references.
 * News prose, arbitrary nested strings and omitted app facts never extend this registry. */
export function modelEvidenceRegistry(inputText:string):Map<string,ModelEvidenceReference>{
 const registry=new Map<string,ModelEvidenceReference>(),duplicates=new Set<string>();
 for(const match of inputText.matchAll(/^\[([^\]\n]+)\] (.+)$/gm)){
  const id=match[1];if(registry.has(id)){duplicates.add(id);continue;}
  let value:unknown=match[2];try{value=JSON.parse(match[2]);}catch{/* legacy plain-text source rows keep their original identifier */}
  registry.set(id,{id,kind:'SOURCE_ROW',value});
 }
 for(const id of duplicates)registry.delete(id);
 const blockedChildren=new Set<string>();
 for(const [id,layout]of Object.entries(layouts)){
  const value=object(registry.get(id)?.value);if(value.instrument!==layout.instrument||!Array.isArray(value.forming))continue;
  const seen=new Set<string>();
  for(const tuple of value.forming){
   if(!Array.isArray(tuple)||![3,6].includes(tuple.length))continue;
   const [child,parent]=tuple;
   if(typeof child!=='string'||typeof parent!=='string'||!new RegExp('^'+layout.prefix+'-PF[01]-FORM$').test(parent)||child!==parent+'-TRIGGER')continue;
   const source=registry.get(parent);if(source?.kind!=='SOURCE_ROW'||typeof source.value!=='string'||!source.value.includes('FORMING'))continue;
   if(seen.has(child)){blockedChildren.add(child);continue;}seen.add(child);
   const effect=tuple[tuple.length-1];if(effect!=='STRENGTHENS'&&effect!=='WEAKENS')continue;
   const favorable=layout.instrument==='NASDAQ_PUT'?'DOWN':'UP';
   const direction:Direction=effect==='STRENGTHENS'?favorable:favorable==='UP'?'DOWN':'UP';
   if(tuple.length===6&&(!(typeof tuple[2]==='number'&&Number.isFinite(tuple[2])&&tuple[2]>0)||tuple[3]!==direction||tuple[4]!=='OPEN'))continue;
   const price=tuple.length===6?tuple[2]:undefined,previous=registry.get(child);
   if(previous&&(previous.kind!=='BOUND_CONDITION'||previous.parentId!==parent||previous.direction!==direction||(previous.price!==undefined&&price!==undefined&&previous.price!==price))){blockedChildren.add(child);continue;}
   const bindings=[...(previous?.bindings??[]),{instrument:layout.instrument,effect:effect as Effect}];
   registry.set(child,{id:child,kind:'BOUND_CONDITION',value:tuple,parentId:parent,direction,state:'OPEN',...(price===undefined?{}:{price}),bindings});
  }
 }
 for(const id of blockedChildren)if(registry.get(id)?.kind==='BOUND_CONDITION')registry.delete(id);
 return registry;
}
