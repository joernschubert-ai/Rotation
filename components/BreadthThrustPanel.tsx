// /components/panels/BreadthThrustPanel.tsx

"use client";

interface Props {
data: any;
}

export default function BreadthThrustPanel({
data
}: Props) {

const thrust =
data?.breadthThrust ?? {};

const score =
Number(thrust?.score ?? 0);

const state =
thrust?.state ?? "NEUTRAL";

const thrustActive =
thrust?.thrustActive ?? false;

const confirmation =
thrust?.confirmation ?? false;

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
Breadth Thrust
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
label="Thrust"
value={
thrustActive
? "ACTIVE"
: "NO"
}
/>

<Row
label="Confirmation"
value={
confirmation
? "CONFIRMED"
: "PENDING"
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
