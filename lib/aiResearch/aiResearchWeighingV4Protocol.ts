import type {prepareScenarioContext} from './aiResearchScenarioContext';
import {prepareArgumentEffects} from './aiResearchArgumentEffects';
type Context=ReturnType<typeof prepareScenarioContext>;
export function prepareWeighingV4Policy(context:Context){
 const effects=prepareArgumentEffects(context);
 const catalog=context.links.catalog.map(c=>{const own=effects.effects.filter(e=>e.market===c.market),price=own.filter(e=>!['HISTORICAL_MEAN','POSITIONING_CONTEXT','SHARED_CONTEXT'].includes(e.facet));return {market:c.market,baseDirection:c.baseDirection,sameEffectIds:price.filter(e=>e.relation==='SAME_DIRECTION_CONTEXT').map(e=>e.effectId),oppositeEffectIds:price.filter(e=>e.relation==='OPPOSITE_DIRECTION_CONTEXT').map(e=>e.effectId),cotSourceIds:c.cotIds,historyEffectIds:own.filter(e=>e.facet==='HISTORICAL_MEAN').map(e=>e.effectId),sharedSourceIds:c.riskIds};});
 const decisions=catalog.map(c=>({market:c.market,options:[{decisionId:'OPEN',judgement:'OPEN',effectId:null},...effects.effects.filter(e=>e.market===c.market&&[...c.sameEffectIds,...c.oppositeEffectIds,...c.historyEffectIds].includes(e.effectId)&&['SAME_DIRECTION_CONTEXT','OPPOSITE_DIRECTION_CONTEXT'].includes(e.relation)).map(e=>({decisionId:c.market+'::'+e.effectId,judgement:e.relation==='SAME_DIRECTION_CONTEXT'?'BASE_CONTEXT_STRONGER':'COUNTER_CONTEXT_STRONGER',effectId:e.effectId}))]}));
 return {context,effects,catalog,decisions};
}
export type WeighingV4Policy=ReturnType<typeof prepareWeighingV4Policy>;
export function validateWeighingV4(p:WeighingV4Policy,raw:unknown){
 const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
 const exact=(v:unknown,keys:string[])=>{const o=object(v);return Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));};
 const r=object(raw),issues:Array<{market:string;code:string;field?:string}>=[],view:Array<Record<string,any>>=[];const add=(market:string,code:string,field?:string)=>issues.push({market,code,...(field?{field}:{})});
 if(!exact(r,['version','baseEpisodeId','factsHash','markets'])||r.version!=='CONTEXT_WEIGHING_V4'||r.baseEpisodeId!==p.context.base.id||r.factsHash!==p.context.base.factsHash||!Array.isArray(r.markets)||r.markets.length!==2)add('ALL','FRAME_OR_SCHEMA');
 const seen=new Set<string>();
 for(const item of Array.isArray(r.markets)?r.markets:[]){const row=object(item),own=p.catalog.find(c=>c.market===row.market);if(!own||seen.has(row.market)||!exact(row,['market','sameEffectIds','oppositeEffectIds','cotSourceIds','historyEffectIds','sharedSourceIds','decisionId'])){add(String(row.market),'OWN_UNIQUE_FIELDS');continue;}seen.add(row.market);
  const list=(field:string,allowed:string[],max:number)=>{const a=row[field];if(!Array.isArray(a)||a.length>max||a.some(id=>typeof id!=='string'||!allowed.includes(id))||new Set(a).size!==a.length){add(row.market,'CLOSED_LIST',field);return [] as string[];}return a as string[];};
  const same=list('sameEffectIds',own.sameEffectIds,3),opposite=list('oppositeEffectIds',own.oppositeEffectIds,3),cot=list('cotSourceIds',own.cotSourceIds,2),history=list('historyEffectIds',own.historyEffectIds,3),shared=list('sharedSourceIds',own.sharedSourceIds,2);
  const decision=p.decisions.find(d=>d.market===row.market)?.options.find(d=>d.decisionId===row.decisionId);
  if(!decision)add(row.market,'DECISION_SCOPE');
  const decisive=decision?.effectId?[decision.effectId]:[];
  const effect=(id:string)=>p.effects.effects.find(e=>e.effectId===id)!;
  const source=(id:string)=>p.context.links.byId.get(id)!;
  const key=decision?.effectId?effect(decision.effectId):null;
  const keyIsHistory=key?.facet==='HISTORICAL_MEAN';
  const keyIsCounterPrice=!!key&&!keyIsHistory&&key.relation==='OPPOSITE_DIRECTION_CONTEXT';
  const listed=[...same,...opposite,...history];
  const allReferences=[...new Set([...listed,...decisive])];
  const coverage={listEffectIds:listed,decisionEffectIds:decisive,allReferencedEffectIds:allReferences,distinctSourceIds:[...new Set([...allReferences.map(id=>effect(id).sourceId),...cot,...shared])],decisionReferenceOrigin:'MODEL_DECISION_ID',listsAutoCompleted:false};
  view.push({market:row.market,baseDirection:own.baseDirection,decisionId:decision?.decisionId??null,judgement:decision?.judgement??null,judgementOrigin:'APP_MAPPING_OF_MODEL_CHOSEN_DECISION',sameEffects:same.map(effect),oppositeEffects:opposite.map(effect),counterStatus:opposite.length||keyIsCounterPrice?'REFERENCED':own.oppositeEffectIds.length?'NOT_REFERENCED':'NO_OPPOSITE_AVAILABLE',cot:cot.map(source),cotStatus:cot.length?'REFERENCED':own.cotSourceIds.length?'NOT_REFERENCED':'NO_SOURCES',history:history.map(effect),historyStatus:history.length||keyIsHistory?'REFERENCED':own.historyEffectIds.length?'NOT_REFERENCED':'NO_SOURCES',shared:shared.map(source),decisiveEffects:decisive.map(effect),decisiveSourceTexts:decisive.map(id=>({sourceId:effect(id).sourceId,text:source(effect(id).sourceId)?.text??null,asOf:source(effect(id).sourceId)?.asOf??null})),referenceCoverage:coverage,independentVotes:false,interpretationQuality:'NOT_VERIFIED'});
 }
 return {ok:!issues.length,issues,view:issues.length?null:view,original:raw,semanticTruthVerified:false,predictiveQualityVerified:false,scope:'Der Schlüsselbeleg ist durch die gewählte eigene decisionId selbst ausdrücklich referenziert. Keine Pflicht zur doppelten Listennennung; keine automatische Ergänzung von Listen. Geschlossene eigene Belegseiten, appseitig abgeleiteter Domänen-/Gegenargumentstatus und appseitig fest zugeordnete Urteil-Beleg-Kombination. Keine Prüfung optimaler Gewichtung oder vollständigen Verstehens. REFERENCED bedeutet nur gewählt, nicht nachgewiesen gedanklich abgewogen.'};
}

/** Small deterministic preflight, no model or storage. Runs against the actual prepared frame. */
export function checkWeighingV4Contract(p:WeighingV4Policy){
 const checks:Array<{name:string;passed:boolean}>=[];
 const check=(name:string,passed:boolean)=>checks.push({name,passed});
 const open={version:'CONTEXT_WEIGHING_V4',baseEpisodeId:p.context.base.id,factsHash:p.context.base.factsHash,markets:p.catalog.map(c=>({market:c.market,sameEffectIds:[],oppositeEffectIds:[],cotSourceIds:[],historyEffectIds:[],sharedSourceIds:[],decisionId:'OPEN'}))};
 check('Offene Bewertung ohne erfundene Quellen',validateWeighingV4(p,open).ok);
 const wrongFrame={...open,factsHash:'WRONG'};check('Fremder Faktenrahmen zurückgehalten',!validateWeighingV4(p,wrongFrame).ok);
 const unknown=structuredClone(open);unknown.markets[0].decisionId='UNKNOWN';check('Unbekannte Entscheidung zurückgehalten',!validateWeighingV4(p,unknown).ok);
 for(const c of p.decisions){const d=c.options.find(d=>d.effectId!==null);if(!d)continue;const candidate=structuredClone(open);candidate.markets.find(m=>m.market===c.market)!.decisionId=d.decisionId;const v=validateWeighingV4(p,candidate),row=v.view?.find(m=>m.market===c.market);
 check(c.market+': Schlüsselbeleg ohne doppelte Nennung',v.ok&&row?.decisiveEffects[0]?.effectId===d.effectId&&row?.sameEffects.length===0&&row?.oppositeEffects.length===0&&row?.history.length===0&&row?.referenceCoverage.listsAutoCompleted===false);
 }
 for(const c of p.decisions)for(const d of c.options){if(!d.effectId)continue;const e=p.effects.effects.find(e=>e.market===c.market&&e.effectId===d.effectId);check(c.market+': '+d.effectId,!!e&&d.judgement===(e.relation==='SAME_DIRECTION_CONTEXT'?'BASE_CONTEXT_STRONGER':'COUNTER_CONTEXT_STRONGER'));}
 return {version:'WEIGHING_V4_PREFLIGHT',passed:checks.every(c=>c.passed),checks,modelRequestsUsed:0,memoryWritten:false};
}
