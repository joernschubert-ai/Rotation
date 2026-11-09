/** Lexical relevance only: no event verification, causal claim or trading direction. */
export function newsRelevance(title:string,summary='',market?:string){
 const text=title+' '+summary;
 const generic=/^(?:CBOE |Cboe )?Volatility Index.*(?:charts?,? data|data and news)|^(?:NASDAQ|Russell|S&P).*quotes?[, ]|^.*\^[A-Z0-9]+.*charts?,? data/i.test(title);
 const peripheral=/\b(?:India(?:n)?|rupee|China(?:'s)?|Chinese|Eurozone|European Central Bank|ECB|Japan(?:ese)?|yen)\b/i.test(text);
 const us=/\b(?:U\.?S\.?|United States|Wall Street|Nasdaq|Russell|S&P ?500|Treasur(?:y|ies)|Fed|FOMC|Federal Reserve|nonfarm payrolls?|midterms?)\b/i.test(text);
 const nasdaq=/\b(?:Nasdaq|Nvidia|Microsoft|semiconductors?)\b/i.test(text);
 const russell=/\b(?:Russell|small[ -]?caps?|regional banks?)\b/i.test(text);
 const specific=market==='NASDAQ'?nasdaq:market==='RUSSELL_2000'?russell:false;
 const macro=/\b(?:inflation|CPI|PPI|PCE|personal consumption expenditures|Fed|FOMC|Federal Reserve|Treasur(?:y|ies)|payrolls?|unemployment|employment report|jobs report|GDP|gross domestic product|retail sales|ISM|midterms?|elections?|tariffs?)\b/i.test(text);
 // A foreign reference does not erase an explicit US-market link. Foreign-only items stay peripheral.
 const tier=generic?'REFERENCE_PAGE':specific?'INDEX_HINT':us&&macro?'US_MACRO':peripheral&&!us?'PERIPHERAL':'UNRESOLVED';
 return {policy:'NEWS_RELEVANCE_V2',tier,priority:tier==='INDEX_HINT'?0:tier==='US_MACRO'?1:2,eligibleForBrief:tier==='INDEX_HINT'||tier==='US_MACRO',verified:false};
}
