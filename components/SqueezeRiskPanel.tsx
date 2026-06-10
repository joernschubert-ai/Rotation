// /components/panels/SqueezeRiskPanel.tsx

"use client";

interface Props {
data: any;
}

export default function SqueezeRiskPanel({
data
}: Props) {

const squeeze =
data?.squeeze ?? {};

const score =
Number(squeeze?.score ?? 0);

const state =
squeeze?.state ?? "NORMAL";

const gamma =
squeeze?.negativeGamma ?? false;

const volatility =
squeeze?.volatilityExpansion ?? false;

const unstable =
squeeze?.unstablePositioning ?? false;

const color =
score >= 70
? "text-red-400"
: score >= 50
? "text-yellow-400"
: "text-green-400";

return (
<div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

<div className="flex items-center justify-between mb-4">
<h2 className="text-lg font-semibold">
Squeeze Risk
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
label="Negative Gamma"
value={
gamma
? "YES"
: "NO"
}
/>

<Row
label="Volatility"
value={
volatility
? "EXPANDING"
: "STABLE"
}
/>

<Row
label="Positioning"
value={
unstable
? "UNSTABLE"
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
