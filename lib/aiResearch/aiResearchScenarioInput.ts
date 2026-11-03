import {prepareWeighting} from './aiResearchBoundWeighting';
import {digest,object,unpackMemoryRecord,type makeMemoryRecord} from './aiResearchMemoryProtocol';

/** Reuses the accepted V7/V8 canonical projection. No run/save/cache functions are invoked. */
export function prepareScenarioInput(entry:ReturnType<typeof makeMemoryRecord>){
 const original=unpackMemoryRecord(entry),facts=object(object(original).report).appFacts;
 if(!entry.meta.eligibleForForecast||!['SOURCE_SELECTION','FACTS_ONLY'].includes(entry.meta.kind)||!facts||digest(facts)!==entry.meta.factsHash||facts.snapshotTimestamp!==entry.meta.snapshotTimestamp)throw Error('SCENARIO_SOURCE_FRAME');
 const p=prepareWeighting(original),user=p.weightingRequest.body.messages[1].content;
 if(p.factsHash!==entry.meta.factsHash||user.length>26000)throw Error('SCENARIO_COMPACT_FRAME_OR_BUDGET');
 const sourceLines=user.split('\n').flatMap(line=>{const id=/^\[([^\]]+)\]/.exec(line)?.[1];return id?[{id,line}]:[];});
 if(new Set(sourceLines.map(s=>s.id)).size!==sourceLines.length||p.observedIds.some(id=>!sourceLines.some(s=>s.id===id)))throw Error('SCENARIO_CANONICAL_SOURCE_LOSS');
 const roleFor=(market:string,direction:string)=>{
  const instrument=market==='NASDAQ'&&direction==='DOWN'?'NASDAQ_PUT':market==='NASDAQ'?'NASDAQ_CALL':'RUSSELL_CALL';
  const row=p.eligible.find(r=>r.instrument===instrument)!;
  const reverse=market==='RUSSELL_2000'&&direction==='DOWN';
  return {market,direction,instrumentBasis:instrument,sideProjection:reverse?'INVERT_CALL_CONTEXT':'SAME_CONTEXT',either:row.either,supports:reverse?row.opposes:row.supports,opposes:reverse?row.supports:row.opposes};
 };
 const directionalPermissions=['NASDAQ','RUSSELL_2000'].flatMap(market=>['UP','DOWN'].map(direction=>roleFor(market,direction)));
 const contextIds=[...new Set([...p.neutralIds,...p.observedIds])].filter(id=>{const f=p.context.byId.get(id);return !!f&&f.domain!=='Preisbedingungen'&&f.status!=='MISSING'&&f.asOf!==null&&Number.isFinite(Date.parse(f.asOf))&&Date.parse(f.asOf)<=Date.parse(facts.snapshotTimestamp);});
 return {p,user,directionalPermissions,contextIds,sourceLines,
  publicInput:{version:'SCENARIO_CANONICAL_INPUT_V4',contextReferencePolicy:'CANONICAL_OBSERVATION_REFERENCES_V4',directionalPolicyUnchanged:true,inputCharacters:user.length,limit:26000,remainingCharacters:26000-user.length,canonicalSourceIds:sourceLines.map(s=>s.id),contextIds,directionalPermissions,openConditionIds:[...new Set(p.catalog.eligible.flatMap(r=>r.conditions.map(c=>c.id)))],
   inputPreservation:p.inputPreservation,inputCompaction:p.inputCompaction,appReadings:p.appReadings,domainBoundaries:p.boundaries,temporalGroups:p.temporalGroups,
   originalFactsHash:p.factsHash,originalFactCount:p.context.facts.facts.length,canonicalProjection:true,allRawFactsSent:false,
   preservationScope:'Vollständige Original-AppFacts bleiben im unveränderten Gedächtnis. Modelleingabe ist die vorhandene V7/V8-Katalogprojektion mit allen dortigen Quellenzeilen, umkehrbar gepacktem neutralem Fachkontext, offenen Bedingungen, Grenzen und App-Belegmerkmalen. Keine Gleichsetzung mit verlustfreier Übertragung sämtlicher Rohfelder.',
   directionMapping:'UP verwendet Call-Kontext; Nasdaq DOWN Put-Kontext; Russell DOWN invertiert ausschließlich die direkten Call-Quellenseiten. Kein Russell-Put-Handelsmodell und keine Umkehrung von COT-/Historienkontext.',
   temporalGroupingInModelInput:false,temporalGroupingNote:'Zeitfensterwerte stehen in den Original-Katalogzeilen. Zusätzliche V8-Gruppen werden angezeigt, dem Modell hier nicht zusätzlich als JSON übermittelt.'}};
}


