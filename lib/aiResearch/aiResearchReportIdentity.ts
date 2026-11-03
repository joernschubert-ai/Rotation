/** Browser/server shared identity fields; no providers, storage, dates or Node dependencies. */
export function reportSourceIdentityFields(report:unknown){
 const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
 const synthesis=object(object(report).aiSynthesis),review=object(synthesis.sourceReview),quality=object(synthesis.quality);
 return {model:typeof synthesis.model==='string'?synthesis.model:null,modelGeneratedAt:synthesis.generatedAt??null,originalText:typeof review.originalText==='string'?review.originalText:typeof quality.providerText==='string'?quality.providerText:null};
}
