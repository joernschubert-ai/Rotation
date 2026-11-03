import type {buildDomainBriefs} from './aiResearchDomainBriefs';
type Briefs=ReturnType<typeof buildDomainBriefs>;
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
/** Descriptive roles of supplied historical index returns, never an entry or calibrated forecast. */
export function historicalReading(h:Briefs['history'][number]){
 if(!h.currentMatch)return 'Kein aktueller Abgleich: nicht als passende Folgestudie werten.';
 const s=h.statistics,m=s.meanPct,b=s.baselineMeanPct;
 const absolute=!finite(m)?'Indexmittel unbekannt.':m>0?'Positives Mittel: Put-Gegen-/Call-Kontext.':m<0?'Negatives Mittel: Put-Kontext/Call-Gegenkontext.':'Indexmittel null: kein Richtungsvorzug.';
 const relative=!finite(m)||!finite(b)?'Basisvergleich unbekannt.':m>b?'Über Basis.':m<b?'Unter Basis.':'Auf Basisniveau.';
 const uncertainty=finite(s.p10Pct)&&finite(s.p90Pct)&&s.p10Pct<0&&s.p90Pct>0?'p10<0/p90>0.':'Streuung beachten.';
 return absolute+' '+relative+' '+uncertainty+' Kein Prognosebeleg.';
}
export function groupReading(g:Briefs['groupComparisons'][number]){
 if(!g.sameObservationDate)return 'Kein gleichdatierter Gruppenvergleich; Lücke nicht auffüllen.';
 const words:Record<string,string>={ALIGNED_TOWARD_LONG:'beide Richtung Long',ALIGNED_TOWARD_SHORT:'beide Richtung Short',OPPOSITE_SHIFTS:'gegenläufig',ZERO_CHANGE_PRESENT:'Nulländerung dabei',UNKNOWN:'unbekannt',UNKNOWN_DATE_OR_GROUP:'unbekannt'};
 return g.shifts.map(s=>s.weeks+'W '+(words[s.relation]??'unbekannt')).join('; ')+'. Bestand ≠ Änderung.';
}
export function buildContextReadings(briefs:Briefs){return {version:'APP_CONTEXT_READINGS_V1',origin:'APP_DERIVED_NOT_MODEL',markets:briefs.groupComparisons.map(g=>({market:g.market,cot:groupReading(g),history:briefs.history.filter(h=>h.market===g.market).map(h=>({sourceId:h.id,text:historicalReading(h)}))})),limits:'Beschreibende Einordnung, keine unabhängigen Stimmen, Optionsrendite oder Handelsfreigabe.',semanticTruthVerified:false};}
type Eligible={instrument:string;either:string[];supports:string[];opposes:string[]};
/** Lossless removal of repeated allowlist IDs, not removal of evidence or permissions. */
export function compactContextCatalog(rows:Eligible[]){
 const allEither=rows.length?rows[0].either.filter(id=>rows.every(r=>r.either.includes(id))):[];
 const nasdaq=rows.filter(r=>r.instrument==='NASDAQ_PUT'||r.instrument==='NASDAQ_CALL');
 const nasdaqEither=nasdaq.length===2?nasdaq[0].either.filter(id=>!allEither.includes(id)&&nasdaq.every(r=>r.either.includes(id))):[];
 return {allEither,nasdaqEither,rows:rows.map(r=>({...r,either:r.either.filter(id=>!allEither.includes(id)&&!(r.instrument.startsWith('NASDAQ_')&&nasdaqEither.includes(id)))}))};
}

