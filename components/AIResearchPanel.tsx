"use client";

import {
useCallback,
useEffect,
useState,
} from "react";

import type {
ReactNode,
} from "react";

/* =====================================================
TYPES
===================================================== */

interface ResearchRegime {
bias?: string;
confidence?: number;
summary?: string;
}

interface ResearchThesis {
statement?: string;
supportingEvidence?: string[];
counterEvidence?: string[];
invalidationConditions?: string[];
}

interface ResearchDivergence {
type?: string;
observation?: string;
significance?: string;
confidence?: number;
}

interface ResearchRisk {
risk?: string;
explanation?: string;
evidenceType?: string;
}

interface ForwardTestClaim {
claim?: string;
expectedDirection?: string;
horizonDays?: number;
confirmationCondition?: string;
invalidationCondition?: string;
confidence?: number;
}

interface ResearchSource {
title?: string;
publisher?: string;
source?: string;
url?: string;
publishedAt?: string;
relevance?: number;
category?: string;
}

interface ResearchEvidenceBlock {
category?: string;
state?: string;
strength?: string;
confidence?: number;
summary?: string;
evidence?: string[];
}

interface ResearchTension {
state?: string;
ageSnapshots?: number;
ageTradingDays?: number;
confidence?: number;
summary?: string;
}

interface ResearchEvidenceAssessment {
structuralBias?: string;
confirmation?: string;
contradiction?: string;
entryMaturity?: string;
opportunityState?: string;
tension?: ResearchTension;
evidence?: ResearchEvidenceBlock[];
summary?: string;
}

/* =====================================================
HISTORICAL EVIDENCE TYPES
===================================================== */

interface HistoricalCurrentState {
family: string;
market: string;
state: string;
asOfDate: string;
comparable: boolean;
limitations: string[];
}

interface HistoricalObservation {
family: string;
state: string;
market: string;
horizonDays: number;
sampleSize: number;

averageForwardReturn: number | null;
medianForwardReturn: number | null;
positiveRate: number | null;
negativeRate: number | null;

averageMFE: number | null;
averageMAE: number | null;

baselineSampleSize: number | null;
baselineAverageReturn: number | null;
excessReturn: number | null;

overlappingObservations: boolean;
nonOverlappingSelection: boolean;
matchedControl: boolean;
selectionMethod: string;

firstObservationDate: string | null;
lastObservationDate: string | null;

dataQuality: string;
limitations: string[];
}

interface HistoricalDiagnostics {
totalHistoricalDays: number;
totalObservations: number;
totalGroups: number;
matchedCurrentStates: number;
unmatchedCurrentStates: number;
forwardOutcomesUseFuturePrices: boolean;
historicalFeaturesAvoidLookahead: boolean;
predictiveEdgeValidated: boolean;
warnings: string[];
}

interface HistoricalEvidence {
asOfDate: string | null;
firstDate: string | null;
lastDate: string | null;
status: string;
currentStates: HistoricalCurrentState[];
observations: HistoricalObservation[];
diagnostics: HistoricalDiagnostics;
}

interface ResearchReport {
generatedAt?: string;
task?: string;
regime?: ResearchRegime;
evidenceAssessment?: ResearchEvidenceAssessment;
thesis?: ResearchThesis;
divergences?: ResearchDivergence[];
risks?: ResearchRisk[];
forwardTestClaims?: ForwardTestClaim[];
sources?: ResearchSource[];
summary?: string;

historicalEvidence?: HistoricalEvidence;
}

interface ResearchDiagnostics {
snapshotTimestamp?: string;
historyCount?: number;
sourceCount?: number;
warnings?: string[];
}

interface ResearchResponse {
ok?: boolean;
status?: string;
report?: ResearchReport | null;
diagnostics?: ResearchDiagnostics;
error?: string;
}

/* =====================================================
HELPERS
===================================================== */

function text(
value: unknown,
fallback = "—"
): string {
if (
typeof value === "string" &&
value.trim()
) {
return value;
}

if (
typeof value === "number" &&
Number.isFinite(value)
) {
return value.toString();
}

return fallback;
}

function number(
value: unknown
): string {
if (
value === null ||
value === undefined ||
value === ""
) {
return "—";
}

const parsed = Number(value);

return Number.isFinite(parsed)
? Math.round(parsed).toString()
: "—";
}

function numericValue(
value: unknown,
fallback = 0
): number {
if (
value === null ||
value === undefined
) {
return fallback;
}

const parsed = Number(value);

if (!Number.isFinite(parsed)) {
return fallback;
}

return Math.max(
0,
Math.min(100, parsed)
);
}

function formatDate(
value?: string | null
): string {
if (!value) {
return "—";
}

const date = new Date(value);

if (
Number.isNaN(date.getTime())
) {
return value;
}

return date.toLocaleString(
"de-DE",
{
day: "2-digit",
month: "2-digit",
year: "numeric",
hour: "2-digit",
minute: "2-digit",
}
);
}

function formatHistoricalDate(
value?: string | null
): string {
if (!value) {
return "—";
}

const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

if (match) {
return `${match[3]}.${match[2]}.${match[1]}`;
}

return formatDate(value);
}

function formatPercent(
value: number | null | undefined,
digits = 2
): string {
if (
value === null ||
value === undefined ||
!Number.isFinite(value)
) {
return "—";
}

const formatted = value.toLocaleString(
"de-DE",
{
minimumFractionDigits: digits,
maximumFractionDigits: digits,
}
);

return `${value > 0 ? "+" : ""}${formatted}%`;
}

/*
* Historical positiveRate and negativeRate
* are supplied as percentages from 0 to 100.
*
* The historical forward research calculates
* these rates as:
*
* (matching observations / valid observations) * 100
*
* Therefore no additional multiplication by
* 100 is required in the frontend.
*/

function formatRate(
value: number | null | undefined
): string {
if (
value === null ||
value === undefined ||
!Number.isFinite(value) ||
value < 0 ||
value > 100
) {
return "—";
}

return `${value.toLocaleString(
"de-DE",
{
maximumFractionDigits: 1,
}
)}%`;
}

function stateTextClass(
value?: string
): string {
const state =
value?.toUpperCase() ?? "";

if (
state.includes("SUPPORT") ||
state.includes("STRONG") ||
state.includes("BULLISH") ||
state.includes("CONFIRM") ||
state === "AVAILABLE" ||
state === "HIGH"
) {
return "text-emerald-400";
}

if (
state.includes("CONTRADICT") ||
state.includes("BEARISH") ||
state.includes("DEFENSIVE") ||
state.includes("BREAKDOWN") ||
state === "ERROR" ||
state === "INSUFFICIENT"
) {
return "text-red-400";
}

if (
state.includes("MODERATE") ||
state.includes("EARLY") ||
state.includes("ARMED") ||
state.includes("PERSISTENT") ||
state.includes("TIGHTENING") ||
state === "PARTIAL" ||
state === "LOW"
) {
return "text-amber-400";
}

return "text-[#aaa]";
}

function returnTextClass(
value: number | null | undefined
): string {
if (
value === null ||
value === undefined ||
!Number.isFinite(value)
) {
return "text-[#666]";
}

if (value > 0) {
return "text-emerald-400";
}

if (value < 0) {
return "text-red-400";
}

return "text-[#aaa]";
}

function evidenceBarClass(
state?: string
): string {
switch (
state?.toUpperCase()
) {
case "SUPPORTS":
return "bg-emerald-500";

case "CONTRADICTS":
return "bg-red-500";

case "NEUTRAL":
return "bg-amber-500";

case "UNRESOLVED":
return "bg-[#666]";

default:
return "bg-[#333]";
}
}

/* =====================================================
SMALL UI COMPONENTS
===================================================== */

function Label({
children,
}: {
children: ReactNode;
}) {
return (
<div className="text-[9px] uppercase tracking-[0.14em] text-[#555]">
{children}
</div>
);
}

function Value({
children,
}: {
children: ReactNode;
}) {
return (
<div className="mt-1 text-sm font-semibold text-[#ddd]">
{children}
</div>
);
}

function Card({
title,
children,
}: {
title: string;
children: ReactNode;
}) {
return (
<div className="border border-[#222] bg-[#111] p-4">
<h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#777]">
{title}
</h3>

{children}
</div>
);
}

function CockpitMetric({
label,
value,
subValue,
}: {
label: string;
value?: string;
subValue?: string;
}) {
return (
<div className="min-w-0 border-r border-[#242424] px-4 py-3 last:border-r-0">
<div className="text-[8px] uppercase tracking-[0.16em] text-[#555]">
{label}
</div>

<div
className={`mt-1 truncate text-sm font-bold tracking-wide ${stateTextClass(
value
)}`}
>
{text(value)}
</div>

{subValue && (
<div className="mt-1 truncate text-[9px] text-[#555]">
{subValue}
</div>
)}
</div>
);
}

function ConfidenceBar({
value,
state,
}: {
value?: number;
state?: string;
}) {
const width =
numericValue(value);

return (
<div className="h-1.5 overflow-hidden bg-[#222]">
<div
className={`h-full transition-all duration-500 ${evidenceBarClass(
state
)}`}
style={{
width: `${width}%`,
}}
/>
</div>
);
}

function EvidenceTile({
block,
}: {
block: ResearchEvidenceBlock;
}) {
return (
<div className="border border-[#222] bg-[#0d0d0d] p-3">
<div className="flex items-start justify-between gap-3">
<div className="min-w-0">
<div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#777]">
{text(block.category)}
</div>

<div
className={`mt-1 text-xs font-bold ${stateTextClass(
block.state
)}`}
>
{text(block.state)}
</div>
</div>

<div className="text-right">
<div className="text-sm font-bold text-[#ddd]">
{number(block.confidence)}
</div>

<div className="text-[8px] uppercase tracking-[0.12em] text-[#555]">
CONF
</div>
</div>
</div>

<div className="mt-3">
<ConfidenceBar
value={block.confidence}
state={block.state}
/>
</div>

<div className="mt-2 flex items-center justify-between gap-2">
<div className="text-[9px] uppercase tracking-[0.12em] text-[#555]">
Strength
</div>

<div className="text-[9px] font-semibold text-[#888]">
{text(block.strength)}
</div>
</div>
</div>
);
}

/* =====================================================
EVIDENCE LIST
===================================================== */

function EvidenceList({
items,
emptyText = "No evidence",
}: {
items?: string[];
emptyText?: string;
}) {
if (
!items ||
items.length === 0
) {
return (
<div className="text-xs text-[#555]">
{emptyText}
</div>
);
}

return (
<div className="space-y-2">
{items.map(
(item, index) => (
<div
key={`${index}-${item}`}
className="border-l border-[#333] pl-3 text-xs leading-relaxed text-[#aaa]"
>
{item}
</div>
)
)}
</div>
);
}

/* =====================================================
HISTORICAL EVIDENCE COMPONENTS
===================================================== */

function HistoricalMetric({
label,
value,
subValue,
}: {
label: string;
value: string;
subValue?: string;
}) {
return (
<div className="min-w-0 border border-[#252525] bg-[#0d0d0d] p-3">
<div className="text-[9px] uppercase tracking-[0.12em] text-[#666]">
{label}
</div>

<div className="mt-2 text-sm font-bold text-[#ddd]">
{value}
</div>

{subValue && (
<div className="mt-1 text-[10px] leading-relaxed text-[#666]">
{subValue}
</div>
)}
</div>
);
}

function HistoricalQualityFlag({
label,
passed,
}: {
label: string;
passed: boolean;
}) {
return (
<div className="flex items-center justify-between gap-3 border-b border-[#222] py-2 last:border-b-0">
<span className="text-[11px] text-[#888]">
{label}
</span>

<span
className={`text-[10px] font-bold ${
passed
? "text-emerald-400"
: "text-amber-400"
}`}
>
{passed ? "YES" : "NO"}
</span>
</div>
);
}

function HistoricalObservationTable({
observations,
}: {
observations: HistoricalObservation[];
}) {
if (observations.length === 0) {
return (
<div className="text-xs text-[#666]">
No historical forward-return observations
available for this state.
</div>
);
}

const sorted = [
...observations,
].sort(
(a, b) =>
a.horizonDays - b.horizonDays
);

return (
<div className="overflow-x-auto">
<table className="w-full min-w-[650px] text-left">
<thead>
<tr className="border-b border-[#333] text-[9px] uppercase tracking-[0.12em] text-[#666]">
<th className="px-2 py-3 font-medium">
Horizon
</th>

<th className="px-2 py-3 text-right font-medium">
Mean
</th>

<th className="px-2 py-3 text-right font-medium">
Median
</th>

<th className="px-2 py-3 text-right font-medium">
Positive
</th>

<th className="px-2 py-3 text-right font-medium">
Negative
</th>

<th className="px-2 py-3 text-right font-medium">
Sample
</th>

<th className="px-2 py-3 text-right font-medium">
Quality
</th>
</tr>
</thead>

<tbody>
{sorted.map(
(observation, index) => (
<tr
key={`${observation.family}-${observation.state}-${observation.market}-${observation.horizonDays}-${index}`}
className="border-b border-[#202020] last:border-b-0"
>
<td className="px-2 py-3 text-xs font-bold text-[#bbb]">
T+{observation.horizonDays}
</td>

<td
className={`px-2 py-3 text-right text-xs font-semibold ${returnTextClass(
observation.averageForwardReturn
)}`}
>
{formatPercent(
observation.averageForwardReturn
)}
</td>

<td
className={`px-2 py-3 text-right text-xs ${returnTextClass(
observation.medianForwardReturn
)}`}
>
{formatPercent(
observation.medianForwardReturn
)}
</td>

<td className="px-2 py-3 text-right text-xs text-[#aaa]">
{formatRate(
observation.positiveRate
)}
</td>

<td className="px-2 py-3 text-right text-xs text-[#aaa]">
{formatRate(
observation.negativeRate
)}
</td>

<td className="px-2 py-3 text-right text-xs text-[#aaa]">
{number(
observation.sampleSize
)}
</td>

<td
className={`px-2 py-3 text-right text-[10px] font-semibold ${stateTextClass(
observation.dataQuality
)}`}
>
{text(
observation.dataQuality
)}
</td>
</tr>
)
)}
</tbody>
</table>
</div>
);
}

function HistoricalStateCard({
currentState,
observations,
}: {
currentState: HistoricalCurrentState;
observations: HistoricalObservation[];
}) {
const matchingObservations =
observations.filter(
(observation) =>
observation.family === currentState.family &&
observation.market === currentState.market &&
observation.state === currentState.state
);

const limitations = [
...new Set(
[
...currentState.limitations,
...matchingObservations.flatMap(
(observation) =>
observation.limitations
),
].filter(Boolean)
),
];

const hasOverlappingObservations =
matchingObservations.some(
(observation) =>
observation.overlappingObservations
);

const hasMatchedControl =
matchingObservations.length > 0 &&
matchingObservations.every(
(observation) =>
observation.matchedControl
);

const hasNonOverlappingSelection =
matchingObservations.length > 0 &&
matchingObservations.every(
(observation) =>
observation.nonOverlappingSelection
);

return (
<div className="border border-[#292929] bg-[#0d0d0d] p-4">
<div className="flex flex-col gap-3 border-b border-[#222] pb-4 sm:flex-row sm:items-start sm:justify-between">
<div className="min-w-0">
<div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#666]">
{currentState.family}
{" · "}
{currentState.market}
</div>

<div className="mt-2 break-words text-sm font-bold text-[#ddd]">
{currentState.state}
</div>

<div className="mt-1 text-[10px] text-[#666]">
State date:{" "}
{formatHistoricalDate(
currentState.asOfDate
)}
</div>
</div>

<div
className={`shrink-0 text-[10px] font-bold uppercase ${
currentState.comparable
? "text-emerald-400"
: "text-amber-400"
}`}
>
{currentState.comparable
? "Comparable"
: "Not comparable"}
</div>
</div>

{currentState.comparable ? (
<div className="mt-3">
<HistoricalObservationTable
observations={matchingObservations}
/>
</div>
) : (
<div className="mt-3 text-xs leading-relaxed text-amber-400">
This current state is not confirmed as
historically comparable. Forward-return
statistics are not presented as a valid
current-state match.
</div>
)}

{matchingObservations.length > 0 && (
<div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#222] pt-4 sm:grid-cols-3">
<div>
<Label>
Overlapping windows
</Label>

<Value>
{hasOverlappingObservations
? "YES"
: "NO"}
</Value>
</div>

<div>
<Label>
Non-overlapping selection
</Label>

<Value>
{hasNonOverlappingSelection
? "YES"
: "NO"}
</Value>
</div>

<div>
<Label>
Matched control
</Label>

<Value>
{hasMatchedControl
? "YES"
: "NO"}
</Value>
</div>
</div>
)}

{limitations.length > 0 && (
<details className="mt-4 border-t border-[#222] pt-3">
<summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777]">
State limitations ({limitations.length})
</summary>

<div className="mt-3">
<EvidenceList
items={limitations}
/>
</div>
</details>
)}
</div>
);
}

/* =====================================================
HISTORICAL RESEARCH PANEL
===================================================== */

function HistoricalResearchPanel({
evidence,
}: {
evidence?: HistoricalEvidence;
}) {
if (!evidence) {
return (
<Card title="Historical Price / VIX Research">
<div className="text-xs leading-relaxed text-[#777]">
No structured historical evidence was
included in this research report.
</div>

<div className="mt-2 text-[11px] text-[#555]">
The report may have been generated before
historical evidence integration, or the
dashboard API may not yet expose this field.
</div>
</Card>
);
}

const diagnostics =
evidence.diagnostics;

const currentStates =
evidence.currentStates ?? [];

const observations =
evidence.observations ?? [];

const warnings =
diagnostics?.warnings ?? [];

const comparableStates =
currentStates.filter(
(state) => state.comparable
);

const unavailable =
evidence.status === "NOT_AVAILABLE" ||
evidence.status === "ERROR";

const matchedObservationKeys =
new Set(
currentStates
.filter(
(state) => state.comparable
)
.map(
(state) =>
`${state.family}|${state.market}|${state.state}`
)
);

const unmatchedObservations =
observations.filter(
(observation) =>
!matchedObservationKeys.has(
`${observation.family}|${observation.market}|${observation.state}`
)
);

return (
<div className="border border-[#2a2a2a] bg-[#101010]">
{/* HEADER */}

<div className="flex flex-col gap-3 border-b border-[#222] p-4 sm:flex-row sm:items-start sm:justify-between">
<div>
<div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#aaa]">
Historical Price / VIX Research
</div>

<div className="mt-2 max-w-4xl text-xs leading-relaxed text-[#777]">
Historical forward returns of underlying
market indices after comparable market
states. Descriptive research only.
No validated trading edge or
Optionsschein performance.
</div>
</div>

<div className="shrink-0 text-left sm:text-right">
<div
className={`text-xs font-bold ${stateTextClass(
evidence.status
)}`}
>
{text(evidence.status)}
</div>

<div className="mt-1 text-[10px] text-[#666]">
As of{" "}
{formatHistoricalDate(
evidence.asOfDate
)}
</div>
</div>
</div>

{/* METRICS */}

<div className="grid grid-cols-2 gap-2 p-4 lg:grid-cols-4">
<HistoricalMetric
label="Historical coverage"
value={`${formatHistoricalDate(
evidence.firstDate
)} – ${formatHistoricalDate(
evidence.lastDate
)}`}
subValue="Historical sample dates"
/>

<HistoricalMetric
label="Historical days"
value={number(
diagnostics?.totalHistoricalDays
)}
subValue="Market data coverage"
/>

<HistoricalMetric
label="Current comparable states"
value={`${comparableStates.length} / ${currentStates.length}`}
subValue="Compatible current-state matches"
/>

<HistoricalMetric
label="Historical groups"
value={number(
diagnostics?.totalGroups
)}
subValue="Available research groups"
/>
</div>

{/* UNAVAILABLE */}

{unavailable && (
<div className="mx-4 mb-4 border border-[#47351e] bg-[#1a140c] p-3 text-xs leading-relaxed text-amber-400">
Historical evidence is currently unavailable.
The current AI Research assessment remains
independent of this historical comparison.
</div>
)}

{/* CURRENT STATES */}

<div className="border-t border-[#222] p-4">
<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
<div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#777]">
Current State Comparisons
</div>

<div className="text-[10px] text-[#555]">
{currentStates.length} states
</div>
</div>

{currentStates.length === 0 ? (
<div className="text-xs text-[#666]">
No current historical comparison states
available.
</div>
) : (
<div className="space-y-3">
{currentStates.map(
(state, index) => (
<HistoricalStateCard
key={`${state.family}-${state.market}-${state.state}-${index}`}
currentState={state}
observations={observations}
/>
)
)}
</div>
)}
</div>

{/* UNMATCHED HISTORICAL GROUPS */}

{unmatchedObservations.length > 0 && (
<details className="border-t border-[#222] p-4">
<summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-[#777]">
Other Historical Groups (
{unmatchedObservations.length})
</summary>

<div className="mt-3 text-xs leading-relaxed text-[#666]">
These observations are present in the
historical dataset but are not confirmed
matches for a comparable current state.
</div>

<div className="mt-3 space-y-3">
{unmatchedObservations.map(
(observation, index) => (
<div
key={`${observation.family}-${observation.state}-${observation.horizonDays}-${index}`}
className="border border-[#222] bg-[#0d0d0d] p-3"
>
<div className="text-[10px] font-semibold text-[#bbb]">
{observation.family}
{" · "}
{observation.market}
{" · "}
{observation.state}
</div>

<div className="mt-2 text-[11px] text-[#888]">
T+{observation.horizonDays}
{" · "}
Mean{" "}
{formatPercent(
observation.averageForwardReturn
)}
{" · "}
N={number(
observation.sampleSize
)}
</div>
</div>
)
)}
</div>
</details>
)}

{/* DATA QUALITY */}

<div className="grid grid-cols-1 gap-4 border-t border-[#222] p-4 xl:grid-cols-2">
<div>
<div className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#777]">
Research Data Quality
</div>

<HistoricalQualityFlag
label="Forward outcomes use future prices"
passed={
diagnostics?.forwardOutcomesUseFuturePrices === true
}
/>

<HistoricalQualityFlag
label="Historical features avoid lookahead"
passed={
diagnostics?.historicalFeaturesAvoidLookahead === true
}
/>

<HistoricalQualityFlag
label="Predictive edge validated"
passed={
diagnostics?.predictiveEdgeValidated === true
}
/>
</div>

<div>
<div className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#777]">
Coverage Diagnostics
</div>

<div className="space-y-3">
<div className="flex justify-between gap-4 text-xs">
<span className="text-[#777]">
Historical observations
</span>

<span className="text-[#ccc]">
{number(
diagnostics?.totalObservations
)}
</span>
</div>

<div className="flex justify-between gap-4 text-xs">
<span className="text-[#777]">
Matched current states
</span>

<span className="text-[#ccc]">
{number(
diagnostics?.matchedCurrentStates
)}
</span>
</div>

<div className="flex justify-between gap-4 text-xs">
<span className="text-[#777]">
Unmatched current states
</span>

<span className="text-[#ccc]">
{number(
diagnostics?.unmatchedCurrentStates
)}
</span>
</div>
</div>
</div>
</div>

{/* WARNINGS */}

{warnings.length > 0 && (
<details className="border-t border-[#222] p-4">
<summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-amber-400">
Historical Diagnostics ({warnings.length})
</summary>

<div className="mt-3">
<EvidenceList
items={warnings}
/>
</div>
</details>
)}

{/* DISCLAIMER */}

<div className="border-t border-[#222] bg-[#0c0c0c] p-4 text-[10px] leading-relaxed text-[#666]">
Historical outcomes may contain overlapping
forward windows and correlated market states.
Positive or negative historical Nasdaq returns
do not establish a predictive advantage.
Index returns are not Optionsschein returns.
Historical research does not modify structural
bias, confirmation, execution or position sizing.
</div>
</div>
);
}

/* =====================================================
MAIN PANEL
===================================================== */

export default function AIResearchPanel() {
const [
data,
setData,
] = useState<ResearchResponse | null>(
null
);

const [
loading,
setLoading,
] = useState(true);

const [
error,
setError,
] = useState<string | null>(
null
);

/* =================================================
* LOAD RESEARCH
* ================================================= */

const loadResearch =
useCallback(
async () => {
try {
setLoading(true);
setError(null);

const response = await fetch(
"/api/ai-research/dashboard?task=DAILY_MARKET_REVIEW",
{
method: "GET",
cache: "no-store",
}
);

const json =
await response.json();

if (!response.ok) {
throw new Error(
json?.error ??
`AI Research API returned ${response.status}`
);
}

setData(json);
} catch (err) {
console.error(
"AI RESEARCH LOAD ERROR:",
err
);

setError(
err instanceof Error
? err.message
: "AI Research could not be loaded."
);
} finally {
setLoading(false);
}
},
[]
);

useEffect(
() => {
loadResearch();
},
[loadResearch]
);

/* =================================================
* LOADING
* ================================================= */

if (
loading &&
!data
) {
return (
<div className="border border-[#222] bg-[#111] p-4">
<div className="text-xs uppercase tracking-[0.12em] text-[#666]">
Loading AI Research...
</div>
</div>
);
}

/* =================================================
* ERROR
* ================================================= */

if (
error &&
!data
) {
return (
<div className="border border-[#3a2020] bg-[#140d0d] p-4">
<div className="text-xs font-bold uppercase tracking-[0.12em] text-[#aa6666]">
AI Research unavailable
</div>

<div className="mt-2 text-xs text-[#777]">
{error}
</div>

<button
onClick={loadResearch}
className="mt-4 border border-[#444] bg-[#222] px-3 py-2 text-xs transition hover:bg-[#333]"
>
Retry
</button>
</div>
);
}

/* =================================================
* REPORT
* ================================================= */

const report =
data?.report;

if (!report) {
return (
<div className="border border-[#222] bg-[#111] p-4">
<div className="text-xs text-[#666]">
No AI Research report available.
</div>

{data?.status && (
<div className="mt-2 text-xs text-[#888]">
Status: {data.status}
</div>
)}

{error && (
<div className="mt-2 text-xs text-red-400">
{error}
</div>
)}

<button
onClick={loadResearch}
disabled={loading}
className="mt-4 border border-[#444] bg-[#222] px-3 py-2 text-xs transition hover:bg-[#333] disabled:opacity-50"
>
Retry
</button>
</div>
);
}

const regime =
report.regime ?? {};

const assessment =
report.evidenceAssessment ?? {};

const tension =
assessment.tension ?? {};

const evidence =
assessment.evidence ?? [];

const thesis =
report.thesis ?? {};

const divergences =
report.divergences ?? [];

const risks =
report.risks ?? [];

const claims =
report.forwardTestClaims ?? [];

const sources =
report.sources ?? [];

/* =================================================
* RENDER
* ================================================= */

return (
<div className="space-y-4">

{/* =================================================
* COMMAND CENTER
* ================================================= */}

<div className="overflow-hidden border border-[#2a2a2a] bg-[#101010]">
<div className="flex flex-col gap-5 border-b border-[#222] p-5 xl:flex-row xl:items-start xl:justify-between">
<div className="min-w-0">
<div className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#555]">
AI Research Command Center
</div>

<div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
<div
className={`text-2xl font-black tracking-wide ${stateTextClass(
regime.bias
)}`}
>
{text(regime.bias)}
</div>

<div className="pb-0.5 text-xs text-[#666]">
Confidence{" "}
<span className="font-semibold text-[#bbb]">
{number(
regime.confidence
)}%
</span>
</div>
</div>

<div className="mt-3 max-w-5xl text-xs leading-relaxed text-[#888]">
{text(
assessment.summary,
text(report.summary)
)}
</div>
</div>

<div className="shrink-0 text-left xl:text-right">
<div className="text-[9px] uppercase tracking-[0.14em] text-[#555]">
Last Research
</div>

<div className="mt-1 text-xs font-semibold text-[#999]">
{formatDate(
report.generatedAt
)}
</div>

{loading && (
<div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-amber-400">
Refreshing
</div>
)}
</div>
</div>

{/* TOP OVERVIEW STRIP */}

<div className="grid grid-cols-2 border-b border-[#222] md:grid-cols-3 xl:grid-cols-6">
<CockpitMetric
label="Structure"
value={
assessment.structuralBias
}
/>

<CockpitMetric
label="Confirmation"
value={
assessment.confirmation
}
/>

<CockpitMetric
label="Contradiction"
value={
assessment.contradiction
}
/>

<CockpitMetric
label="Entry"
value={
assessment.entryMaturity
}
/>

<CockpitMetric
label="Opportunity"
value={
assessment.opportunityState
}
/>

<CockpitMetric
label="Tension"
value={
tension.state
}
subValue={
tension.ageTradingDays !== undefined
? `${number(
tension.ageTradingDays
)} trading days`
: undefined
}
/>
</div>

{/* EVIDENCE MATRIX */}

<div className="p-4">
<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
<div className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#555]">
Evidence Matrix
</div>

<div className="text-[9px] uppercase tracking-[0.12em] text-[#555]">
{evidence.length} evidence layers
</div>
</div>

{evidence.length === 0 ? (
<div className="text-xs text-[#555]">
No evidence assessment available.
</div>
) : (
<div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
{evidence.map(
(block, index) => (
<EvidenceTile
key={`${block.category}-${index}`}
block={block}
/>
)
)}
</div>
)}
</div>

{/* TENSION STRIP */}

{tension.state && (
<div className="border-t border-[#222] bg-[#0c0c0c] px-4 py-3">
<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
<div className="min-w-0">
<div className="text-[9px] uppercase tracking-[0.14em] text-[#555]">
Price vs Structure Tension
</div>

<div className="mt-1 text-xs leading-relaxed text-[#888]">
{text(
tension.summary
)}
</div>
</div>

<div className="flex shrink-0 gap-6">
<div>
<Label>
Age
</Label>

<Value>
{number(
tension.ageTradingDays
)}D
</Value>
</div>

<div>
<Label>
Confidence
</Label>

<Value>
{number(
tension.confidence
)}%
</Value>
</div>
</div>
</div>
</div>
)}
</div>

{/* =================================================
* HISTORICAL RESEARCH
* ================================================= */}

<HistoricalResearchPanel
evidence={
report.historicalEvidence
}
/>

{/* =================================================
* RESEARCH THESIS
* ================================================= */}

<Card title="Research Thesis">
<div className="border-l-2 border-[#444] pl-4 text-sm font-medium leading-relaxed text-[#ddd]">
{text(
thesis.statement
)}
</div>

<div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
<div>
<div className="mb-3 flex items-center justify-between">
<Label>
Supporting Evidence
</Label>

<div className="text-[9px] text-emerald-500">
{thesis.supportingEvidence?.length ?? 0}
</div>
</div>

<EvidenceList
items={
thesis.supportingEvidence
}
/>
</div>

<div>
<div className="mb-3 flex items-center justify-between">
<Label>
Counter Evidence
</Label>

<div className="text-[9px] text-red-400">
{thesis.counterEvidence?.length ?? 0}
</div>
</div>

<EvidenceList
items={
thesis.counterEvidence
}
emptyText="No counter evidence"
/>
</div>

<div>
<div className="mb-3 flex items-center justify-between">
<Label>
Invalidation
</Label>

<div className="text-[9px] text-amber-400">
{thesis.invalidationConditions?.length ?? 0}
</div>
</div>

<EvidenceList
items={
thesis.invalidationConditions
}
emptyText="No invalidation conditions"
/>
</div>
</div>
</Card>

{/* =================================================
* DIVERGENCES + RISKS
* ================================================= */}

<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
<Card
title={`Divergences (${divergences.length})`}
>
{divergences.length === 0 ? (
<div className="text-xs text-[#555]">
No structural divergences detected.
</div>
) : (
<div className="space-y-4">
{divergences.map(
(divergence, index) => (
<div
key={`${divergence.type}-${index}`}
className="border-b border-[#222] pb-4 last:border-b-0 last:pb-0"
>
<div className="flex items-center justify-between gap-4">
<div className="text-xs font-bold text-[#ccc]">
{text(
divergence.type
)}
</div>

<div className="min-w-[70px] text-right">
<div className="text-[10px] font-semibold text-[#888]">
{number(
divergence.confidence
)}%
</div>

<div className="mt-1">
<ConfidenceBar
value={
divergence.confidence
}
state="NEUTRAL"
/>
</div>
</div>
</div>

<div className="mt-2 text-xs leading-relaxed text-[#aaa]">
{text(
divergence.observation
)}
</div>

<div className="mt-2 text-[11px] leading-relaxed text-[#666]">
{text(
divergence.significance
)}
</div>
</div>
)
)}
</div>
)}
</Card>

<Card
title={`Research Risks (${risks.length})`}
>
{risks.length === 0 ? (
<div className="text-xs text-[#555]">
No predefined research risks detected.
</div>
) : (
<div className="space-y-4">
{risks.map(
(risk, index) => (
<div
key={`${risk.risk}-${index}`}
className="border-b border-[#222] pb-4 last:border-b-0 last:pb-0"
>
<div className="flex items-center justify-between gap-4">
<div className="text-xs font-bold text-[#ccc]">
{text(
risk.risk
)}
</div>

<div className="text-[9px] uppercase tracking-[0.12em] text-[#555]">
{text(
risk.evidenceType
)}
</div>
</div>

<div className="mt-2 text-xs leading-relaxed text-[#888]">
{text(
risk.explanation
)}
</div>
</div>
)
)}
</div>
)}
</Card>
</div>

{/* =================================================
* FORWARD TEST CLAIMS
* ================================================= */}

<Card
title={`Forward-Testable Claims (${claims.length})`}
>
{claims.length === 0 ? (
<div className="text-xs text-[#555]">
No active forward-testable research claim.
</div>
) : (
<div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
{claims.map(
(claim, index) => (
<div
key={`${claim.claim}-${index}`}
className="border border-[#222] bg-[#0d0d0d] p-4"
>
<div className="flex flex-wrap items-center gap-3">
<div
className={`text-sm font-bold ${stateTextClass(
claim.expectedDirection
)}`}
>
{text(
claim.expectedDirection
)}
</div>

<div className="text-[10px] uppercase tracking-[0.12em] text-[#666]">
{claim.horizonDays !== undefined
? `${number(
claim.horizonDays
)} DAYS`
: "—"}
</div>

<div className="text-[10px] uppercase tracking-[0.12em] text-[#666]">
CONF{" "}
{number(
claim.confidence
)}%
</div>
</div>

<div className="mt-3 text-xs leading-relaxed text-[#aaa]">
{text(
claim.claim
)}
</div>

<div className="mt-4">
<Label>
Confirmation
</Label>

<div className="mt-1 text-[11px] leading-relaxed text-[#777]">
{text(
claim.confirmationCondition
)}
</div>
</div>

<div className="mt-3">
<Label>
Invalidation
</Label>

<div className="mt-1 text-[11px] leading-relaxed text-[#777]">
{text(
claim.invalidationCondition
)}
</div>
</div>
</div>
)
)}
</div>
)}
</Card>

{/* =================================================
* EXTERNAL RESEARCH
* ================================================= */}

<Card
title={`External Research (${sources.length})`}
>
{sources.length === 0 ? (
<div className="text-xs text-[#555]">
No external research sources available.
</div>
) : (
<div className="space-y-3">
{sources
.slice(0, 10)
.map(
(source, index) => (
<div
key={`${source.url}-${index}`}
className="border-b border-[#222] pb-3 last:border-b-0 last:pb-0"
>
<div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
<div className="min-w-0">
{source.url ? (
<a
href={source.url}
target="_blank"
rel="noopener noreferrer"
className="text-xs font-semibold leading-relaxed text-[#bbb] transition hover:text-white"
>
{text(
source.title
)}
</a>
) : (
<div className="text-xs font-semibold leading-relaxed text-[#bbb]">
{text(
source.title
)}
</div>
)}

<div className="mt-1 text-[10px] text-[#555]">
{text(
source.publisher,
text(
source.source
)
)}

{" · "}

{formatDate(
source.publishedAt
)}
</div>
</div>

{source.relevance !== undefined && (
<div className="w-20 shrink-0">
<div className="mb-1 text-right text-[9px] uppercase tracking-[0.12em] text-[#666]">
REL{" "}
{number(
source.relevance
)}
</div>

<ConfidenceBar
value={
source.relevance
}
state="UNRESOLVED"
/>
</div>
)}
</div>
</div>
)
)}
</div>
)}
</Card>

{/* =================================================
* DIAGNOSTICS
* ================================================= */}

{(
data?.diagnostics?.warnings?.length ??
0
) > 0 && (
<Card title="Research Diagnostics">
<EvidenceList
items={
data?.diagnostics?.warnings
}
/>
</Card>
)}

{/* REFRESH ERROR */}

{error && data && (
<div className="border border-[#3a2020] bg-[#140d0d] p-3 text-xs text-red-400">
Research refresh failed: {error}
</div>
)}

{/* =================================================
* FOOTER / REFRESH
* ================================================= */}

<div className="flex flex-col gap-3 border-t border-[#222] pt-3 sm:flex-row sm:items-center sm:justify-between">
<div className="text-[9px] uppercase tracking-[0.12em] text-[#444]">
Snapshot{" "}
{formatDate(
data?.diagnostics?.snapshotTimestamp
)}

{" · "}

History{" "}
{number(
data?.diagnostics?.historyCount
)}

{" · "}

Sources{" "}
{number(
data?.diagnostics?.sourceCount
)}
</div>

<button
onClick={loadResearch}
disabled={loading}
className="border border-[#333] bg-[#181818] px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-[#777] transition hover:bg-[#222] hover:text-[#aaa] disabled:opacity-50"
>
{loading
? "Refreshing..."
: "Refresh Research"}
</button>
</div>
</div>
);
}