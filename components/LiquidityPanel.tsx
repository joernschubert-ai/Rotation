// /components/panels/LiquidityPanel.tsx

"use client";

interface Props {
data: any;
}

export default function LiquidityPanel({
data
}: Props) {

const liquidity =
data?.liquidity ?? {};

const score =
Number(liquidity?.score ?? 0);

const state =
liquidity?.state ?? "NEUTRAL";

const trend =
liquidity?.trend ?? "FLAT";

const vacuumRisk =
liquidity?.vacuumRisk ?? false;

const fundingStress =
liquidity?.fundingStress ?? false;

const dealerSupport =
liquidity?.dealerSupport ?? false;

const color =
score >= 70
? "text-green-400"
: score >= 50
? "text-yellow-400"
: "text-red-400";

return (
<div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

<div className="flex items-center justify-between mb-4">
<h2 className="text-lg font-semibold">
Liquidity Engine
</h2>

<div className={`font-bold ${color}`}>
{score}
</div>
</div>

<div className="space-y-2 text-sm">

<Row
label="State"
value={state}
/>

<Row
label="Trend"
value={trend}
/>

<Row
label="Dealer Support"
value={
dealerSupport
? "ACTIVE"
: "WEAK"
}
/>

<Row
label="Vacuum Risk"
value={
vacuumRisk
? "YES"
: "NO"
}
/>

<Row
label="Funding Stress"
value={
fundingStress
? "HIGH"
: "NORMAL"
}
/>

</div>

</div>
);
}

function Row({
label,
value
}: any) {
return (
<div className="flex justify-between">
<span className="text-zinc-400">
{label}
</span>

<span className="font-medium">
{value}
</span>
</div>
);
}
