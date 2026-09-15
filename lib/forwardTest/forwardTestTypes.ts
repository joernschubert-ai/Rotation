// /lib/forwardTest/forwardTestTypes.ts

/*
* =====================================================
* FORWARD TEST TYPES
* =====================================================
*
* This module defines the data structures for the
* Forward Test framework.
*
* IMPORTANT:
*
* The Forward Test does NOT change the existing market
* engine.
*
* It only records:
*
* 1. what the engine knew at time T
* 2. what the engine decided at time T
* 3. what actually happened after time T
*
* This allows us to measure whether the engine has
* predictive value rather than only historical
* classification accuracy.
*/


/* =====================================================
* FORWARD HORIZONS
* ===================================================== */

export type ForwardHorizon =
| 1
| 3
| 5
| 10
| 20
| 40;


/* =====================================================
* ENGINE PHASE
* ===================================================== */

export type ForwardTestPhase =
| "PHASE_1_EXPANSION"
| "PHASE_2_WARNING"
| "PHASE_3_DISTRIBUTION"
| "PHASE_4_RISK"
| "PHASE_5_BREAKDOWN"
| "PHASE_6_ACCELERATION"
| "PHASE_7_CAPITULATION";


/* =====================================================
* ENGINE MODE
* ===================================================== */

export type ForwardTestMode =
| "LONG"
| "NEUTRAL"
| "RISK"
| "CRASH";


/* =====================================================
* ENGINE SIGNAL
* ===================================================== */

export type ForwardTestSignal =
| "CALL"
| "NEUTRAL"
| "PUT";


/* =====================================================
* MARKET DIRECTION
* ===================================================== */

export type ForwardTestDirection =
| "UP"
| "DOWN"
| "FLAT";


/* =====================================================
* ENGINE SNAPSHOT
* ===================================================== */

/*
* This is the information produced by the engine at
* time T.
*
* Only information available at time T may be used.
*/

export interface ForwardEngineSnapshot {

timestamp: string;

phase: ForwardTestPhase;

regimeState: string;

subPhase: string;

phaseConfidence: number;

masterScore: number;

masterMode: ForwardTestMode;

masterRegime: string;

netExposure: number;

masterSignal: ForwardTestSignal;

signalStrength: number;

crashScore: number;

crashProbability: number;

rotationScore: number;

rotationConfidence: number;

rotationDecayScore: number;

rotationConfirmConfidence: number;

breadth20: number;

breadth50: number;

breadth200: number;

participationScore: number;

breadthThrustScore: number;

breadthVelocityScore: number;

liquidityScore: number;

marketQualityScore: number;

fragilityScore: number;

regimeSyncScore: number;

dangerScore: number;

priceMomentumScore: number;

putTimingScore: number;

putTimingDecision: string;

putTimingTiming: string;

putTimingExecution: string;

nasdaqPutStrength: number;

nasdaqCallStrength: number;

russellCallStrength: number;

}


/* =====================================================
* MARKET PRICE SNAPSHOT
* ===================================================== */

/*
* These are the actual market prices known at the
* engine decision timestamp.
*/

export interface ForwardMarketSnapshot {

timestamp: string;

ndx: number | null;

spx: number | null;

rut: number | null;

vix: number | null;

}


/* =====================================================
* FORWARD RETURN
* ===================================================== */

export interface ForwardReturn {

horizon: ForwardHorizon;

startPrice: number | null;

endPrice: number | null;

absoluteChange: number | null;

percentageChange: number | null;

direction: ForwardTestDirection;

}


/* =====================================================
* FORWARD EXTREMES
* ===================================================== */

/*
* These metrics are important for trading systems.
*
* Maximum Favorable Excursion:
* How far the market moved in the direction
* predicted by the signal.
*
* Maximum Adverse Excursion:
* How far the market moved against the signal.
*/

export interface ForwardExcursion {

horizon: ForwardHorizon;

maximumFavorableExcursion: number | null;

maximumAdverseExcursion: number | null;

}


/* =====================================================
* FORWARD TEST OBSERVATION
* ===================================================== */

/*
* One observation represents one engine decision
* at one point in time.
*
* Example:
*
* 2024-06-21
* P3
* Master 64
* PUT BUILD
*
* Then we measure what happened after that date.
*/

export interface ForwardTestObservation {

id: string;

timestamp: string;

engine: ForwardEngineSnapshot;

market: ForwardMarketSnapshot;

forwardReturns: ForwardReturn[];

excursions: ForwardExcursion[];

}


/* =====================================================
* FORWARD TEST FILTER
* ===================================================== */

export interface ForwardTestFilter {

phases?: ForwardTestPhase[];

modes?: ForwardTestMode[];

signals?: ForwardTestSignal[];

minimumMasterScore?: number;

maximumMasterScore?: number;

minimumFragilityScore?: number;

minimumRotationConfidence?: number;

minimumRotationDecayScore?: number;

minimumParticipationScore?: number;

maximumParticipationScore?: number;

}


/* =====================================================
* FORWARD TEST SUMMARY
* ===================================================== */

export interface ForwardTestPerformance {

horizon: ForwardHorizon;

observationCount: number;

averageReturn: number | null;

medianReturn: number | null;

positiveReturnRate: number | null;

negativeReturnRate: number | null;

flatReturnRate: number | null;

averageMaximumFavorableExcursion: number | null;

averageMaximumAdverseExcursion: number | null;

}


/* =====================================================
* SIGNAL PERFORMANCE
* ===================================================== */

export interface ForwardSignalPerformance {

signal: ForwardTestSignal;

observationCount: number;

performance: ForwardTestPerformance[];

}


/* =====================================================
* PHASE PERFORMANCE
* ===================================================== */

export interface ForwardPhasePerformance {

phase: ForwardTestPhase;

observationCount: number;

performance: ForwardTestPerformance[];

}


/* =====================================================
* FORWARD TEST RESULT
* ===================================================== */

export interface ForwardTestResult {

generatedAt: string;

startDate: string;

endDate: string;

observations: ForwardTestObservation[];

signalPerformance: ForwardSignalPerformance[];

phasePerformance: ForwardPhasePerformance[];

}


/* =====================================================
* TYPE GUARDS
* ===================================================== */

export function isForwardHorizon(
value: number
): value is ForwardHorizon {

return (
value === 1 ||
value === 3 ||
value === 5 ||
value === 10 ||
value === 20 ||
value === 40
);

}


/* =====================================================
* HORIZON LIST
* ===================================================== */

export const FORWARD_HORIZONS: ForwardHorizon[] = [
1,
3,
5,
10,
20,
40
];
