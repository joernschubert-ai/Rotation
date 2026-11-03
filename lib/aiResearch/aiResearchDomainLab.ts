import {Redis} from '@upstash/redis';
import {freezeRequest,saveFrozenRequest,runFullComparison} from './aiResearchComparison';
import {selectionContext} from './aiResearchSelectionContract';
import {sourceFactsHash} from './aiResearchSourceReview';
import {buildDomainBriefs} from './aiResearchDomainBriefs';
import {DOMAIN_INTERPRETATION_PROMPT,DOMAIN_INTERPRETATION_CONTRACT,buildNeutralDomainCards,neutralDomainModelView,reviewDomainInterpretation} from './aiResearchDomainInterpretation';
const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
export const DOMAIN_LAB='DOMAIN_LAB_V3_1';
export function prepareDomainLab(value:unknown){
 const root=object(value),report=object(root.report??root),facts=report.appFacts??(root.version==='APP_FACTS_V71'?root:null),context=selectionContext(facts);
 const briefs=buildDomainBriefs(context.facts,context.allowed),user=neutralDomainModelView(context.facts,briefs);
 if(user.length>26000)throw Error('DOMAIN_INPUT_LIMIT');
 return {version:DOMAIN_LAB,context,briefs,appContext:buildNeutralDomainCards(context.facts,briefs),factsHash:sourceFactsHash(context.facts),candidate:freezeRequest(context.facts.snapshotTimestamp,DOMAIN_INTERPRETATION_PROMPT,user,0.7,2200)};
}
/** App context is not chosen or changed by the model and is not a vote for an instrument. */
export function domainPreview(p:ReturnType<typeof prepareDomainLab>){
 return {ok:true,version:DOMAIN_LAB,modelRequestsUsed:0,productionChanged:false,snapshotTimestamp:p.context.facts.snapshotTimestamp,sourceFactsHash:p.factsHash,candidateId:p.candidate.id,
  inputCharacters:{candidate:p.candidate.body.messages[1].content.length},outputContract:DOMAIN_INTERPRETATION_CONTRACT,
  contextOrigin:'APP_NOT_MODEL_SELECTION',appContext:p.appContext,briefs:p.briefs,
  controls:{model:'@cf/google/gemma-4-26b-a4b-it',temperature:0.7,maxOutputTokens:2200,automaticCalls:false,sharedQuota:true,modelChoosesSources:false,modelAssignsArgumentSides:false,modelAssignsStance:false},
  comparison:'V3.1 behält den Laborvertrag und trennt verbindlichen neutralen App-Fachkontext von freier Interpretation. Neuer Laborvertrag ohne Quellenwahl, Argumentseiten oder stance. Kein gepaarter Modellvergleich und keine Änderung am normalen V79.3-Vertrag.',
  manualReview:['Nettozustand von jeder Änderungsrichtung unterscheiden.','1 Woche gegenüber 4/13 Wochen richtig abwägen.','Unterschiedliche Gruppenbestände von gegenläufigen Gruppenänderungen unterscheiden.','Historisches absolutes Mittel, Basisvergleich, Streuung und nichtüberlappende Fallzahl beachten.','Keine automatische COT-Preisrichtung oder Prognosequalität ableiten.'],semanticTruthVerified:false};
}
export function evaluateDomainLab(p:ReturnType<typeof prepareDomainLab>,raw:unknown,finish:unknown='stop'){
 const review=reviewDomainInterpretation(raw,finish,p.briefs);
 return {ok:review.status==='INTERPRETATION_AVAILABLE',version:DOMAIN_LAB,modelRequestsUsed:0,productionChanged:false,sourceFactsHash:p.factsHash,
  outputContract:DOMAIN_INTERPRETATION_CONTRACT,interpretationReview:review,appContext:p.appContext,briefs:p.briefs,
  coverage:p.appContext.map(c=>({instrument:c.instrument,contextSourceIds:c.sources.map(s=>s.id),origin:c.origin,missingGroups:c.missingGroups,modelSelectionRequired:false,interpretationVerified:false})),
  semanticTruthVerified:false,requiresManualReview:true,note:'ok bestätigt ausschließlich das Antwortformat. Alle App-Kontexte bleiben unabhängig von der Antwort sichtbar. Quellenabdeckung ist keine von der KI nachgewiesene Leistung; Interpretation und Gewichtung sind ungeprüft.'};
}
export async function runDomainLab(p:ReturnType<typeof prepareDomainLab>,variant:unknown,expectedId:unknown,expectedFactsHash:unknown){
 if(variant!=='candidate')return {ok:false,modelRequestsUsed:0,message:'Nur der V3-Fachkandidat ist ausführbar.'};
 if(expectedId!==p.candidate.id||expectedFactsHash!==p.factsHash)return {ok:false,modelRequestsUsed:0,message:'Eingabe verändert. Erst neue Vorschau prüfen.'};
 await saveFrozenRequest(Redis.fromEnv(),p.candidate,{updateLatest:false});
 const answer=object(await runFullComparison(p.candidate.id,'gemma'));
 if(answer.ok!==true)return {ok:false,version:DOMAIN_LAB,variant,productionChanged:false,appContext:p.appContext,briefs:p.briefs,original:answer,modelRequestsUsed:answer.modelRequestsUsed??0};
 return {...evaluateDomainLab(p,answer.answerText,answer.truncated===true?'length':answer.finishReason),variant,inputId:p.candidate.id,original:answer,modelRequestsUsed:answer.modelRequestsUsed??0};
}
