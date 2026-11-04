type Fact={id:string;market:string;domain:string;status:string;asOf:string|null;text:string;values:Record<string,any>};
type Direction='UP'|'DOWN';
const obj=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const sign=(v:unknown):Direction|null=>finite(v)&&v!==0?v>0?'UP':'DOWN':null;
const flip=(v:Direction):Direction=>v==='UP'?'DOWN':'UP';
const unique=<T>(v:T[])=>[...new Set(v)];
const RULES=[
 'P&F: HISTORICAL_PATTERN ist nur historische Musterwirkung. CURRENT_COLUMN beschreibt nur die aktuelle Säule. CURRENT_TRIGGER beschreibt nur die aktuelle Preisbedingung. Keine dieser Facetten bestätigt allein einen heutigen Trend oder eine neue Auslösung; keine drei unabhängigen Stimmen.',
 'P&F FORMING ist unbestätigt. Ein alter Trigger kann trotz gegenläufiger Säule erfüllt sein. Eine gegenläufige Säule relativiert die Fortsetzung des alten Musters; sie ist weder neue Gegenformation noch sichere Trendwende.',
 'COT: Nettozustand und jede Wochenänderung getrennt, Gruppen nicht vermischen. Bestand/Änderung begründen für sich keine Preisrichtung; weniger netto short ist nicht netto long. Keine Bruttotransaktionen oder Motive ergänzen.',
 'Historie: Absolutes Folgeindexmittel, Basisvergleich, Streuung und aktueller Zustandsabgleich sind getrennt. Positives Mittel ist möglicher Erholungskontext, kein Beleg für weitere Verluste; kein heutiger Impuls oder nachgewiesener Prognosevorteil.',
 'Preisreferenz: Eine offene Rückeroberung ist nur eine mögliche spätere Stärkung, kein heutiger Unterstützungsbeleg. Bereits vorhandene MA-Relation ist kein neuer Bruch. MA-Relation beweist weder Steigung noch tragfähige Unterstützung.',
 'Gegenargument muss die gewählte Indexrichtung belasten. Eine frühe Gegenhypothese darf vor einer entfernten Musterwiderlegung bestehen. ABSTAIN bleibt möglich. Kein App-Mehrheitsurteil aus gezählten oder überlappenden Belegen.',
 'Nachrichten und gemeinsame Risiken nur in gelieferter Belegtiefe. Überschrift ist keine bewiesene Ursache. Fehlende oder widersprüchliche Felder bleiben unbekannt. Keine neuen Kennungen aus diesem Zusatz wählen; bestehende Auswahlregeln gelten unverändert.'
];
/** Only canonical app-emitted fields are adapted. Unknown/conflicting wording never acquires a direction. */
function pattern(f:Fact){
 const german=[...f.text.matchAll(/,\s*(bullisch|bearisch),\s*(CONFIRMED|FORMING)\b/gi)].map(m=>m[1].toLowerCase()==='bullisch'?'UP' as const:'DOWN' as const);
 const english=[...f.text.matchAll(/\bRichtung (BULLISH|BEARISH),/g)].map(m=>m[1]==='BULLISH'?'UP' as const:'DOWN' as const);
 const directions=unique([...german,...english]);const historicalDirection=directions.length===1?directions[0]:null;
 const forming=/\bFORMING\b/.test(f.text),confirmed=/\bCONFIRMED\b/.test(f.text);
 const against=/Säule gegenläufig\.|\bCOUNTER_TO_CURRENT_COLUMN\b/.test(f.text),aligned=/Säule gleichgerichtet\.|\bALIGNED_WITH_CURRENT_COLUMN\b/.test(f.text);
 const columnRelation=against===aligned?'UNKNOWN':against?'COUNTER':'ALIGNED';
 const columnDirection=historicalDirection&&against!==aligned?against?flip(historicalDirection):historicalDirection:null;
 const triggers=unique([...f.text.matchAll(/(?:Bedingung|Trigger) jetzt (true|false)\./g)].map(m=>m[1]==='true'));
 return {historicalDirection,status:forming&&confirmed?'UNKNOWN':forming?'FORMING':confirmed?'HISTORICALLY_CONFIRMED':'UNKNOWN',columnRelation,columnDirection,currentConditionSatisfied:triggers.length===1?triggers[0]:null,freshSignalProven:false,currentTrendProven:false};
}
export function buildScenarioEvidenceFrame(facts:Fact[],snapshot:string){
 if(!Number.isFinite(Date.parse(snapshot)))throw Error('SCENARIO_MEANING_FRAME');
 const usable=facts.filter(f=>['NASDAQ','RUSSELL_2000','SHARED'].includes(f.market)&&f.status!=='MISSING'&&f.asOf!==null&&Number.isFinite(Date.parse(f.asOf))&&Date.parse(f.asOf)<=Date.parse(snapshot));
 const rows=usable.flatMap<Record<string,any>>(f=>{
  const base={sourceId:f.id,market:f.market,asOf:f.asOf};const v=obj(f.values);
  if(/^[NR]-F-PF[01]-(?:LAST|FORM|ADV)$/.test(f.id))return [{...base,kind:'PNF_FACETS',...pattern(f)}];
  if(/^[NR]-F-MA(?:20|50|200)$/.test(f.id))return [{...base,kind:'PRICE_RELATION',relation:['ABOVE','BELOW','AT'].includes(v.relation)?v.relation:'UNKNOWN',descriptiveDirection:v.relation==='ABOVE'?'UP':v.relation==='BELOW'?'DOWN':null,trendOrSupportProven:false}];
  if(f.domain==='COT'&&/^[NR]-F-COT\d+$/.test(f.id)){
   const net=finite(v.net)?v.net:null;
   const changes=(Array.isArray(v.changes)?v.changes:[]).filter(c=>finite(c.weeks)&&[1,4,13,26,52].includes(c.weeks)).map(c=>({weeks:c.weeks,delta:finite(c.delta)?c.delta:null,shift:sign(c.delta),netAfterChange:net}));
   return [{...base,kind:'POSITIONING_ONLY',group:['LEVERAGED_MONEY','ASSET_MANAGER'].includes(v.group)?v.group:'UNKNOWN',net,state:net===null?'UNKNOWN':net>0?'NET_LONG':net<0?'NET_SHORT':'FLAT',changes,priceDirectionProven:false}];
  }
  if(f.domain==='Historische Vergleiche'&&/^[NR]-F-H\d+$/.test(f.id)){
   const s=obj(v.statistics),mean=finite(s.meanPct)?s.meanPct:null,baseline=finite(s.baselineMeanPct)?s.baselineMeanPct:null;
   return [{...base,kind:'HISTORICAL_CONTEXT_ONLY',currentMatch:typeof v.currentMatch==='boolean'?v.currentMatch:null,meanPct:mean,absoluteMeanDirection:sign(mean),baselineMeanPct:baseline,versusBaseline:mean===null||baseline===null?'UNKNOWN':mean>baseline?'ABOVE':mean<baseline?'BELOW':'EQUAL',predictiveEdgeProven:false}];
  }
  return [];
 });
 return {version:'SCENARIO_MEANING_FRAME_V1',snapshot,rows,rules:RULES,automaticDirectionDecision:false,sourceFactsChanged:false};
}
export function scenarioMeaningInstruction(frame:ReturnType<typeof buildScenarioEvidenceFrame>){
 // Compact projections supplement the canonical input; never replace or repair its sources.
 const columns:Record<string,string[]>={PNF_FACETS:['sourceId','historicalDirection','status','columnRelation','columnDirection','currentConditionSatisfied'],PRICE_RELATION:['sourceId','relation'],POSITIONING_ONLY:['sourceId','group','net','state','changes'],HISTORICAL_CONTEXT_ONLY:['sourceId','currentMatch','meanPct','baselineMeanPct','versusBaseline']};
 const packed=Object.fromEntries(Object.entries(columns).map(([kind,keys])=>[kind,{columns:keys,rows:frame.rows.filter(r=>r.kind===kind).map(r=>keys.map(k=>k==='changes'?r.changes.map((c:any)=>[c.weeks,c.delta,c.shift]):r[k]))}]));
 const text='\nAPP_BEDEUTUNGSRAHMEN_V1: '+JSON.stringify({version:frame.version,changesColumns:['weeks','delta','shift'],facts:packed,rules:frame.rules});
 if(text.length>10000)throw Error('SCENARIO_MEANING_BUDGET');return text;
}
export function reviewScenarioMeaning(scenarios:unknown[],facts:Fact[],snapshot:string){
 const frame=buildScenarioEvidenceFrame(facts,snapshot),findings:Array<{market:string;field:string;code:string;quote:string;sourceIds:string[];explanation:string}>=[];
 const add=(market:string,field:string,code:string,quote:string,sourceIds:string[],explanation:string)=>findings.push({market,field,code,quote,sourceIds,explanation});
 for(const raw of scenarios){const s=obj(raw);if(!['NASDAQ','RUSSELL_2000'].includes(s.market))continue;
  for(const field of ['reason','counterargument']){if(typeof s[field]!=='string')continue;
   for(const sentence of s[field].split(/(?<=[.!?])\s+|\n/)){
    const ids=unique([...sentence.matchAll(/\b([NR]-F-[A-Z0-9-]+)\b/g)].map(m=>m[1]));
    const refs=frame.rows.filter(f=>f.market===s.market&&ids.includes(f.sourceId));
    const pnf=refs.filter(f=>f.kind==='PNF_FACETS');
    const hypothetical=/\b(?:wäre|würde|könnte|falls|wenn)\b/i.test(sentence);
    const negated=/\b(?:kein\w*|nicht|ohne)\b[^.!?]{0,35}(?:bestätigt|beweist|garantiert)/i.test(sentence);
    if(pnf.length&&!negated&&!hypothetical&&/\b(?:bullisch\w*|bearisch\w*|alter?|aktuell\w*)\s+Trend\s+(?:ist\s+|bleibt\s+)?bestätigt\b/i.test(sentence))add(s.market,field,'PATTERN_IS_NOT_CONFIRMED_TREND',sentence,pnf.map(f=>f.sourceId),'Die referenzierten P&F-Facetten bestätigen keinen aktuellen Trend. Historischen Musterstatus und heutigen Trend nicht gleichsetzen.');
    if(pnf.length&&!negated&&!hypothetical&&!/(?:kein|nicht|ohne)\s+(?:frisches|neues|heutiges)/i.test(sentence)&&/(?:frisches|neues|heutiges)\s+(?:bullisches\s+|bearisches\s+)?(?:P&F[- ]Signal|P&F[- ]Ausbruch|Signal)/i.test(sentence))add(s.market,field,'FRESH_SIGNAL_NOT_PROVEN',sentence,pnf.map(f=>f.sourceId),'Aus historischen Musterfacetten folgt keine nachgewiesene Neuauslösung.');
    if(field==='counterargument'&&s.direction==='UP'&&/aktuelle\s+Säule\s+widerspricht\s+historischen\s+P&F-Auslösungen/i.test(sentence)&&pnf.length&&pnf.every(f=>obj(f).historicalDirection==='DOWN'&&obj(f).columnRelation==='COUNTER'))add(s.market,field,'COUNTERARGUMENT_COLUMN_EFFECT',sentence,pnf.map(f=>f.sourceId),'Die gegenläufige Säule relativiert hier die alten bearischen Muster. Dieser Teilsatz allein belastet UP nicht; alte bearische Musterwirkung separat betrachten.');
    if(!negated&&!/\b(?:nicht|kein\w*)\b/i.test(sentence)&&/O[- ]Säule[^.!?]{0,45}(?:bestätigt|beweist)[^.!?]{0,35}(?:Boden|Aufwärtswende)/i.test(sentence))add(s.market,field,'O_COLUMN_NOT_BOTTOM_PROOF',sentence,pnf.map(f=>f.sourceId),'Eine O-Säule allein ist kein bestätigter Boden.');
    const cot=refs.filter(f=>f.kind==='POSITIONING_ONLY');
    if(cot.length===1){const f=obj(cot[0]);if((f.state==='NET_SHORT'&&/\b(?:ist|bleibt|weiterhin)\s+netto[- ]long\b/i.test(sentence))||(f.state==='NET_LONG'&&/\b(?:ist|bleibt|weiterhin)\s+netto[- ]short\b/i.test(sentence)))add(s.market,field,'COT_NET_STATE_CONTRADICTION',sentence,[f.sourceId],'Die ausdrücklich genannte Nettoposition widerspricht dem gelieferten Bestand. Änderungsrichtung getrennt halten.');}
    if(cot.length&&!negated&&/(?:beweist|garantiert)[^.!?]{0,40}(?:Kursanstieg|Kursrückgang|steigende Kurse|fallende Kurse)/i.test(sentence))add(s.market,field,'COT_IS_NOT_PRICE_PROOF',sentence,cot.map(f=>f.sourceId),'COT-Bestand und Nettoänderung beweisen keine künftige Preisrichtung.');
    const history=refs.filter(f=>f.kind==='HISTORICAL_CONTEXT_ONLY');
    if(history.some(f=>obj(f).currentMatch===false)&&/(?:aktueller Zustandsabgleich|aktuell passend|entspricht dem aktuellen Zustand)/i.test(sentence))add(s.market,field,'HISTORY_MATCH_NOT_CURRENT',sentence,history.filter(f=>obj(f).currentMatch===false).map(f=>f.sourceId),'Geliefert ist currentMatch=false. Kein aktueller Zustandsabgleich belegt.');
    if(field==='reason'&&s.direction==='DOWN'&&history.some(f=>obj(f).absoluteMeanDirection==='UP')&&/(?:historisch\w*|Mittelwert|Studie)[^.!?]{0,65}(?:stützt|belegt|bestätigt)[^.!?]{0,30}(?:Abwärts|Verluste|Schwäche)|(?:Abwärts|Verluste|Schwäche)[^.!?]{0,50}gestützt\s+durch\s+(?:die\s+)?(?:historisch\w*|Studie)/i.test(sentence)&&!negated)add(s.market,field,'POSITIVE_HISTORY_NOT_DOWN_PROOF',sentence,history.filter(f=>obj(f).absoluteMeanDirection==='UP').map(f=>f.sourceId),'Positives historisches Folgeindexmittel ist möglicher Erholungskontext, kein Beleg für weitere Verluste. Basisvergleich ist separat.');
    if(field==='reason'&&typeof s.monitorConditionId==='string'&&ids.includes(s.monitorConditionId)&&/(?:spricht für|stützt die|Argument für)[^.!?]{0,100}(?:offene|noch ausstehende|Hoffnung auf|Möglichkeit einer Rückkehr)/i.test(sentence))add(s.market,field,'OPEN_REFERENCE_NOT_PRESENT_EVIDENCE',sentence,[s.monitorConditionId],'Die noch offene Referenz kann ein Szenario künftig stärken; sie ist selbst kein bereits beobachteter Unterstützungsbeleg.');
   }
  }
 }
 return {version:'SCENARIO_MEANING_REVIEW_V1',status:findings.length?'REVIEW_REQUIRED':'NO_COVERED_ISSUES_FOUND',findings,appFrame:frame,readOnly:true,modelRequestsUsed:0,memoryWritten:false,originalChanged:false,forecastChanged:false,semanticTruthVerified:false,predictiveQualityVerified:false,scope:'Eng begrenzte explizite deutsche Aussagen zu P&F-Trend/Frischesignal/Säule, COT-Nettozustand/Preisbeweis, Historienabgleich/-richtung und offenen Referenzen. Mehrdeutige Aussagen oder mehrere COT-Gruppen werden nicht automatisch aufgelöst. Keine vollständige Semantik-, Gewichtungs- oder Prognoseprüfung; keine Hinweise sind keine Freigabe. Reine Lesehinweise, keine nachträgliche Originalablehnung.'};
}
