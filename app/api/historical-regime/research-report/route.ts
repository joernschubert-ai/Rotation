import { NextRequest, NextResponse } from "next/server";

import { GET as getHistoricalMacroReport } from
"../macro-features-test/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =====================================================
TYPES
===================================================== */

type JsonObject = Record<string, unknown>;

/* =====================================================
SAFE ACCESS HELPERS
===================================================== */

function object(value: unknown): JsonObject {
return value !== null &&
typeof value === "object" &&
!Array.isArray(value)
? value as JsonObject
: {};
}

function array(value: unknown): unknown[] {
return Array.isArray(value) ? value : [];
}

function get(value: unknown, ...keys: string[]): unknown {
let current: unknown = value;

for (const key of keys) {
current = object(current)[key];
}

return current;
}

function str(value: unknown): string {
if (value === null || value === undefined) {
return "n/a";
}

return String(value);
}

function num(value: unknown, digits = 2): string {
if (
typeof value !== "number" ||
!Number.isFinite(value)
) {
return "n/a";
}

return value.toFixed(digits);
}

function percent(value: unknown): string {
return typeof value === "number"
? `${num(value)} %`
: "n/a";
}

function signed(value: unknown): string {
if (
typeof value !== "number" ||
!Number.isFinite(value)
) {
return "n/a";
}

const prefix = value > 0 ? "+" : "";

return `${prefix}${num(value)} PP`;
}

function line(title: string, value: unknown): string {
return `${title.padEnd(34)} ${str(value)}`;
}

function section(title: string): string {
return [
"",
"=".repeat(70),
title,
"=".repeat(70),
].join("\n");
}

/* =====================================================
FORMATTING
===================================================== */

function outcomeLines(
title: string,
outcome: unknown,
): string[] {
return [
title,
` Beobachtungen: ${str(get(outcome, "count"))}`,
` Durchschnitt: ${percent(get(outcome, "mean"))}`,
` Median: ${percent(get(outcome, "median"))}`,
` Positive Renditen: ${percent(get(outcome, "positiveShare"))}`,
` Negative Renditen: ${percent(get(outcome, "negativeShare"))}`,
` Minimum: ${percent(get(outcome, "minimum"))}`,
` Maximum: ${percent(get(outcome, "maximum"))}`,
];
}

function benchmarkLines(
title: string,
comparison: unknown,
): string[] {
return [
title,
` Signal-Episoden: ${str(get(comparison, "signalCount"))}`,
` Benchmark-Tage: ${str(get(comparison, "benchmarkCount"))}`,
` Signal-Durchschnitt: ${percent(get(comparison, "signalMean"))}`,
` Benchmark-Mittel: ${percent(get(comparison, "benchmarkMean"))}`,
` Mittelwert-Differenz: ${signed(get(comparison, "meanDifferencePercentagePoints"))}`,
` Signal-Median: ${percent(get(comparison, "signalMedian"))}`,
` Benchmark-Median: ${percent(get(comparison, "benchmarkMedian"))}`,
` Median-Differenz: ${signed(get(comparison, "medianDifferencePercentagePoints"))}`,
` Negative Signale: ${percent(get(comparison, "signalNegativeShare"))}`,
` Negative Benchmark: ${percent(get(comparison, "benchmarkNegativeShare"))}`,
` Differenz Negativ: ${signed(get(comparison, "negativeShareDifferencePoints"))}`,
];
}

/* =====================================================
HISTORICAL PERIOD REPORT
===================================================== */

function periodReport(period: unknown): string[] {
const id = str(get(period, "id"));

const starts = get(
period,
"episodeStartOutcomes",
);

const comparison = get(
period,
"episodeStartVsBenchmark",
);

return [
"",
`ZEITRAUM ${id}`,
"-".repeat(55),

line(
"Signaltage:",
get(period, "signalDays"),
),

line(
"Episodenstarts:",
get(period, "episodeStarts"),
),

"",
...outcomeLines(
"20-TAGE-ERGEBNIS",
get(starts, "forward20D"),
),

"",
...outcomeLines(
"60-TAGE-ERGEBNIS",
get(starts, "forward60D"),
),

"",
...benchmarkLines(
"BENCHMARK 20 TAGE",
get(comparison, "forward20D"),
),

"",
...benchmarkLines(
"BENCHMARK 60 TAGE",
get(comparison, "forward60D"),
),
];
}

/* =====================================================
SIGNAL REPORT
===================================================== */

function signalReport(result: unknown): string[] {
const diagnostics = get(
result,
"diagnostics",
);

const starts = get(
result,
"episodeStartOutcomes",
);

const comparisons = get(
result,
"episodeStartVsBenchmark",
);

const periods = array(
get(result, "periods"),
);

return [
section(str(get(result, "id"))),

"",
str(get(result, "label")),
"",

line(
"Signaltage:",
get(diagnostics, "matchedDays"),
),

line(
"Zusammenhängende Episoden:",
get(diagnostics, "contiguousEpisodes"),
),

line(
"Episoden mit 20D-Ergebnis:",
get(diagnostics, "completedEpisodeStarts20D"),
),

line(
"Episoden mit 60D-Ergebnis:",
get(diagnostics, "completedEpisodeStarts60D"),
),

line(
"Offene 20D-Ergebnisse:",
get(diagnostics, "pendingEpisodeStarts20D"),
),

line(
"Offene 60D-Ergebnisse:",
get(diagnostics, "pendingEpisodeStarts60D"),
),

line(
"Erste Episode:",
get(diagnostics, "firstEpisodeDate"),
),

line(
"Letzte Episode:",
get(diagnostics, "lastEpisodeDate"),
),

line(
"Längste Episode:",
get(diagnostics, "longestEpisodeDays"),
),

"",
...outcomeLines(
"EPISODENSTART: 20 HANDELSTAGE",
get(starts, "forward20D"),
),

"",
...outcomeLines(
"EPISODENSTART: 60 HANDELSTAGE",
get(starts, "forward60D"),
),

"",
...outcomeLines(
"MAXIMUM FAVORABLE EXCURSION 20D",
get(starts, "mfe20D"),
),

"",
...outcomeLines(
"MAXIMUM ADVERSE EXCURSION 20D",
get(starts, "mae20D"),
),

"",
...benchmarkLines(
"BENCHMARK: 20 HANDELSTAGE",
get(comparisons, "forward20D"),
),

"",
...benchmarkLines(
"BENCHMARK: 60 HANDELSTAGE",
get(comparisons, "forward60D"),
),

"",
"HISTORISCHE ZEITABSCHNITTE",

...periods.flatMap(periodReport),
];
}

/* =====================================================
TARGET SIGNALS
===================================================== */

const TARGET_SIGNALS = [
"nasdaq-extended-breadth50-weak",
"nasdaq-extended-breadth200-weak",
"combined-structural-stress",
] as const;

/* =====================================================
BUILD COMPLETE TEXT REPORT
===================================================== */

function buildReport(data: unknown): string {
const walkForward = get(
data,
"historicalWalkForward",
);

const validation = get(
walkForward,
"validation",
);

const diagnostics = get(
walkForward,
"diagnostics",
);

const results = array(
get(validation, "results"),
);

const selected = TARGET_SIGNALS.map(id =>
results.find(result =>
get(result, "id") === id,
),
);

const output: string[] = [
"ROTATION APP",
"HISTORICAL WALK-FORWARD RESEARCH REPORT",
"=".repeat(70),

"",
"TECHNISCHER STATUS",
"",

line(
"API OK:",
get(data, "ok"),
),

line(
"Historischer Beginn:",
get(data, "historicalStart"),
),

line(
"Historisches Ende:",
get(data, "historicalEnd"),
),

line(
"Walk-forward-Tage:",
get(diagnostics, "evaluatedDays"),
),

line(
"Warmup-Tage:",
get(diagnostics, "skippedWarmupDays"),
),

line(
"Erster Testtag:",
get(diagnostics, "firstEvaluationDate"),
),

line(
"Letzter Testtag:",
get(diagnostics, "lastEvaluationDate"),
),

line(
"Walk-forward-Checks:",
get(walkForward, "checks", "all"),
),

line(
"Validierungschecks:",
get(validation, "checks", "all"),
),

"",
"UNTERSUCHTE SIGNALE",
"",

...TARGET_SIGNALS.map(
(id, index) => `${index + 1}. ${id}`,
),
];

selected.forEach((result, index) => {
if (!result) {
output.push(
section("FEHLENDES SIGNAL"),
`Signal nicht gefunden: ${TARGET_SIGNALS[index]}`,
);

return;
}

output.push(
...signalReport(result),
);
});

output.push(
section("METHODISCHE HINWEISE"),

"",
"1. Schwellenwerte werden aus historischen Daten bis T-1 berechnet.",
"2. Ein Episodenstart ist der erste Tag einer zusammenhängenden Signalphase.",
"3. Episoden sind nicht automatisch statistisch unabhängig.",
"4. Forward-Renditen unterschiedlicher Episoden können überlappen.",
"5. Der Benchmark umfasst auswertbare Walk-forward-Tage.",
"6. Zeitabschnitte werden nach dem Episodenstart bestimmt.",
"7. Der Benchmark ist nicht an das jeweilige Marktregime angepasst.",
"8. Historische Ergebnisse sind keine kalibrierten Prognosen.",
"9. Es werden Nasdaq-Renditen untersucht, keine Optionsscheinrenditen.",

"",
"ENDE DES RESEARCH REPORTS",
);

return output.join("\n");
}

/* =====================================================
API GET
===================================================== */

export async function GET(request: NextRequest) {
try {
/*
* Important:
*
* The full historical endpoint is required.
*
* view=summary returns summary.results,
* whereas this report reads:
*
* historicalWalkForward.validation.results
*/

const originalUrl = new URL(
"/api/historical-regime/macro-features-test",
request.nextUrl.origin,
);

// Explicitly request the full response.
originalUrl.searchParams.delete("view");

const internalRequest = new NextRequest(
originalUrl.toString(),
);

const response = await getHistoricalMacroReport(
internalRequest,
);

if (!response.ok) {
const details = await response.text();

return NextResponse.json(
{
ok: false,
error: "Underlying historical endpoint failed",
status: response.status,
details,
},
{
status: response.status,
},
);
}

const data: unknown = await response.json();

const validationResults = get(
data,
"historicalWalkForward",
"validation",
"results",
);

if (!Array.isArray(validationResults)) {
return NextResponse.json(
{
ok: false,
error: "Validation results missing from historical endpoint",
expectedPath:
"historicalWalkForward.validation.results",
actualTopLevelKeys: Object.keys(
object(data),
),
walkForwardKeys: Object.keys(
object(get(data, "historicalWalkForward")),
),
validationKeys: Object.keys(
object(get(
data,
"historicalWalkForward",
"validation",
)),
),
},
{
status: 500,
},
);
}

const report = buildReport(data);

return new Response(report, {
status: 200,
headers: {
"Content-Type": "text/plain; charset=utf-8",
"Cache-Control": "no-store",
},
});

} catch (error) {
console.error(
"Historical research report failed:",
error,
);

return NextResponse.json(
{
ok: false,
error:
error instanceof Error
? error.message
: String(error),
},
{
status: 500,
},
);
}
}

