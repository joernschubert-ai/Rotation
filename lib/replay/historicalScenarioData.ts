// /lib/replay/historicalScenarioData.ts

export type HistoricalExpectedRegime =
| "EXPANSION"
| "LATE_EXPANSION"
| "DISTRIBUTION"
| "RISK"
| "BREAKDOWN"
| "CRASH"
| "CAPITULATION"
| "RECOVERY";


export interface HistoricalScenario {

id: string;

date: string;

year: number;

title: string;

description: string;


/*
* What historically happened.
*/

expectedRegime:
HistoricalExpectedRegime;


expectedPhase?:
string;


/*
* Expected directional posture.
*/

expectedMode?:
"LONG"
| "NEUTRAL"
| "RISK"
| "CRASH";


expectedSignal?:
"CALL"
| "NEUTRAL"
| "PUT";


/*
* Market structure.
*/

market: {

vix: number;

vixTermRatio: number;

breadth50: number;

breadth200: number;

participationScore: number;

breadthThrustScore: number;

liquidityScore: number;

fragilityScore: number;

rotationScore: number;

rotationDecayScore: number;

regimeSyncScore: number;

concentrationScore: number;

crashProbability: number;

};


/*
* Relative leadership.
*/

leadership: {

rsGrowth: number;

rsEqual: number;

rsSmall: number;

};


/*
* Historical structural flags.
*/

flags?: {

narrowLeadership?: boolean;

weakParticipation?: boolean;

liquidityStress?: boolean;

structuralFragility?: boolean;

hiddenDistribution?: boolean;

participationCollapse?: boolean;

falseRecovery?: boolean;

passiveFlowRegime?: boolean;

};


/*
* Additional notes.
*/

tags?: string[];

}
