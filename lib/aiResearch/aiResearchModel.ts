/** Regular synthesis and diagnostics share the tested Gemma direct configuration.
 * Manual comparison candidates are deliberately independent; no automatic fallback.
 */
export const RESEARCH_MODEL='@cf/google/gemma-4-26b-a4b-it';
export const RESEARCH_TRANSPORT_PROFILE='GEMMA_DIRECT_V47';
export function researchTransport<T extends object>(body:T){
 return {...body,chat_template_kwargs:{enable_thinking:false}};
}
