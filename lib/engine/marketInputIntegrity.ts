const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const positive = (value: unknown) => finite(value) && value > 0;

export function engineDataIssues(data: any): string[] {
  if (!data || typeof data !== "object" || !data.marketData) return ["MARKET_DATA_MISSING"];
  const issues: string[] = [];
  for (const key of ["rsSmall", "rsGrowth", "rsEqual"]) if (!positive(data.rotation?.[key])) issues.push(`ROTATION_${key}_MISSING`);
  for (const key of ["breadth20", "breadth50", "breadth200"]) if (!finite(data[key]) || data[key] < 0 || data[key] > 100) issues.push(`${key}_MISSING_OR_INVALID`);
  if (data.breadthDataQuality && (!finite(data.breadthDataQuality.valid) || data.breadthDataQuality.valid <= 0)) issues.push("BREADTH_SAMPLE_UNAVAILABLE");
  if (data.concentrationMeta?.sourceAvailable !== true) issues.push("CONCENTRATION_CONTEXT_MISSING");
  for (const key of ["ndx", "spx"]) {
    if (!positive(data.indices?.[key]?.value)) issues.push(`${key}_CURRENT_MISSING`);
    if (data.indices?.[key]?.priceMetrics?.dataQuality?.stale === true) issues.push(`${key}_STALE`);
  }
  if (!positive(data.marketData?.["^VIX"]?.current)) issues.push("VIX_MISSING");
  for (const key of ["moveIndex", "vixTermRatio", "volOfVolRatio"]) if (!positive(data[key])) issues.push(`${key}_MISSING`);
  if (!finite(data.marketLiquidityScore) || data.marketLiquidityScore < 0 || data.marketLiquidityScore > 100) issues.push("RAW_LIQUIDITY_MISSING");
  if (data.creditDataQuality?.available !== true) issues.push("CREDIT_CONTEXT_INCOMPLETE");
  if (data.volatilityDataQuality && data.volatilityDataQuality.available !== true) issues.push("VOLATILITY_CONTEXT_UNAVAILABLE");
  return issues;
}

/** Missing own-index prices can block an entry, never approve its opposite direction. */
export function guardOwnPriceEntry(candidate: any, price: any, instrument: "NASDAQ_PUT" | "NASDAQ_CALL" | "RUSSELL_CALL", historicalScenario = false) {
  if (historicalScenario) return candidate;
  const quality = price?.dataQuality;
  const complete = positive(price?.value) && quality?.momentum5DAvailable === true && quality?.momentum20DAvailable === true && quality?.accelerationAvailable === true &&
    [price?.momentum5D, price?.momentum20D, price?.acceleration, price?.score].every(finite);
  if (complete) return candidate;
  const reason = "OWN_INDEX_PRICE_DATA_INCOMPLETE";
  const result: any = { ...candidate, active: false, execution: instrument === "NASDAQ_PUT" ? "NONE" : "WAIT",
    blockReasons: [...new Set([...(candidate?.blockReasons ?? []), reason])],
    dataQuality: { ...candidate?.dataQuality, ownPriceComplete: false, entryBlockedByData: true },
    summary: `${candidate?.summary ?? ""} | Own index price data incomplete; no new entry`.trim(),
  };
  if (instrument === "NASDAQ_PUT") Object.assign(result, { decision: "WAIT", timing: "WAIT", entryWindow: "CLOSED" });
  else if (instrument === "NASDAQ_CALL") Object.assign(result, { decision: "NONE", signal: "NONE", mode: "OFF", suggestedSize: 0 });
  else Object.assign(result, { decision: "NO_TRADE", action: "NO_TRADE", signal: "NONE", state: "BLOCKED", mode: "NONE" });
  return result;
}


/** Preserve descriptive calculations, but never authorize new entries from fallback volatility. */
export function guardVolatilityContext(engine:any,data:any){
 const quality=data?.volatilityDataQuality;
 if(!quality||engine?.historicalScenario===true)return engine;
 if(quality.entryBlocked!==true)return {...engine,volatilityDataQuality:quality};
 const reason='VOLATILITY_CONTEXT_NOT_CURRENT',message=quality.message??reason;
 const blocked=(value:any)=>({...value,eligible:false,active:false,size:0,suggestedSize:0,execution:'NONE',entryBlockedByData:true,
  blockReasons:[...new Set([...(Array.isArray(value?.blockReasons)?value.blockReasons:[]),reason])]});
 const stack=engine.tradeStack??{},sizing=engine.sizing??{};
 const flows=Array.isArray(sizing.flows)?sizing.flows.map(blocked):[];
 return {...engine,volatilityDataQuality:quality,newEntriesBlocked:true,
  signal:{...engine.signal,active:false,blockReason:reason},superSignal:{...engine.superSignal,active:false,signal:'NONE',blockReason:reason},
  putTiming:{...blocked(engine.putTiming),decision:'WAIT',timing:'WAIT',entryWindow:'CLOSED',summary:message},
  nasdaqCall:{...blocked(engine.nasdaqCall),decision:'NONE',signal:'NONE',mode:'OFF',summary:message},
  russell:{...blocked(engine.russell),decision:'NO_TRADE',action:'NO_TRADE',signal:'NONE',state:'BLOCKED',summary:message},
  tradeStack:{...stack,state:'DATA_BLOCKED',type:'NONE',strength:0,driver:reason,
   primaryFlow:{instrument:'NONE',direction:'NONE',state:'DATA_BLOCKED',strength:0,driver:reason},
   nasdaqPut:blocked(stack.nasdaqPut),nasdaqCall:blocked(stack.nasdaqCall),russellCall:blocked(stack.russellCall),
   candidates:Array.isArray(stack.candidates)?stack.candidates.map(blocked):[],assessedCandidates:Array.isArray(stack.assessedCandidates)?stack.assessedCandidates.map(blocked):[]},
  sizing:{...sizing,size:0,direction:'NONE',mode:'WAIT',primary:null,nasdaqPut:blocked(sizing.nasdaqPut),nasdaqCall:blocked(sizing.nasdaqCall),russellCall:blocked(sizing.russellCall),flows,activeFlows:[],activeInstruments:[],
   portfolio:{...sizing.portfolio,totalSize:0,rawSize:0,activeFlows:0,activeInstruments:[],direction:'NONE'},dataBlockReason:reason},
  decision:{...engine.decision,finalAction:'WAIT',direction:'NONE',execution:'NONE',activeFlows:[],reason:message},
  execution:{...engine.execution,action:'WAIT',mode:'WAIT',note:message},
  executionState:{...engine.executionState,tacticalBias:'NONE',executionMode:'WAIT',summary:message}
 };
}
