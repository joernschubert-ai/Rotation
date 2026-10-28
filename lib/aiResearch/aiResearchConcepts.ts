import { pnfCalendarAge } from './aiResearchTemporalSemantics';
import { buildInterpretationFrame, type InterpretationFrame } from './aiResearchInterpretationFrame';
import { cotGroupCard } from './aiResearchCOTSemantics';
import { rotationCaseFindings } from './aiResearchRotationCases';
import { marketConceptFindings } from './aiResearchMarketConcepts';
/** Deterministic domain semantics. No market vote, weights, entry permission or AI calls. */
type Row=Record<string,any>;
const obj=(x:unknown):Row=>x&&typeof x==='object'&&!Array.isArray(x)?x as Row:{};
const rows=(x:unknown):Row[]=>Array.isArray(x)?x.map(obj):[];
const num=(x:unknown):number|null=>typeof x==='number'&&Number.isFinite(x)?x:null;
const positive=(x:unknown)=>{const n=num(x);return n!==null&&n>0?n:null;};
const fmt=(x:unknown)=>num(x)===null?'nicht verfügbar':String(Number((x as number).toFixed(3)));
const sign=(x:unknown)=>num(x)===null?null:(x as number)>0?1:(x as number)<0?-1:0;
const dated=(x:unknown):string|null=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x?x:null;
export const CONCEPT_VERSION='DOMAIN_SEMANTICS_V65';
export interface DomainFinding {id:string;domain:'PNF'|'COT'|'HISTORY'|'PRICE'|'CONTEXT';asOfDate:string|null;sourceRefs:string[];text:string;promptText?:string;}
export interface DomainPriceCondition {id:string;label:string;price:number;role:'REFERENCE'|'PATTERN_TRIGGER'|'PATTERN_INVALIDATION';direction:'UP'|'DOWN';state:'OPEN'|'ALREADY_MET';text:string;}
export interface IndexConcepts {market:string;asOfDate:string|null;findings:DomainFinding[];conditions:DomainPriceCondition[];}
export interface ResearchConcepts {interpretationFrame?:InterpretationFrame;version:typeof CONCEPT_VERSION;indices:Record<string,IndexConcepts>;limits:string[];}

export function buildResearchConcepts(input:unknown):ResearchConcepts{
 const d=obj(input),indices:Record<string,IndexConcepts>={};
 for(const market of ['NASDAQ','RUSSELL_2000']){
  const o=obj(obj(d.indices)[market]),c=obj(o.completedChart),date=dated(c.asOfDate);
  const close=positive(c.lastClose),prefix=market==='NASDAQ'?'N-F':'R-F';
  const index:IndexConcepts={market,asOfDate:date,findings:[],conditions:[]};indices[market]=index;
  const add=(id:string,domain:DomainFinding['domain'],text:string,refs:string[],asOfDate:string|null=date)=>index.findings.push({id:prefix+'-'+id,domain,asOfDate,sourceRefs:refs,text});
  index.findings.push(...marketConceptFindings(market,o.structure,d.sharedContext));
  index.findings.push(...rotationCaseFindings(market,o,d.sharedContext,obj(d.indices)[market==='NASDAQ'?'RUSSELL_2000':'NASDAQ']));
  const chartRef='CHART_'+market,cotRef='COT_'+market,histRef='HISTORY_'+market;
  const condition=(id:string,label:string,value:unknown,role:DomainPriceCondition['role'],direction:'UP'|'DOWN')=>{
   const price=positive(value);if(close===null||price===null||!date)return;
   // Strict crossing of MA/extremes; pattern thresholds use the engine's inclusive convention.
   const inclusive=role!=='REFERENCE',met=direction==='UP'?(inclusive?close>=price:close>price):(inclusive?close<=price:close<price);
   const effect=direction==='UP'?'Richtungswirkung: würde eine Call-Erholung stärken und eine Put-Fortsetzung schwächen.':'Richtungswirkung: würde eine Put-Fortsetzung stärken und eine Call-Erholung schwächen.';
   index.conditions.push({id:prefix+'-'+id,label,price,role,direction,state:met?'ALREADY_MET':'OPEN',text:`${label}: ${direction==='UP'?'über':'unter'} ${fmt(price)} ${met?'bereits erfüllt; keine noch offene Erstüberschreitung':'noch offen'}. ${met?'Bestehender Zustand, kein neues Ereignis.':effect} ${role==='PATTERN_INVALIDATION'?'Nur Widerlegung dieses Musters, keine notwendige Schwelle jeder frühen Gegenbewegung.':role==='PATTERN_TRIGGER'?'Preisbedingung dieses Musters; allein kein neues Ereignis oder Einstieg.':'Datierte Referenz, keine bewiesene Unterstützung oder zwingende Wendeschwelle.'}`});
  };
  const averages=rows(c.averages);
  if(close===null||!date)add('PRICE-MISSING','PRICE','Kein vergleichbarer datierter Chartschluss verfügbar; offene Preisbedingungen bleiben unbestimmt.',[chartRef]);
  for(const m of averages){const average=positive(m.average);if(close===null||average===null)continue;
   const period=num(m.period);if(period===null||![20,50,200].includes(period))continue;const relation=close>average?'über':close<average?'unter':'auf';
   add('MA'+fmt(period),'PRICE',`Chartschluss ${fmt(close)} ${relation} MA${fmt(period)} ${fmt(average)}. ${relation==='über'?'Eine Rückkehr darüber ist bereits erfüllt; erneutes Unterschreiten ist eine offene Gegenbedingung.':relation==='unter'?'Rückkehr darüber ist noch offen; ein weiterer erstmaliger Bruch darunter ist bereits erfolgt.':'Keine der beiden strikten Überschreitungsbedingungen ist erfüllt.'}`,[chartRef]);
   condition('MA'+fmt(period)+'-UP','MA'+fmt(period),average,'REFERENCE','UP');condition('MA'+fmt(period)+'-DOWN','MA'+fmt(period),average,'REFERENCE','DOWN');
  }
  for(const [key,label]of [['lowClose','vorheriges 20-Sitzungs-Schlusstief'],['highClose','vorheriges 20-Sitzungs-Schlusshoch']] as const){
   condition(key+'-UP',label,obj(c.prior20)[key],'REFERENCE','UP');condition(key+'-DOWN',label,obj(c.prior20)[key],'REFERENCE','DOWN');
  }
  const pfs=rows(obj(c.formations).pointFigure);
  if(!pfs.length)add('PNF-MISSING','PNF','Keine eigene P&F-Auswertung verfügbar; keine Formation ergänzen.',[chartRef]);
  for(const [i,p]of pfs.entries()){
   const id='PF'+i,scale=`P&F ${fmt(p.boxPercent)} %, ${fmt(p.reversalBoxes)} Umkehrboxen`,col=p.currentColumn;
   add(id+'-COLUMN','PNF',`${scale}: ${col==='O'?'O-Säule = fallende gefilterte Preisbewegung, allein kein Boden-/Erholungsbeleg':col==='X'?'X-Säule = steigende gefilterte Preisbewegung, allein kein neuer bullischer Ausbruch':'Säulenrichtung unbekannt'}. Stand der Säule ${p.currentColumnSince??'unbekannt'}.`,[chartRef]);
   const mechanics=obj(p.mechanics),basic=obj(mechanics.lastBasicSignal);
   if(mechanics.version==='PNF_MECHANICS_V51'&&date!==null&&mechanics.asOfDate===date&&close!==null&&num(mechanics.referenceClose)===close){
    add(id+'-MECHANICS','PNF',`${scale}: letztes einfaches Signal ${basic.bias??'nicht verfügbar'} vom ${basic.triggeredAt??'unbekannt'}, individueller Musterstatus ${basic.patternStatus??'unbekannt'}. Signalrichtung bleibt bis zur entgegengesetzten einfachen Auslösung bestehen; Säulenumkehr und Musterwiderlegung sind getrennte Zustände. Aktuelle Säule umfasst ${fmt(mechanics.currentColumnObservedIntervals)} beobachtete Intervalle seit Beginn; keine feste Zeitdauer aus der Skala ableiten. Projektionen nutzen die eigene geometrische Preis-Höhen-Variante mit Anker in der Signalsäule, keine standardisierte Ausbruchs-Kurszielmethode.`,[chartRef]);
    index.findings[index.findings.length-1].promptText=`${scale}: letztes einfaches Signal ${basic.bias??'unbekannt'} am ${basic.triggeredAt??'unbekannt'}; Musterstatus ${basic.patternStatus??'unbekannt'}. Signal gilt bis Gegensignal; Säule/Musterwiderlegung getrennt. Säulenalter ${fmt(mechanics.currentColumnObservedIntervals)} beobachtete Intervalle. Ziele: eigene Preis-Höhen-Variante, Anker Signalsäule, keine Standard-Ausbruchsmethode.`;
    for(const [j,t]of rows(mechanics.nextThresholds).entries()){
     const label=t.kind==='COLUMN_REVERSAL'?'Nächste Säulenumkehr (kein Kauf-/Verkaufssignal)':t.kind==='COLUMN_EXTENSION'?'Nächste Säulenverlängerung':t.kind==='BASIC_BUY'?'Nächste einfache Kaufauslösung':'Nächste einfache Verkaufsauslösung';
     add(id+'-GRID'+j,'PNF',`${scale}: ${label}, ${t.direction==='UP'?'aufwärts':'abwärts'} bei ${fmt(t.price)}, Gitterzeile ${fmt(t.row)}, Abstand ${fmt(t.distancePoints)} Punkte / ${fmt(t.distancePct)} % zum Chartschluss. ${t.conditionMetNow===true?'Bereits erfüllt, kein neuer offener Trigger.':'Noch offen nach unverändertem Säulenstand; bei Verlängerung können Umkehr- und Ausbruchsschwellen wandern.'} ${t.requiresNewColumn===true?'Erfordert erst eine neue gleichgerichtete Säule nach Gegenbewegung; kein weiterer Ausbruch in der aktuellen Signalsäule.':''} Nur Tagesschlussverfahren, keine Intraday-Aussage.`,[chartRef]);
     index.findings[index.findings.length-1].promptText=`${scale}: ${t.kind==='COLUMN_REVERSAL'?'Säulenumkehr, kein Basissignal':t.kind==='COLUMN_EXTENSION'?'Säulenverlängerung':t.kind==='BASIC_BUY'?'Basis-Kauf':'Basis-Verkauf'} ${t.direction} ${fmt(t.price)}, Zeile ${fmt(t.row)}, Abstand ${fmt(t.distancePct)} %. ${t.conditionMetNow===true?'Erfüllt.':'Offen.'} ${t.requiresNewColumn===true?'Erfordert neue gleichgerichtete Säule nach Gegenbewegung.':''}`;
    }
   }
   for(const [key,event]of [['LAST',p.latest],['FORM',p.forming]] as const){
    if(!event)continue;const e=obj(event),bull=e.bias==='BULLISH',bear=e.bias==='BEARISH',bias=bull?'bullisch':bear?'bearisch':'Richtung unbekannt';
    const invalid=e.status==='INVALIDATED'||e.currentRelation==='INVALIDATED'||!!e.invalidatedAt;
    const same=(bull&&col==='X')||(bear&&col==='O'),opposite=(bull&&col==='O')||(bear&&col==='X');
    const status=invalid?'Widerlegt; nicht als gültige Auslösung verwenden.':e.status==='FORMING'?'Entstehend, nicht ausgelöst; frühe bedingte Hypothese bleibt möglich.':e.status==='CONFIRMED'?`Historisch ausgelöst am ${e.confirmedAt??'unbekannt'}. ${same?'Aktuelle Säule stimmt mit der Auslösungsrichtung überein.':opposite?'Aktuelle Säule läuft gegen die Auslösung; das allein widerlegt sie nicht.':'Aktuelle Richtung nicht vergleichbar.'}`:'Status unbekannt; keine Bestätigung ergänzen.';
    const consequence=invalid?'':e.status==='FORMING'?`Ein ${bias}es Muster ist noch keine bestätigte ${bull?'Aufwärtswende':'Abwärtsfortsetzung'}.`:e.confirmationConditionMetNow===false?'Die frühere Preisbedingung ist aktuell nicht erfüllt; historischer Status ist keine frische Bestätigung.':e.status==='CONFIRMED'&&same&&e.confirmationConditionMetNow===true?(bear?'Bearischer Fortsetzungsbefund; O-Säule ist dazu kein Gegenargument.':bull?'Bullischer Ausbruchs-/Fortsetzungsbefund; künftiger Verlauf bleibt offen.':''):opposite?'Alte Auslösung ist keine frische Bestätigung und kann durch bloßes Wiederüberschreiten nicht automatisch reaktiviert werden.':'Keine frische Bestätigung aus dem historischen Status allein ableiten.';
    add(id+'-'+key,'PNF',`${scale}, ${e.family??'geliefertes Muster'}, ${bias}: ${status} ${consequence} Preisbedingung ${fmt(e.confirmationLevel)}, Widerlegung ${fmt(e.invalidationLevel)}; Widerlegung betrifft nur dieses Muster, keine Pflichtmarke jeder frühen Gegenbewegung.`,[chartRef]);
    index.findings[index.findings.length-1].promptText=`${scale}, ${e.family??'geliefertes Muster'}, ${bias}, ${e.status??'unbekannt'}${e.status==='FORMING'?' = ENTSTEHEND, NICHT AUSGELÖST':e.status==='CONFIRMED'?' = HISTORISCH':''}; Auslösung ${e.confirmedAt??'fehlt'} (${pnfCalendarAge(e.confirmedAt,date)??'?'} Kalendertage vor Chartstand), Widerlegung ${e.invalidatedAt??'fehlt'}. ${invalid?'Widerlegt.':same?'Säule gleichgerichtet.':opposite?'Säule gegenläufig.':'Säule unbekannt.'} Bedingung jetzt ${e.confirmationConditionMetNow??'unbekannt'}. ${consequence} Trigger ${fmt(e.confirmationLevel)}, Widerlegung ${fmt(e.invalidationLevel)} (mustereigen, keine Pflichtmarke früher Gegenidee).`;
    if(!invalid&&(bull||bear)){condition(id+'-'+key+'-TRIGGER',scale+' '+bias+'e Musterbedingung',e.confirmationLevel,'PATTERN_TRIGGER',bull?'UP':'DOWN');condition(id+'-'+key+'-INVALID',scale+' '+bias+'e Musterwiderlegung',e.invalidationLevel,'PATTERN_INVALIDATION',bull?'DOWN':'UP');}
    const target=obj(e.target);if(!invalid&&positive(target.price)!==null){add(id+'-'+key+'-TARGET','PNF',`${scale}: Projektion ${fmt(target.price)}, ${target.status??'Status unbekannt'}, bekannt ${target.knownAt??'unbekannt'}. ${target.status==='PRELIMINARY'?'Noch veränderlicher Zählstand.':'Fixierung des Zählstands ist keine Realisierungsgarantie.'} Keine Trefferwahrscheinlichkeit, Frist oder Optionsrendite.`,[chartRef]);
     index.findings[index.findings.length-1].promptText=`${scale}: eigene Preis-Höhen-Projektion ${fmt(target.price)}, ${target.status}, bekannt ${target.knownAt??'unbekannt'}; keine Garantie/Frist/Optionsrendite.`;
    }
   }
   const advanced=obj(p.advanced),a=obj(advanced.latest);
   if(advanced.version==='PNF_ADVANCED_CLOSE_GRID_V52'&&advanced.asOfDate===date&&a.family){
    const bull=a.bias==='BULLISH',invalid=a.status==='INVALIDATED'||!!a.invalidatedAt;
    const trap=a.family==='PNF_BULL_TRAP'||a.family==='PNF_BEAR_TRAP';
    const reversed=a.family==='PNF_BULLISH_SIGNAL_REVERSED'||a.family==='PNF_BEARISH_SIGNAL_REVERSED';
    const name=String(a.family),r=obj(a.recognition);
    add(id+'-ADV','PNF',`${scale}: Zusatzformation ${name}, Wirkungsrichtung ${bull?'bullisch':'bearisch'}, historisch ausgelöst am ${a.confirmedAt??'unbekannt'}, erkannt ${a.discoveredAt??'unbekannt'}. Status ${a.status??'unbekannt'}, Widerlegungsdatum ${a.invalidatedAt??'fehlt'}, Säulenrelation ${a.currentRelation??'unbekannt'}, Preisbedingung jetzt ${a.confirmationConditionMetNow??'unbekannt'}. ${invalid?'Widerlegt; nicht als gültige Idee verwenden.':'Keine bestätigte künftige Trendwende.'} ${trap?'Trap = Ein-Boxen-Mehrfachausbruch mit unmittelbarer Drei-Boxen-Gegen-Säule, kein notwendiges einfaches Gegensignal; kann in eine Catapult übergehen.':reversed?'Der Name bezeichnet den vorherigen Trend: Bullish Signal Reversed wirkt bearisch, Bearish Signal Reversed bullisch. Streng je zwei aufeinanderfolgende höhere/ tiefere Extreme und anschließender Gegenausbruch.':'Strenge Variante mit sieben benachbarten Säulen, erstem 1–3-Boxen-Mehrfachausbruch, Rückkehr in die Zone ohne einfaches Gegensignal, zweitem gleichgerichteten Ausbruch.'} Trigger ${fmt(a.confirmationLevel)} (Zeile ${fmt(r.triggerRow)}), musterspezifische Widerlegung ${fmt(a.invalidationLevel)} (Zeile ${fmt(r.invalidationRow)}). Quellen-Säulen beginnen ${Array.isArray(r.sourceColumnStarts)?r.sourceColumnStarts.join(', '):'unbekannt'}. Definition ${r.version??'unbekannt'}: ${r.definition??'nicht verfügbar'}. Keine eigene Projektion oder Erfolgsquote; überschneidet Basisformationen und Skalen. Nur die letzte Zusatzformation je Skala wird im Kurzkontext gezeigt; ihr Fehlen beweist keine andere Formation.`,[chartRef]);
    index.findings[index.findings.length-1].promptText=`${scale}: ${name}, Richtung ${bull?'BULLISH':'BEARISH'}, Auslösung ${a.confirmedAt??'unbekannt'}, ${a.status}, ${a.currentRelation}; Trigger jetzt ${a.confirmationConditionMetNow??'unbekannt'}. Trigger ${fmt(a.confirmationLevel)}, Widerlegung ${fmt(a.invalidationLevel)}. ${trap?'Trap warnt, kein notwendiges Basis-Gegensignal; Catapult möglich.':reversed?'Name = alter Trend, Wirkung umgekehrt.':'Strenge 7-Säulen-Catapult, erster Ausbruch 1–3 Boxen, kein Gegensignal im Rücklauf.'} Alter ${pnfCalendarAge(a.confirmedAt,date)??'?'} Kalendertage; keine heutige Auslösung/Prognose oder unabhängiger Beweis.`;
    if(!invalid){condition(id+'-ADV-TRIGGER',name+' Musterbedingung',a.confirmationLevel,'PATTERN_TRIGGER',bull?'UP':'DOWN');condition(id+'-ADV-INVALID',name+' Widerlegung',a.invalidationLevel,'PATTERN_INVALIDATION',bull?'DOWN':'UP');}
   }
   if(!p.latest&&!p.forming)add(id+'-NOEVENT','PNF',`${scale}: keine Auslösung und kein entstehendes Muster geliefert.`,[chartRef]);
  }
  if(pfs.length>1){const cols=pfs.map(p=>p.currentColumn),signals=pfs.map(p=>{const m=obj(p.mechanics);return m.asOfDate===date&&m.referenceClose===close?obj(m.lastBasicSignal).bias:null;});
   add('PF-SCALES','PNF',`Skalenvergleich: Säulen ${cols.every(c=>c==='X'||c==='O')?(cols.every(c=>c===cols[0])?'gleichgerichtet':'gegenläufig'):'nicht vollständig bekannt'}; letzte einfache Signale ${signals.every(b=>b==='BULLISH'||b==='BEARISH')?(signals.every(b=>b===signals[0])?'gleichgerichtet':'gegenläufig'):'nicht vollständig bekannt'}. Beide Skalen stammen aus denselben Schlusskursen, keine unabhängigen Bestätigungen oder neue Gewichtung.`,[chartRef]);}
  for(const [i,h]of rows(obj(c.formationHistory).selected).entries()){
   const raw=num(h.rawIndexMeanPct),base=num(h.baselineRawIndexMeanPct),bear=h.bias==='BEARISH';
   if(!date||obj(c.formationHistory).asOfDate!==date){add('PFH'+i,'HISTORY','Formationshistorie zeitlich nicht mit dem Chart abgeglichen; keine Richtungsübertragung.',[chartRef]);continue;}
   add('PFH'+i,'HISTORY',`Eigene Formationshistorie ${h.family??'unbekannt'}, Skala ${fmt(h.scale)} %, Stadium ${h.stage??'unbekannt'}, Stand ${obj(c.formationHistory).asOfDate??'unbekannt'}: ${h.matched===true?'passende Familie/Skala/Stadium':'kein bestätigter Studienabgleich'}. Folgende 20 Sitzungen nach Einstieg zum nächsten beobachteten Schluss: rohe Indexrendite Mittel ${fmt(raw)} %, rohe Basis ${fmt(base)} %, rohe p10/p90 ${fmt(h.p10RawIndexPct)} / ${fmt(h.p90RawIndexPct)} %; richtungsbereinigtes Mittel ${fmt(h.directionalMeanPct)} %, Basis ${fmt(h.baselineDirectionalMeanPct)} %, p10/p90 ${fmt(h.p10DirectionalPct)} / ${fmt(h.p90DirectionalPct)} %. ${bear?(raw===null?'Bearische Richtung kehrt das Vorzeichen der rohen Indexrendite um.':raw>0?'Positive rohe Indexrendite entspricht negativer Richtungsrendite: Gegenargument zur Abwärtsidee.':raw<0?'Negative rohe Indexrendite entspricht positiver Richtungsrendite: historischer Abwärtskontext, kein Prognosebeweis.':'Roher Mittelwert null; kein Richtungsvorteil.'):'Bullische Richtung verwendet unverändertes Vorzeichen.'} Fälle ${fmt(h.sampleSize)}, nichtüberlappend ${fmt(h.nonOverlappingCount)}, Qualität ${h.quality??'unbekannt'}. Nur Brutto-Indexvergleich, überlappende Ereignisse, keine unabhängigen Skalenbeweise, kein unberührter Out-of-Sample-Test, keine validierte Prognose oder Optionsrendite. Rohe und richtungsbereinigte Quantile sind getrennte Zahlenpakete; bearisch gilt p10 roh = minus p90 gerichtet und umgekehrt.`,[chartRef]);
   index.findings[index.findings.length-1].promptText=`Formationshistorie ${h.family}, ${fmt(h.scale)} %, ${h.stage}, Datum ${obj(c.formationHistory).asOfDate??'unbekannt'}, Abgleich ${h.matched===true?'ja':'fehlt'}: folgende 20 Sitzungen, Einstieg nächster Schluss. Rohe Indexrendite ${fmt(raw)} %, rohe Basis ${fmt(base)} %, rohe p10/p90 ${fmt(h.p10RawIndexPct)}/${fmt(h.p90RawIndexPct)} %. Richtungsrendite ${fmt(h.directionalMeanPct)} %, Richtungsbasis ${fmt(h.baselineDirectionalMeanPct)} %, gerichtete p10/p90 ${fmt(h.p10DirectionalPct)}/${fmt(h.p90DirectionalPct)} %. ${bear?'Bearisch: Rohvorzeichen umgekehrt; positive rohe Rendite ist Abwärts-Gegenargument.':'Bullisch: Vorzeichen unverändert.'} n=${fmt(h.sampleSize)}, nichtüberlappend ${fmt(h.nonOverlappingCount)}, ${h.quality}. Brutto, überlappend, kein validierter Vorteil/OOS/Optionsgewinn.`;
  }
  const groups=rows(obj(o.cotFacts).groups);
  if(!groups.length)add('COT-MISSING','COT','Keine eigenen COT-Gruppen verfügbar; kein Ersatz durch den anderen Index.',[cotRef]);
  for(const [i,g]of groups.entries()){
   const card=cotGroupCard(g),obs=dated(g.observationDate);
   add('COT'+i,'COT',card.text,[cotRef],obs);
   index.findings[index.findings.length-1].promptText=card.promptText;
  }
  const lm=groups.find(g=>g.group==='LEVERAGED_MONEY'),am=groups.find(g=>g.group==='ASSET_MANAGER');
  for(const w of [1,4,13])if(lm&&am){const l=rows(lm.changes).find(h=>h.weeks===w),a=rows(am.changes).find(h=>h.weeks===w);
   if(lm.observationDate&&lm.observationDate===am.observationDate&&sign(l?.delta)&&sign(a?.delta)&&sign(l?.delta)!==sign(a?.delta))add('COT-GROUP-'+w,'COT',`GRUPPENVERGLEICH ${w} Wochen: Asset Manager gegen Leveraged Money, nicht 1W gegen längere Horizonte derselben Gruppe. Nettopositionen ändern sich gegenläufig. Kein eindeutiges gemeinsames Richtungssignal und kein statistischer Signifikanznachweis.`,[cotRef],lm.observationDate);
  }
  if(groups.length)add('COT-TIME','COT','COT ist datierter wöchentlicher Positionskontext. Veröffentlichungszeit nicht geliefert; spätere Kurstage nicht darin enthalten. Zustände, Horizonte und Gruppen nicht zu einer sicheren Kursprognose verrechnen.',[cotRef],null);
  for(const [i,h]of rows(o.historicalStudies).entries()){
   const q=obj(h.focus20D),mean=num(q.meanPct),base=num(q.baselineMeanPct),supplied=num(q.excessMeanPp),diff=mean!==null&&base!==null?mean-base:null;
   const p10=num(q.p10Pct),p90=num(q.p90Pct),matched=h.currentMatch===true;
   const signMeaning=mean===null?'Renditerichtung unbekannt.':mean>0?'Positiver historischer Indexmittelwert: Gegenargument zur Put-Fortsetzung, möglicher Kontext für Call-Erholung; kein Beweis für weitere Verluste.':mean<0?'Negativer historischer Indexmittelwert: Gegenargument zur Call-Erholung, möglicher Kontext für Put-Fortsetzung; kein Beweis künftiger Verluste.':'Historischer Mittelwert null; kein Richtungsvorteil daraus.';
   const tails=p10!==null&&p90!==null?(p10<0&&p90>0?'Streuung umfasst negative und positive Ergebnisse.':'Quantile sind keine Ergebnisgrenzen.'):'Streuung nicht vollständig verfügbar.';
   add('H'+i,'HISTORY',`${h.family??'Studie'}, ${h.state??'Zustand'}: ${matched?'aktueller Zustand abgeglichen':'kein bestätigter aktueller Zustandsabgleich; nicht als passendes Vergleichsmuster ausgeben'}. Vollständiges Vergleichspaket für die Zusammenfassung: historisches 20-Sitzungs-Mittel ${fmt(mean)} %, Basis ${fmt(base)} %, Differenz ${fmt(diff)} Prozentpunkte${supplied!==null&&diff!==null&&Math.abs(supplied-diff)>0.02?' (gelieferte Differenz widersprüchlich; aus Mittel/Basis gerechnet)':''}; p10/p90 ${fmt(p10)} / ${fmt(p90)} %. ${tails} ${matched?signMeaning:'Keine Richtungsübertragung.'} Historie ist Vergleichskontext, kein aktueller Marktimpuls oder Auslöser. ${diff!==null?`Basisvergleich ${diff>0?'über':diff<0?'unter':'gleich'} Basis; das ist getrennt vom absoluten Vorzeichen zu lesen.`:'Basisvergleich fehlt.'} Fälle ${fmt(q.sampleSize)}, nichtüberlappend ${fmt(q.nonOverlappingCount)}; keine unabhängigen Mehrfachbeweise oder Signifikanz ableiten.`,[histRef],typeof h.asOfDate==='string'?h.asOfDate:null);
   index.findings[index.findings.length-1].promptText=`${h.family??'Studie'}, ${h.state??'unbekannt'}, aktueller Abgleich ${matched?'ja':'nicht bestätigt'}: folgende 20 Sitzungen rohe Indexrendite Mittel ${fmt(mean)} %, Basis ${fmt(base)} %, Differenz ${fmt(diff)} Prozentpunkte; p10/p90 ${fmt(p10)}/${fmt(p90)} %. ${matched?(mean===null?'Vorzeichen unbekannt.':mean>0?'Positiver Mittelwert: Put-Gegenargument, Call-Kontext.':mean<0?'Negativer Mittelwert: Call-Gegenargument, Put-Kontext.':'Mittel null: kein Richtungsvorteil.'):'Kein Richtungsübertrag.'} n=${fmt(q.sampleSize)}, nichtüberlappend ${fmt(q.nonOverlappingCount)}. Differenz und Rohvorzeichen getrennt; Vergleich, kein Impuls/Prognosebeweis.`;
  }
  if(!rows(o.historicalStudies).length)add('H-MISSING','HISTORY','Keine eigenen historischen Studien verfügbar; kein Rückgriff auf die des anderen Index.',[histRef]);
  const windows=rows(obj(c.priceTrajectory).windows),w=(n:number)=>windows.find(x=>x.sessions===n);
  if(w(20)||w(30))add('PATH','PRICE',`Jüngerer Verlauf: 20 Sitzungen ${fmt(w(20)?.returnPct)} %, 30 Sitzungen ${fmt(w(30)?.returnPct)} %; Dynamik 5/10 ${fmt(w(5)?.returnPct)} / ${fmt(w(10)?.returnPct)} %, Kontext 60 ${fmt(w(60)?.returnPct)} %. Unterschiedliche und überlappende Fenster gemeinsam würdigen, nicht als unabhängige Bestätigungen zählen.`,[chartRef]);
  const magnitude=obj(obj(c.priceTrajectory).magnitudeContext),last=obj(magnitude.latest),shock=obj(magnitude.largestInLast10ObservedIntervals);
  if(num(last.returnPct)!==null)add('DAY','PRICE',`Letztes Intervall ${last.fromDate??'?'} bis ${last.date??'?'}: ${fmt(last.returnPct)} %; Größenrang ${fmt(last.priorAbsoluteMovesStrictlySmallerPct)} % gehört nur zu diesem Tagesintervall, nicht zur 5-/20-Sitzungsrendite. Größter absoluter Ausschlag im Zehnerfenster: ${shock.fromDate??'?'} bis ${shock.date??'?'} ${fmt(shock.returnPct)} %, Größenrang ${fmt(shock.priorAbsoluteMovesStrictlySmallerPct)} %. Weder Verlust noch Rebound allein beweist einen Boden.`,[chartRef]);
 }
 return {version:CONCEPT_VERSION,indices,interpretationFrame:buildInterpretationFrame(d,indices),limits:[
  'Relative Führung ist kein absoluter Kursanstieg. IWM/QQQ ist hier 1 plus Renditedifferenz, kein RRG. Fachbefunde sind regelgebundene Einordnungen, keine Gesamtmarktentscheidung, Erfolgswahrscheinlichkeit oder App-Freigabe. Frühe Gegenideen bleiben mit anderen Belegen möglich. Nicht gestützte Konstellation bedeutet keine Widerlegung der App-Phase.',
  'P&F: vorhandenes tägliches Schlusskursverfahren, geometrisches Prozentgitter 0,5/1 %, drei Umkehrboxen; Basis-Double-/Triple-Ausbrüche plus eng definierte Traps, Signal-Reversed und 7-Säulen-Catapults. Keine vollständige diskretionäre P&F-Erkennung oder Horizontalzählung. Zusatzfamilien sind eigene Studiengruppen, keine Übernahme der Basis-Musterstatistik.',
  'Put profitiert richtungsbezogen von fallendem Index, Erholung ist Gegenrisiko. Call profitiert richtungsbezogen von steigendem Index, weitere Schwäche ist Gegenrisiko. Ohne Optionsdaten keine konkrete Produktwertänderung.',
  'Frühe Preisbedingung kann aus offener Referenz stammen. Musterwiderlegung ist nur musterspezifisch; erreichte Bedingung ist kein neuer Trigger. Aus zwei Kursständen keine zwischenzeitliche Rückeroberung erfinden.',
  'Quantile sind keine Ergebnisgrenzen. Modellkontext zeigt Umkehr/Basis-Ausbrüche; nächste Säulenverlängerungen bleiben im vollständigen Fachkonzept. Historische 20-Sitzungs-Indexrenditen beweisen weder langfristigen Trend noch nächste Rendite, Signifikanz oder Optionsrendite. Studien und Kursindikatoren können dieselben Beobachtungen mehrfach verwenden.'
 ]};
}

/** Only compact conclusions enter the prompt. Full findings/conditions stay inspectable. */
export function conceptInputLines(index:IndexConcepts):string[]{
 const lines=index.findings.filter(f=>!/-CASE-\d+$/.test(f.id)&&!f.id.endsWith('-ROTATION-SEMANTICS')&&!f.id.endsWith('-ENTRY-CONTEXT')&&!f.id.endsWith('-PATH')&&!/-PF[01]-GRID0$/.test(f.id)).map(f=>`[${f.id}] Stand ${f.asOfDate??'unbekannt'}: ${f.promptText??f.text}`);
 for(const direction of ['UP','DOWN'] as const){
  const open=index.conditions.filter(c=>c.role==='REFERENCE'&&c.direction===direction&&c.state==='OPEN').sort((a,b)=>direction==='UP'?a.price-b.price:b.price-a.price).slice(0,2);
  for(const p of open)lines.push(`[${p.id}] Offene Referenz: ${p.direction==='UP'?'Schluss über':'Schluss unter'} ${fmt(p.price)} (${p.label}); ${p.direction==='UP'?'stärkt Call-Erholung, schwächt Put-Fortsetzung':'stärkt Put-Fortsetzung, schwächt Call-Erholung'}. Datierte Referenz, keine bewiesene Unterstützung oder Pflichtmarke.`);
 }
 return lines;
}
