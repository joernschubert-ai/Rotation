export const SOURCE_CATALOG_HEADER="BEFUNDKATALOG: datierte Beobachtungen und Vergleichskontext. Auswahl ist keine Bestätigung einer These.\n";
export const SOURCE_CATALOG_FOOTER="GRENZEN: COT position ist Zustand, weekly 1W-Änderung, longerHorizons längere Änderungen; conflictPairs bleiben getrennt. Netto-Long ist kein Kaufimpuls. Historische Folgerenditen sind keine Prognose. Musterstatus und Skalen sind keine unabhängigen Stimmen. Freie Hypothese bleibt ungeprüft. Keine Optionsbewertung oder Ausführungsfreigabe.";
export const SOURCE_CATALOG_OUTPUT_RULE="AUSGABE: arguments nur side+sourceId; keine facets/readings. App liefert COT-Teilbefunde. MA/P&F abhaengig, Historie kein Impuls. JE HYPOTHESIS: eigener RSI-Befund; Neueinstieg mit Paar-ID, Kurzfristig UND 60/80 Intervalle abwaegen. Erholung: Call-Kontext/Put-Gegenwind, keine Freigabe. Gegenidee/offen erlaubt.";
export const SHARED_SOURCE_RULES=[SOURCE_CATALOG_HEADER.trimEnd(),SOURCE_CATALOG_FOOTER,SOURCE_CATALOG_OUTPUT_RULE].join('\n');
/** Exact fixed bookends only. Source rows, admissibility lists and scenario rows are never shortened. */
export function separateSharedSourceRules(text:string){let out=text;
 if(out.startsWith(SOURCE_CATALOG_HEADER))out='BEFUNDKATALOG:\n'+out.slice(SOURCE_CATALOG_HEADER.length);
 for(const rule of [SOURCE_CATALOG_OUTPUT_RULE,SOURCE_CATALOG_FOOTER])if(out.endsWith('\n'+rule))out=out.slice(0,-rule.length-1);
 return out;
}
