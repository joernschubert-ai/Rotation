function positive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
function marketDate(time: number): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(time));
  const get = (type: string) => parts.find(part => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Never compress gaps or forward-fill a missing daily bar with yesterday's close. */
export function prepareObservedIndexSeries(result: any, symbol: string, now = Date.now()) {
  const supplied = result?.indicators?.quote?.[0]?.close;
  const times = Array.isArray(result?.timestamp) ? result.timestamp : [];
  const closes: number[] = Array.isArray(supplied) ? supplied.map(value => positive(value) ? value : NaN) : [];
  const barTime = typeof times[times.length - 1] === "number" ? times[times.length - 1] * 1000 : NaN;
  const quoteTime = typeof result?.meta?.regularMarketTime === "number" ? result.meta.regularMarketTime * 1000 : NaN;
  const quote = result?.meta?.regularMarketPrice;
  const last = closes.length - 1;
  let currentFromQuote = false;
  // A real quote can complete the current daily endpoint only on the same market date.
  // An old Russell quote must never fill today's empty bar.
  if (last >= 0 && !positive(closes[last]) && positive(quote) && Number.isFinite(barTime) && Number.isFinite(quoteTime) &&
    quoteTime >= barTime && quoteTime <= now + 60000 && marketDate(quoteTime) === marketDate(barTime)) {
    closes[last] = quote;
    currentFromQuote = true;
  }
  let validIndex = last;
  while (validIndex >= 0 && !positive(closes[validIndex])) validIndex--;
  const validTime = typeof times[validIndex] === "number" ? times[validIndex] * 1000 : NaN;
  const endpointAvailable = last >= 0 && positive(closes[last]);
  const observedTime = currentFromQuote ? quoteTime : endpointAvailable ? barTime : NaN;
  return { closes, quality: {
    symbol, retrievedAt: new Date(now).toISOString(), latestBarTimestamp: Number.isFinite(barTime) ? new Date(barTime).toISOString() : null,
    regularMarketTimestamp: Number.isFinite(quoteTime) ? new Date(quoteTime).toISOString() : null,
    currentObservationTimestamp: Number.isFinite(observedTime) ? new Date(observedTime).toISOString() : null,
    latestEndpointAvailable: endpointAvailable, currentFromQuote,
    lastValidClose: validIndex >= 0 ? closes[validIndex] : null,
    lastValidBarTimestamp: Number.isFinite(validTime) ? new Date(validTime).toISOString() : null,
    lastValidIsCurrentEndpoint: validIndex === last && endpointAvailable,
    missingBars: closes.filter(value => !Number.isFinite(value)).length, gapsPreserved: true,
  } };
}
