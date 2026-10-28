import { evaluationInput } from './aiResearchEvaluation';
import { buildResearchConcepts } from './aiResearchConcepts';
import { freezeRequest } from './aiResearchComparison';
import { createHash } from 'node:crypto';
export const CONDITION_TRIAL_CASES=['recovery','continuation'] as const;
export const CONDITION_TRIAL_VARIANTS=['baseline','candidate'] as const;
/** Keep the current data/system prompt, except the one condition-output obligation. */
export function conditionTrial(caseId:string,variant:string){
 if(!CONDITION_TRIAL_CASES.includes(caseId as typeof CONDITION_TRIAL_CASES[number])||!CONDITION_TRIAL_VARIANTS.includes(variant as typeof CONDITION_TRIAL_VARIANTS[number]))return null;
 const value=evaluationInput(caseId);if(!value)return null;
 const baseline=value.frozen,original=baseline.body.messages[0].content;
 const from='Nenne das stärkste instrumentgerechte Gegenrisiko und eine noch offene gelieferte Preisbedingung mit Wirkung auf diese Idee.';
 const to='Nenne das stärkste instrumentgerechte Gegenrisiko. Wähle pro Instrument eine gelieferte noch offene Kursreferenz mit eigenem Beleg (keine GRID-/Musterbedingung). Schreibe als letzte Zeile des Abschnitts exakt „Preisbedingung: ID“, zum Beispiel mit einer tatsächlich gelieferten eigenen Referenzkennung. Preis, Datum und Wirkung dieser ausgewählten Bedingung stellt die App dar; diese Daten nicht erneut frei formulieren. Die übrige Abwägung bleibt frei.';
 if(!original.includes(from))return null; // Refuse silent changes against an unknown baseline prompt.
 const prompt=variant==='candidate'?original.replace(from,to):original;
 const frozen=variant==='baseline'?baseline:freezeRequest(baseline.snapshotTimestamp,prompt,baseline.body.messages[1].content,baseline.body.temperature,baseline.body.max_tokens);
 return {version:'CONDITION_TRIAL_V67',variant,spec:value.spec,frozen,baselineId:baseline.id,dataHash:createHash('sha256').update(baseline.body.messages[1].content).digest('hex'),concepts:buildResearchConcepts(value.data),data:value.data};
}
