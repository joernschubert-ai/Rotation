/* =====================================================
HISTORICAL REGIME LEADERSHIP ALIGNMENT

Purpose:
- Align historical leadership ETF data with market data
- Require exact trading-date matches
- Preserve existing market alignment
- Keep missing observations visible in diagnostics
- No synthetic values
- No forward filling
- No interpolation
- No scoring
- No trading signals
===================================================== */

import type {
HistoricalAlignedDataset,
HistoricalAlignedDay,
} from "./historicalRegimeAlignment";

import type {
HistoricalLeadershipData,
} from "./historicalRegimeLeadershipProvider";

import type {
HistoricalMarketSeries,
} from "./historicalRegimeProvider";

/* =====================================================
TYPES
===================================================== */

export type HistoricalLeadershipAlignedDay =
HistoricalAlignedDay & {
nasdaqEqualWeight: number;
sp500EqualWeight: number;
semiconductors: number;
};

export type HistoricalLeadershipAlignedDataset = {
days: HistoricalLeadershipAlignedDay[];

count: number;

firstDate: string | null;
lastDate: string | null;

diagnostics: {
marketDays: number;

nasdaqEqualWeightDays: number;
sp500EqualWeightDays: number;
semiconductorDays: number;

joinedDays: number;

missingNasdaqEqualWeightDays: number;
missingSp500EqualWeightDays: number;
missingSemiconductorDays: number;

excludedMarketDays: number;

coverageOfMarketDays: number | null;

firstMarketDate: string | null;
lastMarketDate: string | null;

firstJoinedDate: string | null;
lastJoinedDate: string | null;

chronological: boolean;
uniqueDates: boolean;

sourceFailures: string[];
};
};

/* =====================================================
HELPERS
===================================================== */

function createDateMap(
series: HistoricalMarketSeries,
): Map<string, number> {
const map = new Map<string, number>();

for (const point of series.points) {
if (
!point.date ||
!Number.isFinite(point.close) ||
point.close <= 0
) {
continue;
}

map.set(point.date, point.close);
}

return map;
}

function isChronological(
days: HistoricalLeadershipAlignedDay[],
): boolean {
for (let index = 1; index < days.length; index++) {
if (days[index].date <= days[index - 1].date) {
return false;
}
}

return true;
}

function hasUniqueDates(
days: HistoricalLeadershipAlignedDay[],
): boolean {
const dates = new Set(
days.map((day) => day.date),
);

return dates.size === days.length;
}

/* =====================================================
ALIGN LEADERSHIP DATA
===================================================== */

export function alignHistoricalRegimeLeadershipData(
market: HistoricalAlignedDataset,
leadership: HistoricalLeadershipData,
): HistoricalLeadershipAlignedDataset {
const nasdaqEqualWeightMap = createDateMap(
leadership.nasdaqEqualWeight,
);

const sp500EqualWeightMap = createDateMap(
leadership.sp500EqualWeight,
);

const semiconductorMap = createDateMap(
leadership.semiconductors,
);

const days: HistoricalLeadershipAlignedDay[] = [];

let missingNasdaqEqualWeightDays = 0;
let missingSp500EqualWeightDays = 0;
let missingSemiconductorDays = 0;

/*
* The existing market dataset defines the calendar.
*
* A date is included only if:
* - Nasdaq-100 is available
* - S&P 500 is available
* - Russell 2000 is available
* - VIX is available
* - QQEW is available
* - RSP is available
* - SMH is available
*
* The first four requirements are already enforced
* by HistoricalRegimeAlignment.
*/

for (const marketDay of market.days) {
const date = marketDay.date;

const nasdaqEqualWeight =
nasdaqEqualWeightMap.get(date);

const sp500EqualWeight =
sp500EqualWeightMap.get(date);

const semiconductors =
semiconductorMap.get(date);

if (nasdaqEqualWeight === undefined) {
missingNasdaqEqualWeightDays++;
}

if (sp500EqualWeight === undefined) {
missingSp500EqualWeightDays++;
}

if (semiconductors === undefined) {
missingSemiconductorDays++;
}

if (
nasdaqEqualWeight === undefined ||
sp500EqualWeight === undefined ||
semiconductors === undefined
) {
continue;
}

if (
!Number.isFinite(marketDay.nasdaq) ||
!Number.isFinite(marketDay.sp500) ||
!Number.isFinite(marketDay.russell) ||
!Number.isFinite(marketDay.vix) ||
!Number.isFinite(nasdaqEqualWeight) ||
!Number.isFinite(sp500EqualWeight) ||
!Number.isFinite(semiconductors)
) {
continue;
}

days.push({
date,

nasdaq: marketDay.nasdaq,
sp500: marketDay.sp500,
russell: marketDay.russell,
vix: marketDay.vix,

nasdaqEqualWeight,
sp500EqualWeight,
semiconductors,
});
}

days.sort(
(a, b) => a.date.localeCompare(b.date),
);

const marketDays = market.days.length;

return {
days,

count: days.length,

firstDate: days[0]?.date ?? null,
lastDate: days[days.length - 1]?.date ?? null,

diagnostics: {
marketDays,

nasdaqEqualWeightDays:
leadership.nasdaqEqualWeight.count,

sp500EqualWeightDays:
leadership.sp500EqualWeight.count,

semiconductorDays:
leadership.semiconductors.count,

joinedDays: days.length,

missingNasdaqEqualWeightDays,
missingSp500EqualWeightDays,
missingSemiconductorDays,

excludedMarketDays:
marketDays - days.length,

coverageOfMarketDays:
marketDays > 0
? days.length / marketDays
: null,

firstMarketDate: market.firstDate,
lastMarketDate: market.lastDate,

firstJoinedDate: days[0]?.date ?? null,
lastJoinedDate:
days[days.length - 1]?.date ?? null,

chronological: isChronological(days),
uniqueDates: hasUniqueDates(days),

sourceFailures: [
...leadership.diagnostics.failedSeries,
],
},
};
}

