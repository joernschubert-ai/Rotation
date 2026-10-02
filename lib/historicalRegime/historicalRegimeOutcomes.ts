import type {
HistoricalAlignedDay,
} from "./historicalRegimeAlignment";


/* =====================================================
HISTORICAL REGIME OUTCOMES

Purpose:
- Measure what actually happened AFTER historical day T
- Keep future outcomes strictly separate from features
- Provide T+5 / T+20 / T+60 forward returns
- Measure adverse and favorable excursions
- No scoring
- No regime classification
- No synthetic Rotation-App history
===================================================== */


export type HistoricalForwardOutcome = {

date: string;

nasdaqClose: number;

/* ================= FORWARD RETURNS ================= */

forward5D: number | null;
forward20D: number | null;
forward60D: number | null;


/* ================= PATH INFORMATION ================= */

mfe20D: number | null;
mae20D: number | null;

mfe60D: number | null;
mae60D: number | null;
};


/* =====================================================
HELPERS
===================================================== */

function percentChange(
future: number,
current: number
): number | null {

if (
!Number.isFinite(future) ||
!Number.isFinite(current) ||
current === 0
) {
return null;
}

return (
(future / current) - 1
) * 100;
}


/* =====================================================
FORWARD RETURN

Important:
Uses FUTURE trading observations.

index + 5
means five aligned trading sessions after day T.
===================================================== */

function forwardReturn(
values: number[],
index: number,
horizon: number
): number | null {

const futureIndex =
index + horizon;

if (
index < 0 ||
futureIndex >= values.length
) {
return null;
}

return percentChange(
values[futureIndex],
values[index]
);
}


/* =====================================================
FORWARD EXCURSION

Measures the full path after day T.

MFE:
Maximum Favorable Excursion for a LONG Nasdaq position.

MAE:
Maximum Adverse Excursion for a LONG Nasdaq position.

Example:

T close = 100

During next 20 sessions:
highest close = 108
lowest close = 94

MFE = +8%
MAE = -6%
===================================================== */

function forwardExcursion(
values: number[],
index: number,
horizon: number
): {
mfe: number | null;
mae: number | null;
} {

if (
index < 0 ||
index >= values.length
) {
return {
mfe: null,
mae: null,
};
}


const endIndex =
index + horizon;


if (
endIndex >= values.length
) {
return {
mfe: null,
mae: null,
};
}


const current =
values[index];


if (
!Number.isFinite(current) ||
current === 0
) {
return {
mfe: null,
mae: null,
};
}


let highest =
Number.NEGATIVE_INFINITY;

let lowest =
Number.POSITIVE_INFINITY;


/*
* Start at index + 1.
*
* Day T itself is NOT part of the future path.
*/

for (
let i = index + 1;
i <= endIndex;
i++
) {

const value =
values[i];


if (!Number.isFinite(value)) {
return {
mfe: null,
mae: null,
};
}


if (value > highest) {
highest = value;
}


if (value < lowest) {
lowest = value;
}

}


return {

mfe:
percentChange(
highest,
current
),

mae:
percentChange(
lowest,
current
),

};
}


/* =====================================================
BUILD OUTCOMES
===================================================== */

export function buildHistoricalRegimeOutcomes(
days: HistoricalAlignedDay[]
): HistoricalForwardOutcome[] {

if (!days.length) {
return [];
}


const nasdaq =
days.map(
day => day.nasdaq
);


return days.map(
(day, index) => {

/* =============================================
FORWARD RETURNS
============================================= */

const forward5D =
forwardReturn(
nasdaq,
index,
5
);


const forward20D =
forwardReturn(
nasdaq,
index,
20
);


const forward60D =
forwardReturn(
nasdaq,
index,
60
);


/* =============================================
FORWARD PATH
============================================= */

const excursion20D =
forwardExcursion(
nasdaq,
index,
20
);


const excursion60D =
forwardExcursion(
nasdaq,
index,
60
);


return {

date:
day.date,

nasdaqClose:
day.nasdaq,

forward5D,
forward20D,
forward60D,

mfe20D:
excursion20D.mfe,

mae20D:
excursion20D.mae,

mfe60D:
excursion60D.mfe,

mae60D:
excursion60D.mae,

};

}
);
}
