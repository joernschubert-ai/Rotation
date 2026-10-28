import { evaluationInput } from './aiResearchEvaluation';
import { freezeRequest } from './aiResearchComparison';
import { createHash } from 'node:crypto';
export const FACT_CONDITION_RULES = `Zusätzliche Präzisierung für die freie Abwägung: Ein COT-Nettozustand und seine Veränderungen sind getrennte Fakten. Wenn du einen Horizontkonflikt nennst, übernimm ausschließlich die in der eigenen Gruppenkarte angegebenen Gegensatzpaare; ordne die Horizonte nicht neu und übertrage keinen Konflikt auf eine andere Gruppe. Eine noch offene Kursreferenz oder erhoffte Rückkehr ist eine künftige bedingte Stärkung/Schwächung, kein bereits beobachtetes Pro-Argument. Benenne bei fehlendem aktuellem Pro-Befund diese Lücke; historische Folgerenditen dürfen als historischer Kontext bleiben. Eine frühe Gegenidee darf mit anderen vorhandenen Befunden vor Erfüllung einer Referenz begründet sein; die Referenz ist keine pauschale notwendige Voraussetzung jeder frühen These. Kein Nettoüberhang oder fehlendes Umkehrsignal allein beweist eine Kursrichtung.`;
/** Isolated V66 comparison. Same complete user data, one appended system paragraph. */
export function factConditionTrial(caseId:string,variant:string){
  if(!['recovery','continuation'].includes(caseId)||!['baseline','candidate'].includes(variant))return null;
  const value=evaluationInput(caseId);if(!value)return null;
  const baseline=value.frozen;
  if(!baseline.body.messages[0].content.includes('Nenne das stärkste instrumentgerechte Gegenrisiko und eine noch offene gelieferte Preisbedingung mit Wirkung auf diese Idee.'))return null;
  const frozen=variant==='baseline'?baseline:freezeRequest(baseline.snapshotTimestamp,baseline.body.messages[0].content+'\n\n'+FACT_CONDITION_RULES,baseline.body.messages[1].content,baseline.body.temperature,baseline.body.max_tokens);
  return {version:'FACT_CONDITION_TRIAL_V68',variant,spec:value.spec,frozen,baselineId:baseline.id,
    dataHash:createHash('sha256').update(baseline.body.messages[1].content).digest('hex')};
}
