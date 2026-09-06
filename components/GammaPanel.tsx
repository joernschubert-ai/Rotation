"use client";


interface Props {
data: any;
}


/* =====================================================
HELPERS
===================================================== */

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(
min,
Math.min(max, value)
);
}


function getRiskColor(
value: number
) {

if (value >= 75) {
return "text-red-400";
}

if (value >= 55) {
return "text-orange-400";
}

if (value >= 35) {
return "text-yellow-400";
}

return "text-green-400";

}


function getStateColor(
state: string
) {

switch (state) {

case "NEGATIVE_GAMMA":
return "text-red-400";

case "DEALER_COMPRESSION":
return "text-orange-400";

case "POSITIVE_GAMMA":
return "text-green-400";

default:
return "text-yellow-400";

}

}


function getStateLabel(
state: string
) {

switch (state) {

case "NEGATIVE_GAMMA":
return "NEGATIVE GAMMA";

case "NEUTRAL_GAMMA":
return "NEUTRAL";

case "POSITIVE_GAMMA":
return "POSITIVE GAMMA";

case "DEALER_COMPRESSION":
return "DEALER COMPRESSION";

default:
return "UNKNOWN";

}

}


/* =====================================================
RISK BAR
===================================================== */

function RiskBar({
value,
colorClass,
}: {
value: number;
colorClass: string;
}) {

const safeValue =
clamp(
Number(value ?? 0)
);


return (

<div
className="
h-1.5
w-full
overflow-hidden
rounded-full
bg-zinc-800
"
>

<div
className={`
h-full
rounded-full
${colorClass}
`}
style={{
width: `${safeValue}%`,
}}
/>

</div>

);

}


/* =====================================================
METRIC ROW
===================================================== */

function MetricRow({
label,
value,
risk,
}: {
label: string;
value: number;
risk?: boolean;
}) {

const safeValue =
clamp(
Number(value ?? 0)
);


const color =
risk
? getRiskColor(safeValue)
: "text-zinc-200";


return (

<div
className="
space-y-2
border-b
border-zinc-800/70
py-3
last:border-b-0
"
>

<div
className="
flex
items-center
justify-between
gap-4
"
>

<span
className="
text-sm
text-zinc-400
"
>
{label}
</span>


<span
className={`
shrink-0
text-sm
font-semibold
${color}
`}
>
{safeValue}
</span>

</div>


{risk && (

<RiskBar
value={safeValue}
colorClass={
safeValue >= 75
? "bg-red-500"
: safeValue >= 55
? "bg-orange-500"
: safeValue >= 35
? "bg-yellow-500"
: "bg-green-500"
}
/>

)}

</div>

);

}


/* =====================================================
COMPONENT
===================================================== */

export default function GammaPanel({
data,
}: Props) {


/* ===================================================
DATA
=================================================== */

const gamma =
data?.gamma ?? {};


const score =
clamp(
Number(
gamma?.score ?? 50
)
);


const state =
String(
gamma?.state ??
"NEUTRAL_GAMMA"
);


const effectiveGamma =
Number(
gamma?.effectiveGamma ?? 0
);


const structuralGammaFloor =
Number(
gamma?.structuralGammaFloor ?? 0
);


const dealerCompression =
clamp(
Number(
gamma?.dealerCompression ?? 0
)
);


const passiveFlowRisk =
clamp(
Number(
gamma?.passiveFlowRisk ?? 0
)
);


const volSuppression =
clamp(
Number(
gamma?.volSuppression ?? 0
)
);


const passiveGammaCompression =
clamp(
Number(
gamma?.passiveGammaCompression ?? 0
)
);


const instability =
clamp(
Number(
gamma?.instability ?? 0
)
);


const summary =
gamma?.summary ??
"Gamma structure unavailable";


/* ===================================================
DERIVED
=================================================== */

const highStructuralRisk =
dealerCompression >= 60 ||
passiveFlowRisk >= 60 ||
volSuppression >= 60 ||
passiveGammaCompression >= 60;


const negativeGamma =
effectiveGamma < 0;


/* ===================================================
RENDER
=================================================== */

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


{/* ===============================================
HEADER
=============================================== */}

<div
className="
mb-5
flex
items-start
justify-between
gap-4
"
>

<div>

<h2
className="
text-lg
font-semibold
text-zinc-100
"
>
Gamma Structure
</h2>


<p
className="
mt-1
text-xs
text-zinc-500
"
>
Dealer positioning and structural compression
</p>

</div>


<div
className="
shrink-0
text-right
"
>

<div
className="
text-2xl
font-bold
text-zinc-100
"
>
{score}
</div>


<div
className={`
mt-1
text-xs
font-semibold
${getStateColor(state)}
`}
>
{getStateLabel(state)}
</div>

</div>

</div>


{/* ===============================================
PRIMARY STATUS
=============================================== */}

<div
className="
mb-4
grid
grid-cols-1
gap-3
sm:grid-cols-2
"
>


{/* EFFECTIVE GAMMA */}

<div
className="
rounded-xl
border
border-zinc-800
bg-zinc-950/40
p-3
"
>

<div
className="
text-xs
text-zinc-500
"
>
Effective Gamma
</div>


<div
className={`
mt-1
text-lg
font-semibold
${
negativeGamma
? "text-red-400"
: effectiveGamma >= 35
? "text-green-400"
: "text-zinc-200"
}
`}
>
{effectiveGamma.toFixed(1)}
</div>

</div>


{/* STRUCTURAL FLOOR */}

<div
className="
rounded-xl
border
border-zinc-800
bg-zinc-950/40
p-3
"
>

<div
className="
text-xs
text-zinc-500
"
>
Structural Gamma Floor
</div>


<div
className="
mt-1
text-lg
font-semibold
text-zinc-200
"
>
{structuralGammaFloor}
</div>

</div>

</div>


{/* ===============================================
STRUCTURAL RISKS
=============================================== */}

<div
className="
mb-2
text-xs
font-semibold
tracking-wider
text-zinc-500
"
>
STRUCTURAL COMPRESSION
</div>


<div>

<MetricRow
label="Dealer Compression"
value={dealerCompression}
risk
/>


<MetricRow
label="Passive Flow Risk"
value={passiveFlowRisk}
risk
/>


<MetricRow
label="Volatility Suppression"
value={volSuppression}
risk
/>


<MetricRow
label="Passive Gamma Compression"
value={passiveGammaCompression}
risk
/>

</div>


{/* ===============================================
INSTABILITY
=============================================== */}

<div
className="
mt-5
rounded-xl
border
border-zinc-800
bg-zinc-950/40
p-4
"
>

<div
className="
flex
items-center
justify-between
gap-4
"
>

<span
className="
text-sm
text-zinc-400
"
>
Structural Instability
</span>


<span
className={`
text-lg
font-bold
${getRiskColor(instability)}
`}
>
{instability}
</span>

</div>


<div
className="
mt-3
"
>

<RiskBar
value={instability}
colorClass={
instability >= 75
? "bg-red-500"
: instability >= 55
? "bg-orange-500"
: instability >= 35
? "bg-yellow-500"
: "bg-green-500"
}
/>

</div>

</div>


{/* ===============================================
WARNING
=============================================== */}

{highStructuralRisk && (

<div
className="
mt-4
rounded-xl
border
border-orange-500/30
bg-orange-500/5
p-3
"
>

<div
className="
text-xs
font-semibold
text-orange-400
"
>
STRUCTURAL WARNING
</div>


<div
className="
mt-1
text-xs
leading-relaxed
text-zinc-400
"
>
Market stability may be increasingly dependent
on dealer positioning, passive flows or
suppressed volatility.
</div>

</div>

)}


{/* ===============================================
SUMMARY
=============================================== */}

<div
className="
mt-4
border-t
border-zinc-800
pt-4
"
>

<p
className="
text-xs
leading-relaxed
text-zinc-500
"
>
{summary}
</p>

</div>

</div>

);

}
