/** Headline relevance aid only. No content verification, score or market direction. */
export function newsRelevance(title:string,summary='',market?:string){
 const text=title+' '+summary;
 const generic=/^(?:CBOE |Cboe )?Volatility Index.*(?:charts?,? data|data and news)|^(?:NASDAQ|Russell|S&P).*quotes?[, ]|^.*\^[A-Z0-9]+.*charts?,? data/i.test(title);
 const peripheral=/\b(?:India(?:n)?|rupee|China(?:'s)?|Chinese|Eurozone|European Central Bank|ECB|Japan(?:ese)?|yen)\b/i.test(text);
 const us=/\b(?:U\.?S\.?|United States|Wall Street|Nasdaq|Russell|S&P ?500|Treasur(?:y|ies)|Fed|FOMC|Federal Reserve|nonfarm payrolls?|midterms?)\b/i.test(text);
 const specific=market==='NASDAQ'?/\b(?:Nasdaq|Nvidia|Microsoft|semiconductors?)\b/i.test(text):market==='RUSSELL_2000'?/\b(?:Russell|small[ -]?caps?|regional banks?)\b/i.test(text):false;
 const macro=/\b(?:inflation|CPI|PPI|Fed|FOMC|Federal Reserve|Treasur(?:y|ies)|payrolls?|unemployment|midterms?|elections?|tariffs?)\b/i.test(text);
 const tier=generic?'REFERENCE_PAGE':peripheral&&!specific?'PERIPHERAL':specific?'INDEX_HINT':us&&macro?'US_MACRO':'UNRESOLVED';
 return {policy:'NEWS_RELEVANCE_V1',tier,priority:tier==='INDEX_HINT'?0:tier==='US_MACRO'?1:2,eligibleForBrief:tier==='INDEX_HINT'||tier==='US_MACRO',verified:false};
}
