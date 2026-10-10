import type {
HistoricalLeadershipAlignedDay,
} from "./historicalRegimeLeadershipAlignment";

/* =====================================================
HISTORICAL REGIME LEADERSHIP FEATURES

Purpose:
- Calculate observable historical relative returns
- Compare cap-weighted indices with ETF proxies
- Preserve exact aligned trading dates
- Use only observations available at date T
- No scoring
- No synthetic market phases
- No trading signals
- No forward-looking calculations

Important:
ETF series currently use Yahoo quote.close.
Results are price-return comparisons, not
verified dividend-adjusted total returns.
===================================================== */

export type HistoricalLeadershipFeatureDay = {
date: string;

nasdaqReturn20D: number | null;
nasdaqReturn60D: number | null;

qqewReturn20D: number | null;
qqewReturn60D: number | null;

sp500Return20D: number | null;
sp500Return60D: number | null;

rspReturn20D: number | null;
rspReturn60D: number | null;

russellReturn20D: number | null;
russellReturn60D: number | null;

semiconductorReturn20D: number | null;
semiconductorReturn60D: number | null;

nasdaqVsEqualWeight20D: number | null;
nasdaqVsEqualWeight60D: number | null;

sp500VsEqualWeight20D: number | null;
sp500VsEqualWeight60D: number | null;

semiconductorsVsNasdaq20D: number | null;
semiconductorsVsNasdaq60D: number | null;

russellVsNasdaq20D: number | null;
russellVsNasdaq60D: number | null;
};

/* =====================================================
HELPERS
===================================================== */

function percentReturn(
current: number,
previous: number,
): number | null {
if (
!Number.isFinite(current) ||
!Number.isFinite(previous) ||
current <= 0 ||
previous <= 0
) {
return null;
}

return (current / previous - 1) * 100;
}

function returnAt(
values: number[],
index: number,
lookback: number,
): number | null {
if (
index < lookback ||
index >= values.length
) {
return null;
}

return percentReturn(
values[index],
values[index - lookback],
);
}

function relativeReturn(
first: number | null,
second: number | null,
): number | null {
if (
first === null ||
second === null
) {
return null;
}

return first - second;
}

/* =====================================================
BUILD LEADERSHIP FEATURES
===================================================== */

export function buildHistoricalRegimeLeadershipFeatures(
days: HistoricalLeadershipAlignedDay[],
): HistoricalLeadershipFeatureDay[] {
if (days.length === 0) {
return [];
}

const nasdaq = days.map(
(day) => day.nasdaq,
);

const qqew = days.map(
(day) => day.nasdaqEqualWeight,
);

const sp500 = days.map(
(day) => day.sp500,
);

const rsp = days.map(
(day) => day.sp500EqualWeight,
);

const russell = days.map(
(day) => day.russell,
);

const semiconductors = days.map(
(day) => day.semiconductors,
);

return days.map((day, index) => {
const nasdaqReturn20D = returnAt(
nasdaq, index, 20,
);

const nasdaqReturn60D = returnAt(
nasdaq, index, 60,
);

const qqewReturn20D = returnAt(
qqew, index, 20,
);

const qqewReturn60D = returnAt(
qqew, index, 60,
);

const sp500Return20D = returnAt(
sp500, index, 20,
);

const sp500Return60D = returnAt(
sp500, index, 60,
);

const rspReturn20D = returnAt(
rsp, index, 20,
);

const rspReturn60D = returnAt(
rsp, index, 60,
);

const russellReturn20D = returnAt(
russell, index, 20,
);

const russellReturn60D = returnAt(
russell, index, 60,
);

const semiconductorReturn20D = returnAt(
semiconductors, index, 20,
);

const semiconductorReturn60D = returnAt(
semiconductors, index, 60,
);

return {
date: day.date,

nasdaqReturn20D,
nasdaqReturn60D,

qqewReturn20D,
qqewReturn60D,

sp500Return20D,
sp500Return60D,

rspReturn20D,
rspReturn60D,

russellReturn20D,
russellReturn60D,

semiconductorReturn20D,
semiconductorReturn60D,

nasdaqVsEqualWeight20D: relativeReturn(
nasdaqReturn20D,
qqewReturn20D,
),

nasdaqVsEqualWeight60D: relativeReturn(
nasdaqReturn60D,
qqewReturn60D,
),

sp500VsEqualWeight20D: relativeReturn(
sp500Return20D,
rspReturn20D,
),

sp500VsEqualWeight60D: relativeReturn(
sp500Return60D,
rspReturn60D,
),

semiconductorsVsNasdaq20D: relativeReturn(
semiconductorReturn20D,
nasdaqReturn20D,
),

semiconductorsVsNasdaq60D: relativeReturn(
semiconductorReturn60D,
nasdaqReturn60D,
),

russellVsNasdaq20D: relativeReturn(
russellReturn20D,
nasdaqReturn20D,
),

russellVsNasdaq60D: relativeReturn(
russellReturn60D,
nasdaqReturn60D,
),
};
});
}

