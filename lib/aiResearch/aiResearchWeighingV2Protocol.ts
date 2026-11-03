import type {prepareScenarioContext} from './aiResearchScenarioContext';
import {prepareArgumentEffects} from './aiResearchArgumentEffects';
type Context=ReturnType<typeof prepareScenarioContext>;
export function prepareWeighingV2Policy(context:Context){
 const effects=prepareArgumentEffects(context);
 const catalog=context.links.catalog.map(c=>{const own=effects.effects.filter(e=>e.market===c.market),price=own.filter(e=>!['HISTORICAL_MEAN','POSITIONING_CONTEXT','SHARED_CONTEXT'].includes(e.facet));return {market:c.market,baseDirection:c.baseDirection,sameEffectIds:price.filter(e=>e.relation==='SAME_DIRECTION_CONTEXT').map(e=>e.effectId),oppositeEffectIds:price.filter(e=>e.relation==='OPPOSITE_DIRECTION_CONTEXT').map(e=>e.effectId),cotSourceIds:c.cotIds,historyEffectIds:own.filter(e=>e.facet==='HISTORICAL_MEAN').map(e=>e.effectId),sharedSourceIds:c.riskIds};});
 return {context,effects,catalog};
}
export type WeighingV2Policy=ReturnType<typeof prepareWeighingV2Policy>;
export function validateWeighingV2(p:WeighingV2Policy,raw:unknown){
 const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
 const exact=(v:unknown,keys:string[])=>{const o=object(v);return Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));};
 const r=object(raw),issues:Array<{market:string;code:string;field?:string}>=[],view:Array<Record<string,any>>=[];const add=(market:string,code:string,field?:string)=>issues.push({market,code,...(field?{field}:{})});
 if(!exact(r,['version','baseEpisodeId','factsHash','markets'])||r.version!=='CONTEXT_WEIGHING_V2'||r.baseEpisodeId!==p.context.base.id||r.factsHash!==p.context.base.factsHash||!Array.isArray(r.markets)||r.markets.length!==2)add('ALL','FRAME_OR_SCHEMA');
 const seen=new Set<string>();
 for(const item of Array.isArray(r.markets)?r.markets:[]){const row=object(item),own=p.catalog.find(c=>c.market===row.market);if(!own||seen.has(row.market)||!exact(row,['market','sameEffectIds','oppositeEffectIds','cotSourceIds','historyEffectIds','sharedSourceIds','judgement','decisiveEffectIds'])){add(String(row.market),'OWN_UNIQUE_FIELDS');continue;}seen.add(row.market);
  const list=(field:string,allowed:string[],max:number)=>{const a=row[field];if(!Array.isArray(a)||a.length>max||a.some(id=>typeof id!=='string'||!allowed.includes(id))||new Set(a).size!==a.length){add(row.market,'CLOSED_LIST',field);return [] as string[];}return a as string[];};
  const same=list('sameEffectIds',own.sameEffectIds,3),opposite=list('oppositeEffectIds',own.oppositeEffectIds,3),cot=list('cotSourceIds',own.cotSourceIds,2),history=list('historyEffectIds',own.historyEffectIds,3),shared=list('sharedSourceIds',own.sharedSourceIds,2);
  const chosen=[...same,...opposite,...history];const decisive=list('decisiveEffectIds',chosen,2);
  if(!['BASE_CONTEXT_STRONGER','COUNTER_CONTEXT_STRONGER','OPEN'].includes(row.judgement))add(row.market,'JUDGEMENT');
  const direction=row.judgement==='BASE_CONTEXT_STRONGER'?'SAME_DIRECTION_CONTEXT':row.judgement==='COUNTER_CONTEXT_STRONGER'?'OPPOSITE_DIRECTION_CONTEXT':null;
  if(direction&&!decisive.some(id=>p.effects.effects.find(e=>e.effectId===id)?.relation===direction))add(row.market,'JUDGEMENT_BINDING');
  const effect=(id:string)=>p.effects.effects.find(e=>e.effectId===id)!;
  const source=(id:string)=>p.context.links.byId.get(id)!;
  view.push({market:row.market,baseDirection:own.baseDirection,judgement:row.judgement,sameEffects:same.map(effect),oppositeEffects:opposite.map(effect),counterStatus:opposite.length?'REFERENCED':own.oppositeEffectIds.length?'NOT_REFERENCED':'NO_OPPOSITE_AVAILABLE',cot:cot.map(source),cotStatus:cot.length?'REFERENCED':own.cotSourceIds.length?'NOT_REFERENCED':'NO_SOURCES',history:history.map(effect),historyStatus:history.length?'REFERENCED':own.historyEffectIds.length?'NOT_REFERENCED':'NO_SOURCES',shared:shared.map(source),decisiveEffects:decisive.map(effect),independentVotes:false,interpretationQuality:'NOT_VERIFIED'});
 }
 return {ok:!issues.length,issues,view:issues.length?null:view,original:raw,semanticTruthVerified:false,predictiveQualityVerified:false,scope:'Geschlossene eigene Belegseiten, appseitig abgeleiteter Domänen-/Gegenargumentstatus und beleggebundenes Modellurteil. Keine Prüfung optimaler Gewichtung oder vollständigen Verstehens. REFERENCED bedeutet nur gewählt, nicht nachgewiesen gedanklich abgewogen.'};
}
