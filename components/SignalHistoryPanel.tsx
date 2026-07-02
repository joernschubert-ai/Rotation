"use client";

import { useEffect, useMemo, useState } from "react";

type FilterType =
| "ALL"
| "LONG"
| "PUT"
| "REDUCE"
| "SYSTEM";

export default function SignalHistoryPanel() {

const [signals,setSignals]=useState<any[]>([]);

const [filter,setFilter]=
useState<FilterType>("ALL");

/* =====================================================
LOAD
===================================================== */

useEffect(()=>{

load();

},[]);

async function load(){

try{

const res=
await fetch("/api/signal");

const json=
await res.json();

setSignals(json ?? []);

}catch(e){

console.error(e);

}

}

/* =====================================================
FILTER
===================================================== */

const filteredSignals=
useMemo(()=>{

if(filter==="ALL")
return signals;

return signals.filter((s)=>{

const type=
String(s.type ?? "").toUpperCase();

switch(filter){

case "LONG":

return type.includes("LONG");

case "PUT":

return type.includes("PUT");

case "REDUCE":

return (
type.includes("REDUCE") ||
type.includes("TRIM") ||
type.includes("EXIT")
);

case "SYSTEM":

return (
type.includes("SYSTEM") ||
type.includes("FORCE")
);

default:

return true;

}

});

},[signals,filter]);

/* =====================================================
STATS
===================================================== */

const todaySignals=
filteredSignals.length;

const strongSignals=
filteredSignals.filter(
s=>(s.strength ?? 0)>=80
).length;

const weakSignals=
filteredSignals.filter(
s=>(s.strength ?? 0)<40
).length;

const avgStrength=
filteredSignals.length===0
?0
:Math.round(

filteredSignals.reduce(

(a,b)=>

a+(b.strength ??0),

0

)

/

filteredSignals.length

);

const lastSignal=
filteredSignals[0];

/* =====================================================
HELPERS
===================================================== */

function formatTime(ts:number){

if(!ts)
return "--:--";

return new Date(ts)
.toLocaleTimeString([],{

hour:"2-digit",
minute:"2-digit"

});

}

function signalColor(type:string){

const t=
String(type ?? "").toUpperCase();

if(t.includes("PUT"))
return "#ff4d4f";

if(t.includes("LONG"))
return "#52c41a";

if(t.includes("REDUCE"))
return "#faad14";

if(t.includes("EXIT"))
return "#ff7875";

if(t.includes("SYSTEM"))
return "#9254de";

return "#888";

}

function strengthColor(value:number){

if(value>=80)
return "#52c41a";

if(value>=60)
return "#faad14";

if(value>=40)
return "#d4b106";

return "#666";

}

function phaseColor(phase:string){

switch(phase){

case "PHASE_1_EXPANSION":
return "#52c41a";

case "PHASE_2_WARNING":
return "#95de64";

case "PHASE_3_DISTRIBUTION":
return "#faad14";

case "PHASE_4_RISK":
return "#fa8c16";

case "PHASE_5_BREAKDOWN":
return "#ff4d4f";

case "PHASE_6_ACCELERATION":
return "#cf1322";

case "PHASE_7_CAPITULATION":
return "#820014";

default:
return "#666";

}

}

/* =====================================================
RENDER
===================================================== */

return (
<div
style={{
background:"#0d0d0d",
border:"1px solid #222",
padding:"16px"
}}
>

{/* =====================================================
HEADER
===================================================== */}

<div
style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"18px"
}}
>

<div>

<h3
style={{
margin:0,
color:"#bbb"
}}
>

SIGNAL HISTORY

</h3>

<div
style={{
fontSize:"11px",
color:"#666",
marginTop:"3px"
}}
>

Institutional Signal Journal

</div>

</div>

<div
style={{
display:"flex",
gap:"18px",
fontSize:"11px",
color:"#888"
}}
>

<div>

<div>Today</div>

<b style={{color:"#ddd"}}>

{todaySignals}

</b>

</div>

<div>

<div>Strong</div>

<b style={{color:"#52c41a"}}>

{strongSignals}

</b>

</div>

<div>

<div>Weak</div>

<b style={{color:"#faad14"}}>

{weakSignals}

</b>

</div>

<div>

<div>Avg</div>

<b style={{color:"#ddd"}}>

{avgStrength}

</b>

</div>

</div>

</div>

{/* =====================================================
FILTER
===================================================== */}

<div
style={{
display:"flex",
gap:"8px",
marginBottom:"18px",
flexWrap:"wrap"
}}
>

{(["ALL","LONG","PUT","REDUCE","SYSTEM"] as FilterType[]).map(f=>(

<button

key={f}

onClick={()=>setFilter(f)}

style={{

padding:"5px 10px",

background:

filter===f
? "#2b2b2b"
: "#151515",

border:"1px solid #333",

color:

filter===f
? "#fff"
: "#777",

cursor:"pointer",

fontSize:"11px"

}}

>

{f}

</button>

))}

</div>

{/* =====================================================
EMPTY
===================================================== */}

{filteredSignals.length===0 && (

<div

style={{

padding:"35px",

textAlign:"center",

color:"#666",

border:"1px dashed #333"

}}

>

No historical signals available

</div>

)}

{/* =====================================================
LIST
===================================================== */}

<div

style={{

display:"flex",

flexDirection:"column",

gap:"10px"

}}

>

{filteredSignals.map((s,i)=>{

const color=
signalColor(s.type);

const strength=
Math.round(s.strength ?? 0);

return(

<div

key={i}

style={{

background:"#101010",

border:"1px solid #222",

borderLeft:`5px solid ${color}`,

padding:"12px"

}}

>

<div

style={{

display:"flex",

justifyContent:"space-between",

alignItems:"center"

}}

>

<div

style={{

fontWeight:"bold",

color,

fontSize:"13px"

}}

>

{s.type}

</div>

<div

style={{

fontSize:"11px",

color:"#777"

}}

>

{formatTime(s.timestamp)}

</div>

</div>

<div

style={{

marginTop:"6px",

display:"inline-block",

padding:"2px 8px",

border:`1px solid ${phaseColor(s.phase)}`,

color:phaseColor(s.phase),

fontSize:"10px"

}}

>

{s.phase ?? "-"}

</div>

<div

style={{

marginTop:"8px",

fontSize:"12px",

color:"#bbb"

}}

>

{s.message}

</div>

<div

style={{

marginTop:"10px",

display:"flex",

justifyContent:"space-between",

fontSize:"11px",

color:"#777"

}}

>

<div>

Strength

</div>

<div>

{strength}/100

</div>

</div>

<div

style={{

height:"6px",

background:"#222",

marginTop:"4px",

overflow:"hidden"

}}

>

<div

style={{

height:"100%",

width:`${strength}%`,

background:strengthColor(strength),

transition:"0.3s"

}}

>

</div>

</div>

<div

style={{

marginTop:"12px",

display:"grid",

gridTemplateColumns:"1fr 1fr",

rowGap:"5px",

fontSize:"11px"

}}

>

<div style={{color:"#666"}}>

Master

</div>

<div style={{color:"#ddd"}}>

{s.masterScore ?? "--"}

</div>

<div style={{color:"#666"}}>

Danger

</div>

<div style={{color:"#ddd"}}>

{s.dangerScore ?? "--"}

</div>

<div style={{color:"#666"}}>

Trade

</div>

<div style={{color:"#ddd"}}>

{s.tradeStack ?? "--"}

</div>

<div style={{color:"#666"}}>

Heat

</div>

<div style={{color:"#ddd"}}>

{s.systemHeat ?? "--"}

</div>

<div style={{color:"#666"}}>

Reason

</div>

<div style={{color:"#aaa"}}>

{s.reason ?? "-"}

</div>

<div style={{color:"#666"}}>

Summary

</div>

<div style={{color:"#aaa"}}>

{s.summary ?? "-"}

</div>

</div>

</div>

);

})}

</div>
{/* ================= EMPTY ================= */}

{filteredSignals.length === 0 && (

<div
style={{
padding: "30px",
textAlign: "center",
color: "#666",
fontSize: "13px"
}}
>
No historical signals available.
</div>

)}

{/* ================= SIGNAL LIST ================= */}

{filteredSignals.map((s, i) => {

const color =
signalColor(s.type);

return (

<div
key={i}
style={{
borderBottom: "1px solid #181818",
padding: "12px 0"
}}
>

{/* HEADER */}

<div
style={{
display: "flex",
justifyContent: "space-between",
fontSize: "11px",
color: "#666"
}}
>

<div>
{formatTime(s.timestamp)}
</div>

<div
style={{
color: phaseColor(s.phase)
}}
>
{s.phase ?? "-"}
</div>

</div>

{/* TYPE */}

<div
style={{
marginTop: "4px",
fontWeight: "bold",
color,
fontSize: "13px"
}}
>
{s.type}
</div>

{/* MESSAGE */}

<div
style={{
marginTop: "4px",
fontSize: "12px",
color: "#aaa"
}}
>
{s.message}
</div>

{/* STRENGTH */}

<div
style={{
marginTop: "8px",
display: "flex",
justifyContent: "space-between",
fontSize: "11px",
color: "#777"
}}
>

<div>
Strength
</div>

<div
style={{
color: strengthColor(
s.strength ?? 0
)
}}
>
{Math.round(s.strength ?? 0)}
</div>

</div>

<div
style={{
width: "100%",
height: "5px",
background: "#222",
marginTop: "3px"
}}
>

<div
style={{
width: `${Math.min(
100,
Math.max(
0,
s.strength ?? 0
)
)}%`,
height: "100%",
background: color
}}
/>

</div>

</div>

);

})}

</div>

);

}

