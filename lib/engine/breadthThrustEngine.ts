// /lib/engine/breadthThrustEngine.ts

import { getMarketStructureFlags } from "./marketStructureFlags";

export interface BreadthThrustInput {
breadth20?: number
breadth50?: number
breadth200?: number

structure?: any

volumeRatio?: number
advanceDecline?: number

rsEqual?: number
rsSmall?: number

participationScore?: number
rotationScore?: number
concentrationScore?: number
divergenceState?: string
}

export interface BreadthThrustOutput {
score: number

thrust:
| "STRONG"
| "MODERATE"
| "WEAK"
| "NEGATIVE"

state:
| "EXPANSION"
| "ROTATION"
| "FRAGILE"
| "BREAKDOWN"

participation: number

sustainability: number

leadershipBreadth: number
passiveDependence: number
institutionalParticipation: number

summary: string

metrics: {
breadth20: number
breadth50: number
breadth200: number
ad: number
volumeRatio: number
rsEqual: number
rsSmall: number
participationScore: number
rotationScore: number
concentrationScore: number

leadershipBreadth: number
passiveDependence: number
institutionalParticipation: number
}
}

function normalizePercent(
value: number
): number {

if (!Number.isFinite(value)) {
return 50
}

return value <= 1
? value * 100
: value
}

function clamp(
value: number,
min = 0,
max = 100
) {
return Math.max(min, Math.min(max, value))
}

export function breadthThrustEngine(
input: BreadthThrustInput
): BreadthThrustOutput {

/* =====================================================
INPUT
===================================================== */

const breadth20 =
normalizePercent(
Number(
input.breadth20 ??
input.structure?.breadth?.b20?.value ??
50
)
)

const breadth50 =
normalizePercent(
Number(
input.breadth50 ??
input.structure?.breadth?.b50?.value ??
50
)
)

const breadth200 =
normalizePercent(
Number(
input.breadth200 ??
input.structure?.breadth?.b200?.value ??
50
)
)

const ad =
Number(
input.advanceDecline ??
input.structure?.advanceDecline?.value ??
0
)

const volumeRatio =
Number(input.volumeRatio ?? 1)

const rsEqual =
normalizePercent(
Number(input.rsEqual ?? 1)
)

const rsSmall =
normalizePercent(
Number(input.rsSmall ?? 1)
)

const participationScore =
Number(
input.participationScore ?? 50
)

const rotationScore =
Number(
input.rotationScore ?? 50
)

const concentrationScore =
Number(
input.concentrationScore ?? 50
)

/* =====================================================
FLAGS
===================================================== */

const narrowLeadership =
rsEqual < 99 &&
rsSmall < 99

/* =====================================================
LEADERSHIP BREADTH
===================================================== */

let leadershipBreadth = 58

leadershipBreadth +=
Math.round((breadth50 - 50) * 0.24)

leadershipBreadth +=
Math.round((breadth200 - 50) * 0.20)

if (rsEqual < 99) {
leadershipBreadth -= 12
}

if (rsSmall < 99) {
leadershipBreadth -= 12
}

if (narrowLeadership) {
leadershipBreadth -= 14
}

leadershipBreadth =
clamp(leadershipBreadth)

/* =====================================================
PASSIVE DEPENDENCE
===================================================== */

let passiveDependence = 20

if (narrowLeadership) {
passiveDependence += 18
}

if (breadth50 < 50) {
passiveDependence += 10
}

if (concentrationScore >= 70) {
passiveDependence += 14
}

if (rsEqual < 97) {
passiveDependence += 10
}

passiveDependence =
clamp(passiveDependence)

/* =====================================================
INSTITUTIONAL PARTICIPATION
===================================================== */

let institutionalParticipation = 55

institutionalParticipation +=
Math.round((breadth20 - 50) * 0.12)

institutionalParticipation +=
Math.round((breadth50 - 50) * 0.22)

institutionalParticipation +=
Math.round((breadth200 - 50) * 0.18)

if (ad > 0) {
institutionalParticipation += 6
}

if (narrowLeadership) {
institutionalParticipation -= 14
}

if (passiveDependence >= 65) {
institutionalParticipation -= 10
}

institutionalParticipation =
clamp(institutionalParticipation)

/* =====================================================
BASE SCORE
===================================================== */

let score = 58

score +=
Math.round((breadth20 - 50) * 0.05)

score +=
Math.round((breadth50 - 50) * 0.10)

score +=
Math.round((breadth200 - 50) * 0.09)

/* =====================================================
A/D
===================================================== */

if (ad > 8) {
score += 8
}

else if (ad > 3) {
score += 4
}

else if (ad < -150) {
score -= 10
}

/* =====================================================
EQUAL WEIGHT
===================================================== */

if (rsEqual > 102) {
score += 8
}

else if (rsEqual > 100) {
score += 4
}

else {
score -= 5
}

/* =====================================================
SMALL CAPS
===================================================== */

if (rsSmall > 102) {
score += 8
}

else if (rsSmall > 100) {
score += 4
}

else {
score -= 5
}

/* =====================================================
PARTICIPATION
===================================================== */

score +=
Math.round(
(participationScore - 50) * 0.12
)

/* =====================================================
ROTATION
===================================================== */

score +=
Math.round(
(rotationScore - 50) * 0.10
)

/* =====================================================
PASSIVE DISTORTION
===================================================== */

if (
narrowLeadership &&
rsEqual < 97
) {
score -= 15
}

if (
passiveDependence >= 70
) {
score -= 10
}

/* =====================================================
CONCENTRATION
===================================================== */

if (concentrationScore >= 75) {
score -= 8
}

/* =====================================================
FINAL SCORE
===================================================== */

score =
clamp(
Math.round(score)
)

/* =====================================================
THRUST
===================================================== */

let thrust:
| "STRONG"
| "MODERATE"
| "WEAK"
| "NEGATIVE"

if (score >= 78) {
thrust = "STRONG"
}

else if (score >= 58) {
thrust = "MODERATE"
}

else if (score >= 25) {
thrust = "WEAK"
}

else {
thrust = "NEGATIVE"
}

/* =====================================================
STATE
===================================================== */

let state:
| "EXPANSION"
| "ROTATION"
| "FRAGILE"
| "BREAKDOWN"

if (
score >= 72 &&
passiveDependence < 40
) {
state = "EXPANSION"
}

else if (
score >= 55
) {
state = "ROTATION"
}

else if (
score >= 30
) {
state = "FRAGILE"
}

else {
state = "BREAKDOWN"
}

/* =====================================================
PARTICIPATION
===================================================== */

let participation =
Math.round(
(
breadth20 * 0.22 +
breadth50 * 0.24 +
breadth200 * 0.18 +
participationScore * 0.36
)
)

if (narrowLeadership) {
participation -= 8
}

participation =
clamp(participation)

/* =====================================================
SUSTAINABILITY
===================================================== */

let sustainability = 55

sustainability +=
Math.round(
(breadth200 - 50) * 0.12
)

sustainability +=
Math.round(
(breadth50 - 50) * 0.10
)

sustainability +=
Math.round(
(rotationScore - 50) * 0.16
)

if (narrowLeadership) {
sustainability -= 10
}

if (passiveDependence >= 65) {
sustainability -= 10
}

sustainability =
clamp(sustainability)

/* =====================================================
SUMMARY
===================================================== */

let summary =
"Neutral breadth participation"

if (state === "EXPANSION") {
summary =
"Broad institutional thrust expansion"
}

if (state === "ROTATION") {
summary =
"Selective rotational breadth"
}

if (state === "FRAGILE") {
summary =
"Breadth momentum deteriorating"
}

if (state === "BREAKDOWN") {
summary =
"Breadth breakdown active"
}

if (narrowLeadership) {
summary +=
" | Narrow leadership"
}

if (passiveDependence >= 65) {
summary +=
" | Passive dependence elevated"
}

/* =====================================================
RETURN
===================================================== */

return {
score,

thrust,

state,

participation,

sustainability,

leadershipBreadth,

passiveDependence,

institutionalParticipation,

summary,

metrics: {
breadth20,
breadth50,
breadth200,
ad,
volumeRatio,
rsEqual,
rsSmall,
participationScore,
rotationScore,
concentrationScore,

leadershipBreadth,
passiveDependence,
institutionalParticipation
}
}
}
