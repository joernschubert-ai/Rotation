// /components/panels/IndicesPanel.tsx

"use client";


/* =====================================================
PROPS
===================================================== */

interface Props {
indices?: any;
futures?: any;
}


/* =====================================================
COMPONENT
===================================================== */

export default function IndicesPanel({
indices,
futures,
}: Props) {

const safeIndices =
indices ?? {};

const safeFutures =
futures ?? {};


/* =====================================================
HELPERS
===================================================== */

function isValidNumber(
value: unknown
): value is number {

return (
typeof value === "number" &&
Number.isFinite(value)
);

}


function getChangeColor(
change: unknown
): string {

if (!isValidNumber(change)) {
return "text-zinc-500";
}


if (change > 0.5) {
return "text-green-400";
}


if (change > 0) {
return "text-green-300";
}


if (change === 0) {
return "text-zinc-500";
}


if (change > -0.5) {
return "text-yellow-400";
}


return "text-red-400";

}


function formatValue(
value: unknown
): string {

if (!isValidNumber(value)) {
return "—";
}


return Math.round(
value
).toLocaleString(
"en-US"
);

}


function formatChange(
change: unknown
): string {

if (!isValidNumber(change)) {
return "N/A";
}


return `${
change > 0
? "+"
: ""
}${change.toFixed(2)}%`;

}


/* =====================================================
MARKET ROW
===================================================== */

function MarketRow({
label,
item,
}: {
label: string;
item: any;
}) {

const value =
item?.value;

const change =
item?.change;


return (

<div
className="
flex
items-center
justify-between
gap-4
border-b
border-zinc-800/70
py-3
last:border-b-0
"
>

{/* =============================================
LABEL
============================================== */}

<span
className="
min-w-0
text-sm
text-zinc-400
"
>
{label}
</span>


{/* =============================================
VALUE
============================================== */}

<div
className="
shrink-0
text-right
"
>

<div
className="
text-base
font-semibold
tabular-nums
text-zinc-100
sm:text-lg
"
>
{formatValue(value)}
</div>


{/* ===========================================
CHANGE
=========================================== */}

<div
className={`
mt-0.5
text-sm
font-semibold
tabular-nums
${getChangeColor(change)}
`}
>
{formatChange(change)}
</div>

</div>

</div>

);

}


/* =====================================================
RENDER
===================================================== */

return (

<div
className="
rounded-2xl
border
border-zinc-800
bg-zinc-900
p-4
sm:p-5
"
>


{/* =================================================
HEADER
================================================= */}

<div
className="
mb-5
flex
items-start
justify-between
gap-4
"
>

<div
className="
min-w-0
"
>

<h2
className="
text-lg
font-semibold
text-zinc-100
"
>
Index Markets
</h2>


<p
className="
mt-1
text-xs
leading-relaxed
text-zinc-500
"
>
Cash indices and futures market overview
</p>

</div>

</div>


{/* =================================================
GRID
================================================= */}

<div
className="
grid
grid-cols-1
gap-6
lg:grid-cols-2
"
>


{/* =============================================
CASH INDICES
============================================== */}

<section
className="
min-w-0
"
>

<div
className="
mb-2
text-xs
font-semibold
tracking-wider
text-zinc-500
"
>
CASH INDICES
</div>


<MarketRow
label="Dow Jones"
item={safeIndices.dow}
/>


<MarketRow
label="NASDAQ"
item={safeIndices.ndx}
/>


<MarketRow
label="S&P 500"
item={safeIndices.spx}
/>


<MarketRow
label="Russell 2000"
item={safeIndices.rut}
/>

</section>


{/* =============================================
FUTURES
============================================== */}

<section
className="
min-w-0
"
>

<div
className="
mb-2
text-xs
font-semibold
tracking-wider
text-zinc-500
"
>
FUTURES
</div>


<MarketRow
label="Dow Futures"
item={safeFutures.ym}
/>


<MarketRow
label="NASDAQ Futures"
item={safeFutures.nq}
/>


<MarketRow
label="S&P Futures"
item={safeFutures.es}
/>


<MarketRow
label="Russell Futures"
item={safeFutures.rty}
/>

</section>

</div>

</div>

);

}
