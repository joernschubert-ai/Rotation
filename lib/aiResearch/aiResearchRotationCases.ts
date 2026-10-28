import type { DomainFinding } from './aiResearchConcepts';
type Row = Record<string, any>;
type Truth = boolean | null;
export type CaseState = 'SUPPORTED' | 'PARTIAL' | 'NOT_SUPPORTED' | 'UNKNOWN' | 'NOT_APPLICABLE';
export interface RotationCase { number:number; title:string; state:CaseState; asOfDate:string|null; facts:string[]; missing:string[]; counterargument:string; }
const stateText:Record<CaseState,string>={SUPPORTED:'gestützt',PARTIAL:'teilweise belegt',NOT_SUPPORTED:'nicht gestützt',UNKNOWN:'unbekannt',NOT_APPLICABLE:'hier nicht zutreffend'};
const obj=(x:unknown):Row=>x&&typeof x==='object'&&!Array.isArray(x)?x as Row:{};
const n=(x:unknown):number|null=>typeof x==='number'&&Number.isFinite(x)?x:null;
const scalar=(x:unknown):number|null=>n(x)??n(obj(x).value);
const date=(x:unknown):string|null=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x?x:null;
const sign=(x:unknown):number|null=>n(x)===null?null:Math.sign(x as number);
const test=(value:number|null,predicate:(value:number)=>boolean):Truth=>value===null?null:predicate(value);
const all=(...values:Truth[]):Truth=>values.includes(false)?false:values.includes(null)?null:true;
const either=(...values:Truth[]):Truth=>values.includes(true)?true:values.includes(null)?null:false;
const bull=(s:unknown):Truth=>typeof s==='string'?['BULLISH_CONFIRMED','BULLISH_CONFIRMING'].includes(s):null;
const bear=(s:unknown):Truth=>typeof s==='string'?['BEARISH_CONFIRMED','BEARISH_CONFIRMING','INTERNAL_BREAKDOWN'].includes(s):null;

/** Descriptive cases only. No score, probability, entry decision or mutable engine state. */
export function rotationCaseAssessment(market:string,index:unknown,shared:unknown,other:unknown):RotationCase[]{
  const o=obj(index),s=obj(o.structure),c=obj(o.completedChart),g=obj(shared),a=obj(s.analysis),d=obj(a.dynamics);
  const asOf=date(c.asOfDate),source=market==='NASDAQ'?'NASDAQ100_PRIMARY_CONSTITUENT_BREADTH':'IWM_EQUITY_HOLDINGS_SMALLCAP_PROXY';
  const own=asOf!==null&&date(s.referenceDate)===asOf&&s.available!==false&&[source,'SYNTHETIC_EVALUATION_ONLY'].includes(s.source);
  const breadth=obj(s.breadth),b50=own?scalar(breadth.b50):null,b200=own?scalar(breadth.b200):null;
  const validBreadth=(v:number|null)=>v!==null&&v>=0&&v<=100?v:null;
  const half50=validBreadth(b50),half200=validBreadth(b200);
  const p5=asOf?n(c.return5SessionsPct):null,p20=asOf?n(c.return20SessionsPct):null;
  const windows=Array.isArray(obj(c.priceTrajectory).windows)?obj(c.priceTrajectory).windows:[];
  const daily=windows.find((x:any)=>x.sessions===1&&x.toDate===asOf),p1=daily?n(daily.returnPct):null;
  const price=obj(o.snapshotPrice),acc=asOf&&price.observedMarketDate===asOf?n(price.acceleration):null;
  const mixed=obj(a.historyQuality).mixedUniverseContext===true;
  // Mixed legacy observations stay available as context, not homogeneous trend confirmation.
  const trendReady=own&&d.complete===true&&!mixed;
  let v20=trendReady?n(d.velocity20):null,v50=trendReady?n(d.velocity50):null;
  const observations=(Array.isArray(a.observations)?a.observations:[]).map(obj)
    .filter((r:Row)=>own&&r.comparable===true&&date(r.date)!==null&&r.date<=asOf!&&n(r.close)!==null)
    .sort((x:Row,y:Row)=>x.date.localeCompare(y.date));
  const obs=[...new Map<string,Row>(observations.map((r:Row)=>[r.date,r] as [string,Row])).values()].slice(-3);
  const current=obs[obs.length-1],prior=obs[obs.length-2];
  const datedPair=obs.length>=2&&current.date===asOf&&current.close===n(c.lastClose);
  if(datedPair&&v50===null&&n(current.b50)!==null&&n(prior.b50)!==null)v50=current.b50-prior.b50;
  if(datedPair&&v20===null&&n(current.b20)!==null&&n(prior.b20)!==null)v20=current.b20-prior.b20;
  const datedVol=obj(g.volatilityDataQuality),vix=date(datedVol.asOfDate)===asOf&&datedVol.available===true?n(obj(g.volatility).vix):null;
  const relation=obj(g.rotationComparison),rs=date(relation.asOfDate)===asOf?n(relation.rsSmall):null;
  const ownRotation=own?s.rotationConfirm:null;
  const pfs=Array.isArray(obj(c.formations).pointFigure)?obj(c.formations).pointFigure:[];
  const confirmedBear=pfs.length? pfs.some((p:any)=>p.currentColumn==='O'&&p.latest?.bias==='BEARISH'&&p.latest?.status==='CONFIRMED'&&p.latest?.confirmationConditionMetNow===true&&!p.latest?.invalidatedAt):null;
  const freshBear=pfs.length?pfs.some((p:any)=>p.latest?.bias==='BEARISH'&&p.latest?.status==='CONFIRMED'&&p.latest?.confirmedAt===asOf&&p.latest?.confirmationConditionMetNow===true&&!p.latest?.invalidatedAt):null;
  const falling=test(p20,x=>x<0),rising=test(p20,x=>x>0),weak=test(half50,x=>x<50),damaged=test(half200,x=>x<50);
  const declining=all(test(v20,x=>x<0),test(v50,x=>x<0)),improving=either(test(v20,x=>x>0),test(v50,x=>x>0));
  const out:RotationCase[]=[];
  function add(number:number,title:string,checks:Array<[string,Truth]>,counterargument:string,applicable=true){
    if(!applicable){out.push({number,title,state:'NOT_APPLICABLE',asOfDate:asOf,facts:[],missing:[],counterargument:'Dieser Fall wird mit eigenen Russell-Daten beurteilt; keine Nasdaq-Daten als Russell-Beleg.'});return;}
    const values=checks.map(x=>x[1]),known=values.filter(x=>x!==null),state:CaseState=!applicable?'NOT_APPLICABLE':!own&&number!==13?'UNKNOWN':values.every(x=>x===true)?'SUPPORTED':values.some(x=>x===false)?'NOT_SUPPORTED':known.some(x=>x===true)?'PARTIAL':'UNKNOWN';
    out.push({number,title,state,asOfDate:asOf,facts:checks.filter(x=>x[1]!==null).map(([key,value])=>key+': '+(value?'erfüllt':'nicht erfüllt')),missing:checks.filter(x=>x[1]===null).map(x=>x[0]),counterargument});
  }
  add(1,'Schmale Hausse',[['20-Intervall-Kursanstieg',rising],['eigene Breite fällt',declining]],'Ein schmal getragener Anstieg kann weiterlaufen; keine automatische Put-Freigabe.');
  add(2,'Frühe Distribution',[['eigene MA50-Breite unter 50 %',weak],['eigene Breite fällt',declining],['eigener 5-Intervall-Impuls höchstens null',test(p5,x=>x<=0)],['eigene negative Beschleunigung',test(acc,x=>x<0)],['eigene bearische Rotationsbestätigung',bear(ownRotation)]],'Erholung oder fehlende Einzelfreigaben können den Put-Ansatz schwächen; kein neuer Timing-Gate.');
  add(3,'Gesunder Rücklauf',[['kurzfristiger Rückgang',test(p5,x=>x<0)],['längerer Kursanstieg',rising],['Mehrheit über MA50',test(half50,x=>x>50)],['Mehrheit über MA200',test(half200,x=>x>50)],['eigene MA50-Breite nicht fallend',test(v50,x=>x>=0)]],'Fortgesetzte Schwäche kann aus dem Rücklauf einen Strukturbruch machen.');
  add(4,'Neue Abwärtsauslösung',[['heute datierte bearische P&F-Auslösung',freshBear],['eigene schwache MA50-Breite',weak]],'Ein alter bestätigter Bruch ist kein neues Ereignis; eine Rückeroberung schwächt die Fortsetzung.');
  add(5,'Rücklauf im Abwärtstrend',[['20-Intervall-Verlust',falling],['letzter Tagesanstieg',test(p1,x=>x>0)],['5-Intervall-Verlust bleibt',test(p5,x=>x<0)],['Anstieg kleiner als 20-Intervall-Verlust',p1!==null&&p20!==null?Math.abs(p1)<Math.abs(p20):null],['bearische P&F-Richtung weiterhin aktiv',confirmedBear]],'Rebound und überlappende Verlustfenster sind keine unabhängigen Beweise; kräftige Erholung ist Put-Gegenrisiko.');
  add(6,'Späte Panik/Überdehnung',[['bereits erfolgter Rückgang',falling],['gemeinsamer VIX über bestehender Panikgrenze 35',test(vix,x=>x>35)],['eigene MA50-Breite unter bestehender Panikgrenze 30',test(half50,x=>x<30)]],'Hoher Stress beweist keinen Boden; neue späte Puts und bestehende Positionen getrennt beurteilen.');
  add(7,'Frühe Erholung trotz Strukturschaden',[['eigener 5-Intervall-Anstieg',test(p5,x=>x>0)],['20-Intervall-Verlust bleibt',falling],['eigene langfristige Breite schwach',damaged],['eigene Breite verbessert sich',improving]],'Erneute Schwäche bleibt Call-Gegenrisiko; Forschung kann frühe Erholung diskutieren, bestehende Ausführungssperren gelten weiter.');
  const three=obs.length===3&&current.date===asOf&&current.close===n(c.lastClose);
  add(8,'Mehrfach beobachtete Erholung',[['steigende eigene Schlusskurse an drei Daten',three?obs[0].close<obs[1].close&&obs[1].close<obs[2].close:null],['eigene MA50-Breite über drei Beobachtungen zunehmend',three&&obs.every(r=>validBreadth(n(r.b50))!==null)?obs[0].b50<obs[1].b50&&obs[1].b50<obs[2].b50:null],['Mehrheit über MA50',test(half50,x=>x>50)],['Mehrheit über MA200',test(half200,x=>x>50)]],'Drei Beobachtungsdaten sind keine bestätigte Folge vollständiger Börsensitzungen und kein validierter Call-Vorteil.');
  add(9,'Echte Small-Cap-Rotation',[['Russell steigt absolut über 5 Intervalle',test(p5,x=>x>0)],['datierter IWM-QQQ-Vergleich über eins',test(rs,x=>x>1)],['eigene Mehrheit über MA50',test(half50,x=>x>50)],['eigene Mehrheit über MA200',test(half200,x=>x>50)],['eigene bullische Rotationsbestätigung',bull(ownRotation)]],'Deskriptiver Aufbau; bestehende strengere Russell-Einstiegsschwellen gelten unverändert.',market==='RUSSELL_2000');
  const otherChart=obj(obj(other).completedChart),other5=date(otherChart.asOfDate)===asOf?n(otherChart.return5SessionsPct):null;
  add(10,'Bloß relatives Besserhalten',[['Russell fällt',test(p5,x=>x<0)],['Nasdaq fällt am selben Datum',test(other5,x=>x<0)],['Russell fällt weniger',p5!==null&&other5!==null?p5>other5:null]],'Weniger Verlust ist kein absoluter Anstieg und kein Russell-Call-Einstieg.',market==='RUSSELL_2000');
  const rotationPair=datedPair&&prior.rotationComparable===true&&current.rotationComparable===true;
  add(11,'Fehlgeschlagene Rotation',[['vorherige eigene bullische Bestätigung bei gleicher Modellversion',rotationPair?bull(prior.rotationConfirm):null],['aktuelle Bestätigung verloren',rotationPair&&typeof current.rotationConfirm==='string'?bull(current.rotationConfirm)===false:null],['eigener Kurs unter vorheriger Beobachtung',datedPair?current.close<prior.close:null]],'Ein schlechterer Summenscore allein belegt keinen Fehlstart; ein neuer Auslöser benötigt Datum und eigene Messung.');
  const groups=Array.isArray(obj(o.cotFacts).groups)?obj(o.cotFacts).groups:[];
  const cotConflicts=groups.filter((r:any)=>date(r.observationDate)!==null&&asOf!==null&&r.observationDate<=asOf&&Date.parse(asOf)-Date.parse(r.observationDate)<=14*86400000).map((r:any)=>{
    const changes=Array.isArray(r.changes)?r.changes:[],one=sign(changes.find((x:any)=>x.weeks===1)?.delta),long=changes.filter((x:any)=>[4,13].includes(x.weeks)).map((x:any)=>sign(x.delta));
    return one!==null&&one!==0&&long.some((x:any)=>x!==null&&x!==0&&x!==one);
  });
  const horizonConflict=p5!==null&&p20!==null?p5*p20<0:null,breadthConflict=v20!==null&&v50!==null?v20*v50<0:null;
  add(12,'Gemischter Markt',[['Preisfenster, Breitenverläufe oder COT-Horizonte widersprechen sich',either(horizonConflict,breadthConflict,cotConflicts.length?cotConflicts.some(Boolean):null)]],'Widerspruch ist kein automatischer Richtungswechsel. Nettozustand und Nettoänderung bleiben getrennt.');
  add(13,'Unzureichende/zeitlich gemischte Daten',[['mindestens eine relevante Datenbegrenzung',!own||half50===null||half200===null||p5===null||p20===null||mixed||d.complete!==true]],'Unbekannt ist weder neutral noch Bestätigung. Gemischte alte Historie bleibt Kontext, keine homogene Kalibrierung.');
  return out;
}

export function rotationCaseFindings(market:string,index:unknown,shared:unknown,other:unknown):DomainFinding[]{
  const cases=rotationCaseAssessment(market,index,shared,other),prefix=market==='NASDAQ'?'N-F':'R-F';
  const findings:DomainFinding[]=cases.map(c=>({id:`${prefix}-CASE-${c.number}`,domain:'CONTEXT',asOfDate:c.asOfDate,sourceRefs:['APP',`CHART_${market}`],text:`Fall ${c.number} ${c.title}: ${stateText[c.state]}. ${c.facts.join('; ')}. Fehlend: ${c.missing.join(', ')||'keine gelistete Prüfung'}. Gegenargument: ${c.counterargument} Deskriptive Regelprüfung, keine neue Phase, Wahrscheinlichkeit oder Einstiegserlaubnis.`}));
  const selected=cases.filter(c=>c.number!==13&&c.state==='SUPPORTED').slice(0,2),partial=selected.length?[]:cases.filter(c=>c.number!==13&&c.state==='PARTIAL').slice(0,1),limited=cases[12].state==='SUPPORTED';
  const focused=[...selected,...partial];
  const prompt=focused.length?`13 Fälle: ${cases.filter(c=>c.state==='SUPPORTED').length} gestützt, ${cases.filter(c=>c.state==='PARTIAL').length} teilweise, ${cases.filter(c=>c.state==='UNKNOWN').length} unbekannt. ${focused.map(c=>`${c.number} ${c.title}: ${stateText[c.state]}${c.missing.length?' (fehlt: '+c.missing[0]+')':''}`).join('; ')}. ${limited?'Daten fehlen/sind gemischt. ':''}Keine Einstiegserlaubnis.`:`13 Fälle geprüft. ${limited?'Daten fehlen/sind gemischt.':'Kein gestütztes Kursszenario.'} Keine Einstiegserlaubnis.`;
  findings.push({id:`${prefix}-CASE-SUMMARY`,domain:'CONTEXT',asOfDate:cases[0].asOfDate,sourceRefs:['APP',`CHART_${market}`],text:cases.map(c=>`${c.number} ${c.title}: ${stateText[c.state]}`).join('; '),promptText:prompt});
  return findings;
}
