import type { DomainFinding } from './aiResearchConcepts';
type Row=Record<string,any>;
const obj=(x:unknown):Row=>x&&typeof x==='object'&&!Array.isArray(x)?x as Row:{};
const n=(x:unknown):number|null=>typeof x==='number'&&Number.isFinite(x)?x:null;
const scalar=(x:unknown)=>n(x)??n(obj(x).value);
const fmt=(x:unknown)=>n(x)===null?'unbekannt':String(Number((x as number).toFixed(3)));
const date=(x:unknown):string|null=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x?x:null;
/** Read-only descriptions. Never computes a new phase, score, gate or allocation. */
export function marketConceptFindings(market:string,own:unknown,shared:unknown):DomainFinding[]{
 const s=obj(own),g=obj(shared),a=obj(s.analysis),d=obj(a.dynamics),entry=obj(a.entry),b=obj(s.breadth),out:DomainFinding[]=[];
 const prefix=market==='NASDAQ'?'N-F':'R-F',asOf=date(s.referenceDate),source=market==='NASDAQ'?'NASDAQ100_PRIMARY_CONSTITUENT_BREADTH':'IWM_EQUITY_HOLDINGS_SMALLCAP_PROXY';
 const validSource=s.source===source||s.source==='SYNTHETIC_EVALUATION_ONLY';
 const add=(id:string,text:string,promptText?:string)=>out.push({id:prefix+'-'+id,domain:'CONTEXT',asOfDate:asOf,sourceRefs:['APP'],text,promptText});
 if(!validSource||!asOf||s.available===false){add('STRUCTURE-UNKNOWN','Eigene datierte Struktur fehlt oder ist nicht zugeordnet. Keine fremde Indexbreite und keine erfundene Phase einsetzen.');return out;}
 const values=[scalar(b.b20),scalar(b.b50),scalar(b.b200)],valid=values.every(v=>v!==null&&v>=0&&v<=100);
 if(valid){
  const [b20,b50,b200]=values as number[],direction=b50>50?'Mehrheit über MA50':b50<50?'Mehrheit nicht über MA50':'genau hälftig über MA50';
  add('BREADTH',`Eigene MA20/50/200-Breite ${fmt(b20)}/${fmt(b50)}/${fmt(b200)} Prozent; ${direction}. Einheit Prozentanteil, keine Scorewerte. Niveau und Verlauf sind getrennt: unter 50 allein beweist keine neue Distribution, über 50 keine Erholung. Quelle ${source}; Russell bleibt ein Holdings-Proxy, Nasdaq aktuelle Mitglieder. Historische Mitgliedschaften nicht rekonstruiert.`,
   `Eigene Breite 20/50/200 ${fmt(b20)}/${fmt(b50)}/${fmt(b200)} %; ${direction}. Niveau ist keine Veränderung/Phase. Aktuelles Universum${market==='RUSSELL_2000'?', Holdings-Proxy':''}.`);
 }
 const velocity20=n(d.velocity20),velocity50=n(d.velocity50),complete=d.complete===true;
 const change=complete&&velocity20!==null&&velocity50!==null;
 add('BREADTH-PATH',change?`Gelieferte Breitenveränderung b20 ${fmt(velocity20)}, b50 ${fmt(velocity50)} Prozentpunkte. ${velocity20<0&&velocity50<0?'Beide rückläufig':velocity20>0&&velocity50>0?'Beide verbessern sich':'Gemischter Verlauf'}. Zeitbasis ${d.timeBasis??'nicht verifiziert'}; Beobachtungsintervalle nicht automatisch Börsensitzungen. Keine unabhängige Zusatzbestätigung derselben Breitenmessung.`:
  'Eigene Breitenveränderung nicht vollständig mit verfügbarer Datenqualität belegt. Fehlende Historie ist weder stabile Breite noch Bestätigung einer Erholung oder Distribution.',
  change?`Breitenänderung b20/b50 ${fmt(velocity20)}/${fmt(velocity50)} Prozentpunkte; Zeitbasis ${d.timeBasis??'unverifiziert'}, keine unabhängigen Stimmen.`:'Breitenverlauf unvollständig: keine Stabilität oder Richtungsbestätigung erfinden.');
 if(typeof s.phase==='string'&&/^PHASE_[1-7]_/.test(s.phase)){
  const quality=obj(a.phaseDataQuality),confidence=n(a.phaseConfidence),provisional=quality.classificationIsProvisional===true;
  add('PHASE',`Gelieferte eigene App-Phase ${s.phase}, Modell-Konfidenzwert ${fmt(confidence)} (keine kalibrierte Erfolgswahrscheinlichkeit). ${provisional?'Vorläufig wegen unvollständiger Vergleiche.':'Nicht allein aus Breitenstand oder VIX neu berechnen.'} ${quality.rawAdThresholdReachable===false?'Ein alter A/D-Kapitulations-Rohzählwert ist beim gelieferten Nenner mathematisch unerreichbar; nicht als zusätzlich ausgewertetes Merkmal zählen. ':''}Das Sieben-Phasen-Schema ist eine operative App-Regel, keine identische klassische Vier-Stufen-Lehre. VIX unter 20 verhindert Phase 3 nicht; Phase 3 ist noch kein Put-Einstieg.`,
   `App-Phase ${s.phase}, Modellkonfidenz ${fmt(confidence)}, ${provisional?'vorläufig':'keine Wahrscheinlichkeitskalibrierung'}. Phase nicht neu erraten; VIX<20 schließt Distribution nicht aus. Phase ist keine Einstiegserlaubnis.`);
 }
 if(Object.keys(entry).length){
  const failed=Array.isArray(entry.failedChecks)?entry.failedChecks.filter((v:unknown)=>typeof v==='string').slice(0,16):[];
  add('ENTRY-CONTEXT',`Bestehender Strategiepfad: ${entry.decision??'unbekannt'}, Fenster ${entry.entryWindow??'unbekannt'}, frühe aktuelle Prüfung ${entry.earlyCurrentTrigger??'nicht geliefert'}. Nicht erfüllte Einzelprüfungen: ${failed.join(', ')||'nicht geliefert oder keine'}. ${market==='NASDAQ'?'Nasdaq-Calls sind im aktuellen Regelwerk in Phase 3–7 gesperrt. Eine frühe Forschungs-Erholung darf trotzdem diskutiert werden. Der frühe Put-Pfad benötigt keine schon negative 20-Sitzungsrendite.':'Russell-Ausführung verlangt eigene relative und absolute Stärke und eigene Breiten-/Rotationsbestätigung; relatives Besserhalten allein ist kein Call-Einstieg.'} Trade Stack, Größenbestimmung und weitere Sperren folgen separat.`,
   `Strategiepfad ${entry.decision??'unbekannt'}, Fenster ${entry.entryWindow??'unbekannt'}; frühe Prüfung ${entry.earlyCurrentTrigger??'unbekannt'}. ${market==='NASDAQ'?'Call ab Phase 3 gesperrt; freie frühe Erholungshypothese bleibt diskutierbar.':'Relatives Besserhalten allein ist kein Russell-Call-Einstieg.'} Keine Forschungs-Freigabe.`);
 }
 const r=obj(obj(g.nasdaqOnly).rotation),rs= n(r.rsSmall);
 if(rs!==null&&rs>0)add('ROTATION-SEMANTICS',`Gemeinsame relative Vergleichsgröße IWM gegen QQQ: ${fmt(rs)}; sie entspricht 1 plus Renditedifferenz, nicht dem Preisquotienten und nicht einem proprietären RRG. Relative Führung kann bei fallenden Kursen beider Indizes entstehen; eigene absolute Preisrichtung separat lesen. Daten-/Fensterausrichtung wurde damit nicht verifiziert.`,
  `IWM/QQQ-Vergleich ${fmt(rs)} = 1+Renditedifferenz, kein RRG. Relative Führung beweist keinen absoluten Anstieg; Datenausrichtung nicht verifiziert.`);
 return out;
}
