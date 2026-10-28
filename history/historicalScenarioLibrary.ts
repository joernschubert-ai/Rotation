// /lib/history/historicalScenarioLibrary.ts

import type {
HistoricalScenario
} from "./historicalScenarioAdapter";


import expansion2017
from "./scenarios/2017_broad_expansion.json";

import distribution2018
from "./scenarios/2018_q4_distribution.json";

import covidPreCrash
from "./scenarios/2020_covid_precrash.json";

import covidCrash
from "./scenarios/2020_covid_crash.json";

import covidRecovery
from "./scenarios/2020_post_covid_recovery.json";

import expansion2021
from "./scenarios/2021_broad_expansion.json";

import narrow2021
from "./scenarios/2021_narrow_leadership.json";

import distribution2022
from "./scenarios/2022_distribution.json";

import bear2022
from "./scenarios/2022_bear_market.json";

import banking2023
from "./scenarios/2023_banking_stress.json";

import recovery2023
from "./scenarios/2023_ai_recovery.json";

import narrow2024
from "./scenarios/2024_narrow_leadership.json";


/* =====================================================
SCENARIO LIBRARY
===================================================== */

export const historicalScenarioLibrary:
HistoricalScenario[] = [

expansion2017,

distribution2018,

covidPreCrash,

covidCrash,

covidRecovery,

expansion2021,

narrow2021,

distribution2022,

bear2022,

banking2023,

recovery2023,

narrow2024

] as HistoricalScenario[];


/* =====================================================
GET ALL
===================================================== */

export function getHistoricalScenarios() {

return [
...historicalScenarioLibrary
];

}


/* =====================================================
GET BY ID
===================================================== */

export function getHistoricalScenario(
id: string
) {

return historicalScenarioLibrary.find(
(scenario) =>
scenario.id === id
);

}
