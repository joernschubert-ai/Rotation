import type { HistoryMetrics } from "./historyEngine";

export interface RegimePersistenceResult {

score: number;

regimeAge: number;

institutionalPressure: number;

distributionRisk: number;

recoveryQuality: number;

falseRecoveryRisk: number;

trendStability: number;

marketFatigue: number;

persistentDistribution: boolean;

acceleratingWeakness: boolean;

prolongedBearRegime: boolean;

state:
| "HEALTHY"
| "TRANSITION"
| "DISTRIBUTION"
| "EXHAUSTION";
}


export function regimePersistenceEngine(
history: HistoryMetrics
): RegimePersistenceResult {

const regimeAge =
Math.min(history.daysInPhase * 5,100);

const distributionRisk =
Math.min(

history.distributionDays * 6 +

history.breadthWeakDays * 2 +

history.participationWeakDays * 2,

100

);

const recoveryQuality =
Math.max(

0,

100 -

history.institutionalPressure +

history.rotationPersistence * 0.2 +

history.liquidityPersistence * 0.2

);

const falseRecoveryRisk =
Math.min(

history.institutionalPressure * 0.6 +

history.fragilityPersistence * 0.4,

100

);

const trendStability =

(

history.rotationPersistence +

history.liquidityPersistence +

(100-history.fragilityPersistence)

) /3;

const marketFatigue =
Math.min(

history.daysInPhase * 3 +

history.distributionDays * 2,

100

);

const score =

Math.round(

trendStability*0.30 +

recoveryQuality*0.20 +

regimeAge*0.15 +

(100-distributionRisk)*0.20 +

(100-marketFatigue)*0.15

);

let state:
| "HEALTHY"
| "TRANSITION"
| "DISTRIBUTION"
| "EXHAUSTION";

if(history.prolongedBearRegime){

state="EXHAUSTION";

}else if(history.persistentDistribution){

state="DISTRIBUTION";

}else if(history.institutionalPressure>35){

state="TRANSITION";

}else{

state="HEALTHY";

}

return{

score,

regimeAge,

institutionalPressure:
history.institutionalPressure,

distributionRisk,

recoveryQuality,

falseRecoveryRisk,

trendStability,

marketFatigue,

persistentDistribution:
history.persistentDistribution,

acceleratingWeakness:
history.acceleratingWeakness,

prolongedBearRegime:
history.prolongedBearRegime,

state

};

}
