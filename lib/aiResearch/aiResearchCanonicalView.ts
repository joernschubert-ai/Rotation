import type {prepareContextTrial} from './aiResearchContextTrial';
type Prepared=ReturnType<typeof prepareContextTrial>;
/** Default presentation contains app facts and validated model choices, never generated factual prose. */
export function buildCanonicalContextView(p:Prepared,rows:Array<Record<string,any>>=[],pairing:'UNPROVEN_RAW'|'MATCHED_REQUEST'='UNPROVEN_RAW'){
 const source=(id:string)=>{const f=p.context.byId.get(id);return f?{id:f.id,market:f.market,domain:f.domain,asOf:f.asOf,status:f.status,text:f.text}:null;};
 const stamp=Date.parse(p.context.facts.snapshotTimestamp);
 const states=p.context.facts.facts.filter(f=>/^[NR]-F-(?:CLOSE|MA20|MA50|MA200|BREADTH|PHASE|PF[01]-(?:LAST|FORM|ADV)|PRICE-MISSING|COT-MISSING|PNF-MISSING)$/.test(f.id)&&f.asOf!==null&&Number.isFinite(Date.parse(f.asOf))&&Date.parse(f.asOf)<=stamp);
 return {version:'APP_CANONICAL_CONTEXT_V1',snapshotTimestamp:p.context.facts.snapshotTimestamp,origin:'APP_FACTS_AND_VALIDATED_SOURCE_CHOICES',domainContextStatus:p.appContext.status,appContextFrameBasis:p.appContextFrameBasis,
  markets:p.appContext.markets.map(m=>({market:m.market,priceAndStructure:states.filter(f=>f.market===m.market).map(f=>source(f.id)),
   domainSources:m.sources.map(s=>source(s.id)),historyBounds:m.boundaries.history,groupLimit:m.boundaries.groupLimit,
   missingGroups:m.missingGroups,excludedSources:m.excludedSources,reading:p.appReadings.markets.find(r=>r.market===m.market)??null})),
  instruments:rows.map(row=>({instrument:row.instrument,supports:row.supports.map((s:any)=>source(s.id)),opposes:row.opposes.map((s:any)=>source(s.id)),
   counterRisk:row.counterRisk,changeCondition:row.changeCondition,
   selectionMeaning:'Modell wählt Quellen und offene Referenz; Sachtexte stammen aus der App. Keine kalibrierte Gewichtung, unabhängige Stimmenzählung oder automatische Richtungsvorhersage.'})),
  selectionAvailable:rows.length>0,sourceChoiceProvenance:rows.length?pairing:'NO_MODEL_SELECTION',displayedModelFactProse:false,freeSynthesisAccepted:false,entryPermission:'NOT_DERIVED',semanticTruthVerified:false,
  limitation:'Diese Ansicht verhindert die Übernahme freier Modellbehauptungen als App-Fakten. Sie ersetzt keine verifizierte Gesamtprognose.'};
}
