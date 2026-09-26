import type {
AIResearchSource,
AIResearchTask,
} from "./aiResearchTypes";

import {
buildResearchSources,
type ExternalResearchSourceInput,
} from "./aiResearchSources";


/*
* =====================================================
* AI RESEARCH SOURCE PROVIDER
* =====================================================
*
* Aufgabe:
*
* Diese Schicht trennt die eigentliche Beschaffung
* externer Quellen von der späteren AI-Auswertung.
*
* Aktuell:
*
* - keine KI
* - keine Bewertung
* - keine Tradingentscheidung
* - keine automatische Interpretation
* - keine Änderung bestehender Engines
*
* Der Provider nimmt bereits beschaffte externe Quellen
* entgegen und normalisiert sie über aiResearchSources.ts.
*
* Später können hier echte externe Datenquellen
* angeschlossen werden:
*
* News API
* Fed
* ECB
* Nasdaq
* Russell
* VIX
* RSS
* Börsenberichte
*
* =====================================================
*/


/* =====================================================
* PROVIDER RESULT
* ===================================================== */

export interface AIResearchSourceProviderResult {
sources: AIResearchSource[];

diagnostics: {
inputCount: number;
normalizedCount: number;
sourceCount: number;
warnings: string[];
};
}


/* =====================================================
* PROVIDER INPUT
* ===================================================== */

export interface AIResearchSourceProviderInput {
task: AIResearchTask;

sources?: ExternalResearchSourceInput[];
}


/* =====================================================
* PROVIDER
* ===================================================== */

/**
* Normalisiert und strukturiert externe Research-Quellen.
*
* Diese Funktion ist absichtlich deterministisch.
*
* Sie entscheidet NICHT:
*
* - ob eine Nachricht bullish ist
* - ob eine Nachricht bearish ist
* - ob ein Crash bevorsteht
* - ob ein Trade sinnvoll ist
*
* Sie stellt lediglich saubere Quellen für die spätere
* Research-Schicht bereit.
*/
export function collectResearchSources(
input: AIResearchSourceProviderInput
): AIResearchSourceProviderResult {

const warnings: string[] = [];

const inputSources =
Array.isArray(input.sources)
? input.sources
: [];


/*
* Quellen normalisieren.
*/

const sources =
buildResearchSources({
task: input.task,
sources: inputSources,
});


/*
* Diagnoseinformationen.
*/

const inputCount =
inputSources.length;

const sourceCount =
sources.length;


/*
* Wenn Quellen übergeben wurden, aber keine
* verwertbare Quelle übrig bleibt, soll das später
* eindeutig sichtbar sein.
*/

if (
inputCount > 0 &&
sourceCount === 0
) {

warnings.push(
"No valid external research sources remained after normalization."
);

}


/*
* Aktuell existiert noch kein echter externer
* Fetch-Mechanismus.
*
* Deshalb weisen wir bewusst darauf hin, wenn
* überhaupt keine Quellen vorhanden sind.
*/

if (
inputCount === 0
) {

warnings.push(
"No external research sources supplied."
);

}


return {

sources,

diagnostics: {

inputCount,

normalizedCount:
sourceCount,

sourceCount,

warnings,

},

};

}


/* =====================================================
* EMPTY PROVIDER
* ===================================================== */

/**
* Liefert einen sauberen leeren Research-Quellenblock.
*
* Nützlich für den aktuellen AI-Research-Runner,
* solange noch keine externe Quelle angeschlossen ist.
*/
export function createEmptyResearchSources(
task: AIResearchTask
): AIResearchSourceProviderResult {

return collectResearchSources({
task,
sources: [],
});

}
