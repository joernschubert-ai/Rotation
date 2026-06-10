// /components/panels/ParticipationPanel.tsx

"use client";

interface Props {
data: any;
}

export default function ParticipationPanel({
data
}: Props) {

const participation =
data?.participation ?? {};

const score =
Number(participation?.score ?? 0);

const state =
participation?.state ?? "NEUTRAL";

const breadth =
participation?.breadthParticipation ?? false;

const highs =
participation?.highParticipation ?? false;

const equalWeight =
participation?.equalWeightSupport ?? false;

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
Participation Engine
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
label="Breadth"
value={
breadth
? "HEALTHY"
: "WEAK"
}
/>

<Row
label="New Highs"
value={
highs
? "EXPANDING"
: "CONTRACTING"
}
/>

<Row
label="Equal Weight"
value={
equalWeight
? "CONFIRMED"
: "WEAK"
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
