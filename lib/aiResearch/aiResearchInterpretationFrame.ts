import { cotGroupCard } from './aiResearchCOTSemantics';
export interface InterpretationCard {id:string;kind:'COT'|'HISTORY'|'PNF';asOfDate:string|null;text:string;}
export interface InstrumentFrame {id:string;instrument:string;text:string;promptText:string;}
export interface InterpretationFrame {version:'INTERPRETATION_FRAME_V65';indices:Array<{market:string;cards:InterpretationCard[]}>;instruments:InstrumentFrame[];}
const num=(x:unknown):number|null=>typeof x==='number'&&Number.isFinite(x)?x:null;
const fmt=(x:unknown)=>num(x)===null?'unbekannt':String(Number((x as number).toFixed(3)));
/** Source-derived explanatory context; no overall direction, score, entry or model call. */
export function buildInterpretationFrame(data:any,indices:Record<string,any>):InterpretationFrame{
 const result:InterpretationFrame={version:'INTERPRETATION_FRAME_V65',indices:[],instruments:[]};
 for(const market of ['NASDAQ','RUSSELL_2000']){
  const own=data?.indices?.[market]??{},concept=indices[market],prefix=market==='NASDAQ'?'N-F':'R-F',cards:InterpretationCard[]=[];
  for(const [i,g]of (Array.isArray(own.cotFacts?.groups)?own.cotFacts.groups:[]).entries()){
   const c=cotGroupCard(g),h=c.changes.filter(x=>[1,4,13].includes(x.weeks));
   cards.push({id:`${prefix}-COT${i}`,kind:'COT',asOfDate:typeof g.observationDate==='string'?g.observationDate:null,text:`${c.group}: ${c.state}, netto ${fmt(c.net)} Kontrakte. ${h.map(x=>`${x.weeks}W: ${x.meaning} (${fmt(x.delta)})`).join('; ')}. ${c.conflicts.length?`Horizontkonflikt ausschließlich 1W gegen ${c.conflicts.map(w=>w+'W').join('/')}.`:'Kein belegter 1W-vs-4/13W-Konflikt; fehlend/null ist keine Bestätigung.'} Positionsverschiebung, keine automatische Kursrichtung oder Bruttotransaktion.`});
  }
  for(const [i,h]of (Array.isArray(own.historicalStudies)?own.historicalStudies:[]).entries()){
   if(h.currentMatch!==true)continue;
   const s=h.focus20D??{},mean=num(s.meanPct),p10=num(s.p10Pct),p90=num(s.p90Pct);
   const meaning=mean===null?'Richtungsbezug unbekannt':mean>0?'positives historisches Indexmittel: Put-Gegenargument, möglicher Call-Kontext':mean<0?'negatives historisches Indexmittel: Call-Gegenargument, möglicher Put-Kontext':'historisches Mittel null: kein Richtungsbezug';
   cards.push({id:`${prefix}-H${i}`,kind:'HISTORY',asOfDate:typeof h.asOfDate==='string'?h.asOfDate:null,text:`${h.family??'Studie'}, Zustand abgeglichen: 20 Sitzungen NACH FRÜHEREN Vergleichsfällen, Mittel ${fmt(mean)} %, Basis ${fmt(s.baselineMeanPct)} %, p10/p90 ${fmt(p10)}/${fmt(p90)} %. ${meaning}. ${p10!==null&&p90!==null&&p10<0&&p90>0?'Untere Quantile negativ, obere positiv. ':''}n=${fmt(s.sampleSize)}, nichtüberlappend ${fmt(s.nonOverlappingCount)}. Nicht letzte 20 Sitzungen; kein heutiger Impuls oder Optionsgewinn.`});
  }
  for(const f of concept?.findings??[])if(f.domain==='PNF'&&/-PF[01]-(LAST|FORM|COLUMN)$/.test(f.id))cards.push({id:f.id,kind:'PNF',asOfDate:f.asOfDate,text:f.promptText??f.text});
  result.indices.push({market,cards});
  for(const put of market==='NASDAQ'?[true,false]:[false]){
   const up=(concept?.conditions??[]).filter((c:any)=>c.role==='REFERENCE'&&c.state==='OPEN'&&c.direction==='UP').sort((a:any,b:any)=>a.price-b.price).slice(0,2);
   const down=(concept?.conditions??[]).filter((c:any)=>c.role==='REFERENCE'&&c.state==='OPEN'&&c.direction==='DOWN').sort((a:any,b:any)=>b.price-a.price).slice(0,2);
   const favorable=put?down:up,adverse=put?up:down,instrument=market==='NASDAQ'?(put?'NASDAQ_PUT':'NASDAQ_CALL'):'RUSSELL_CALL';
   result.instruments.push({id:`${prefix}-FRAME-${put?'PUT':'CALL'}`,instrument,promptText:`${instrument}: günstig ${put?'fallender':'steigender'} Index, Gegenrisiko ${put?'Erholung':'weitere Schwäche'}. Günstige offene Referenzen ${favorable.map((c:any)=>c.id).join('/')||'fehlen'}, ungünstige ${adverse.map((c:any)=>c.id).join('/')||'fehlen'}. Kein Gesamturteil/Optionswert.`,text:`${put?'Put':'Call'}: ${put?'fallender':'steigender'} eigener Index richtungsbezogen günstig. Gegenrisiko: ${put?'Erholung':'weitere Schwäche'}. Günstige offene Referenzen: ${favorable.map((c:any)=>`${c.direction} ${fmt(c.price)} (${c.label}, ${c.id})`).join('; ')||'nicht geliefert'}. Ungünstige offene Referenzen: ${adverse.map((c:any)=>`${c.direction} ${fmt(c.price)} (${c.label}, ${c.id})`).join('; ')||'nicht geliefert'}. Bedingte Richtungswirkung, kein Einstieg oder berechneter Optionswert. Frühe Gegenidee darf mit anderen Belegen bestehen.`});
  }
 }
 return result;
}
