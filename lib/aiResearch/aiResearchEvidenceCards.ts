import { buildResearchConcepts } from './aiResearchConcepts';
import { cotGroupCard } from './aiResearchCOTSemantics';
type Row=Record<string,any>;
const obj=(v:unknown):Row=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Row:{};
const rows=(v:unknown):Row[]=>Array.isArray(v)?v.map(obj):[];
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
function day(v:unknown):v is string {if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const n=Date.parse(v+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===v;}
export interface EvidenceCard {id:string;sourceRefs:string[];asOfDate:string;kind:'OBSERVED'|'HISTORICAL_CONTEXT'|'POSITIONING_CONTEXT'|'PNF_CONTEXT'|'FUTURE_CONDITION';
  effect:'DIRECTIONAL_SUPPORT'|'DIRECTIONAL_COUNTER'|'CONTEXT_ONLY'|'WOULD_STRENGTHEN'|'WOULD_WEAKEN';text:string;details:Row;}
/** Categories express dated facts and conditional direction only; no score or thesis. */
export function buildEvidenceCards(input:unknown){
  const data=obj(input),concepts=buildResearchConcepts(data);
  const instruments=(['NASDAQ_PUT','NASDAQ_CALL','RUSSELL_CALL'] as const).map(instrument=>{
    const put=instrument==='NASDAQ_PUT',market=instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ',prefix=market==='NASDAQ'?'N-F':'R-F';
    const own=obj(obj(data.indices)[market]),chart=obj(own.completedChart),date=chart.asOfDate,close=chart.lastClose,cards:EvidenceCard[]=[],omissions:string[]=[];
    const effect=(up:boolean)=>up!==put?'DIRECTIONAL_SUPPORT' as const:'DIRECTIONAL_COUNTER' as const;
    if(day(date)&&finite(close)&&close>0){
      const seen=new Set<number>();
      for(const m of rows(chart.averages)){
        if(![20,50,200].includes(m.period)||seen.has(m.period)||!finite(m.average)||m.average<=0)continue;seen.add(m.period);
        cards.push({id:`${prefix}-MA${m.period}`,sourceRefs:['CHART_'+market],asOfDate:date,kind:'OBSERVED',effect:close===m.average?'CONTEXT_ONLY':effect(close>m.average),
          text:`Beobachtet: Schluss ${close} ${close>m.average?'über':close<m.average?'unter':'auf'} MA${m.period} ${m.average}. Zahlenrelation, kein neuer Bruch oder Wendebeweis.`,details:{close,period:m.period,average:m.average}});
      }
      for(const c of concepts.indices[market]?.conditions??[]){
        if(c.role!=='REFERENCE'||c.state!=='OPEN'||!finite(c.price)||c.price<=0)continue;
        // Recheck against actual close; no already fulfilled condition is future evidence.
        if(c.direction==='UP'?close>c.price:close<c.price)continue;
        cards.push({id:c.id,sourceRefs:['CHART_'+market],asOfDate:date,kind:'FUTURE_CONDITION',effect:(c.direction==='UP')!==put?'WOULD_STRENGTHEN':'WOULD_WEAKEN',
          text:`Noch offen: Schluss ${c.direction==='UP'?'über':'unter'} ${c.price} (${c.label}). Würde die ${put?'Put':'Call'}-Idee richtungsbezogen ${(c.direction==='UP')!==put?'stärken':'schwächen'}; kein bereits beobachteter Pro-Befund und keine notwendige Schwelle jeder frühen Gegenidee.`,details:{direction:c.direction,price:c.price,role:c.role,state:c.state}});
      }
    }else omissions.push('Kein gültiger datierter Schluss: keine aktuellen MA-Befunde oder zukünftigen Preisreferenzen zugeordnet.');
    for(const [i,g] of rows(obj(own.cotFacts).groups).entries()){
      if(!day(g.observationDate)){omissions.push('COT-Gruppe ohne gültiges Beobachtungsdatum ausgelassen.');continue;}
      const c=cotGroupCard(g);
      cards.push({id:`${prefix}-COT${i}`,sourceRefs:['COT_'+market],asOfDate:g.observationDate,kind:'POSITIONING_CONTEXT',effect:'CONTEXT_ONLY',text:c.text,
        details:{group:c.group,net:c.net,state:c.state,changes:c.changes,conflictPairs:c.conflicts.map(w=>({leftWeeks:1,rightWeeks:w})),publicationTime:null}});
    }
    for(const [i,h]of rows(own.historicalStudies).entries()){
      const s=obj(h.focus20D);if(h.currentMatch!==true||!day(h.asOfDate)||!day(date)||h.asOfDate!==date||!finite(s.meanPct))continue;
      cards.push({id:`${prefix}-H${i}`,sourceRefs:['HISTORY_'+market],asOfDate:h.asOfDate,kind:'HISTORICAL_CONTEXT',effect:'CONTEXT_ONLY',
        text:`Historischer Kontext: ${h.family??'Studie'}, folgende 20 Sitzungen nach früheren Fällen, Indexmittel ${s.meanPct} %. Kein heutiger Impuls oder Optionsgewinn.`,
        details:{family:h.family,meanPct:s.meanPct,baselineMeanPct:s.baselineMeanPct??null,p10Pct:s.p10Pct??null,p90Pct:s.p90Pct??null,
          sampleSize:s.sampleSize??null,nonOverlappingCount:s.nonOverlappingCount??null,directionalContext:s.meanPct===0?'NEUTRAL':(s.meanPct>0)!==put?'FAVOURABLE_HISTORICAL':'ADVERSE_HISTORICAL'}});
    }
    for(const f of concepts.indices[market]?.findings??[]){
      if(f.domain!=='PNF'||!day(f.asOfDate))continue;
      cards.push({id:f.id,sourceRefs:f.sourceRefs,asOfDate:f.asOfDate,kind:'PNF_CONTEXT',effect:'CONTEXT_ONLY',text:f.promptText??f.text,details:{classification:'EXISTING_DOMAIN_FINDING_NOT_AUTOMATIC_VOTE'}});
    }
    return {instrument,market,cards,observedSupport:cards.filter(c=>c.kind==='OBSERVED'&&c.effect==='DIRECTIONAL_SUPPORT').map(c=>c.id),
      observedCounter:cards.filter(c=>c.kind==='OBSERVED'&&c.effect==='DIRECTIONAL_COUNTER').map(c=>c.id),
      futureConditions:cards.filter(c=>c.kind==='FUTURE_CONDITION').map(c=>c.id),omissions};
  });
  return {version:'EVIDENCE_CARDS_V1',instruments,limitations:[
    'MA-Richtung ist eine datierte Zahlenrelation, keine kalibrierte Prognose. Keine Abstimmung oder Addition der Karten.',
    'Historie, COT und P&F bleiben eigenständiger Kontext; fehlende Bodenbestätigung wird nicht als beobachtetes Pro oder Contra klassifiziert.',
    'Leere Liste beobachteter MA-Pro-Befunde bedeutet nur: kein Pro in dieser begrenzten Kategorie; keine Widerlegung jeder frühen These.',
    'Historischer Kontext, COT und Preisindikatoren können abhängig sein. Keine Optionsrendite oder Handelsfreigabe.',
    'Diese erste Schicht klassifiziert MA-Relationen; sie ist keine vollständige Liste aller Marktargumente.'
  ]};
}
