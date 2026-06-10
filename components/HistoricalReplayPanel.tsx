// /components/panels/HistoricalReplayPanel.tsx

"use client";

interface Props {
replay: any;
}

export default function HistoricalReplayPanel({
replay
}: Props) {

if (!replay) return null;

const tests =
replay.tests ?? [];

return (

<div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">

<div className="mb-5">
<h2 className="text-2xl font-bold text-white">
Historical Replay Framework
</h2>

<p className="mt-1 text-sm text-zinc-400">
Institutional robustness validation across major market regimes.
</p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

<div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800">
<div className="text-zinc-400 text-xs mb-1">
False Defensive States
</div>

<div className="text-3xl font-bold text-white">
{replay.falseDefensiveStates}
</div>
</div>

<div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800">
<div className="text-zinc-400 text-xs mb-1">
Missed Crashes
</div>

<div className="text-3xl font-bold text-white">
{replay.missedCrashes}
</div>
</div>

<div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800">
<div className="text-zinc-400 text-xs mb-1">
Late Exits
</div>

<div className="text-3xl font-bold text-white">
{replay.lateExits}
</div>
</div>

<div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800">
<div className="text-zinc-400 text-xs mb-1">
Robustness Score
</div>

<div className="text-3xl font-bold text-emerald-400">
{replay.robustnessScore}
</div>
</div>

</div>

<div className="mt-6 overflow-x-auto">

<table className="w-full text-sm">

<thead>
<tr className="border-b border-zinc-800 text-zinc-400">
<th className="text-left py-3">Year</th>
<th className="text-left py-3">Regime</th>
<th className="text-left py-3">Result</th>
<th className="text-left py-3">Edge</th>
<th className="text-left py-3">Notes</th>
</tr>
</thead>

<tbody>

{tests.map((test: any) => (

<tr
key={test.id}
className="border-b border-zinc-900"
>

<td className="py-3 text-white">
{test.year}
</td>

<td className="py-3 text-zinc-300">
{test.regime}
</td>

<td className="py-3">

<span
className={
test.result === "PASS"
? "text-emerald-400"
: "text-red-400"
}
>
{test.result}
</span>

</td>

<td className="py-3 text-zinc-300">
{test.edgePersistence}%
</td>

<td className="py-3 text-zinc-500">
{test.notes}
</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

);

}
