type Fact={id:string;market:string;domain:string;status:string;asOf:string|null;text:string};
type Finding={market:string;field:string;sourceId:string|null;code:string;quote:string;withhold:true};
type Binding={market:string;field:string;sourceId:string;selectedAs:string[];availableInModelInput:boolean;verified:boolean};
const object=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
// Exact full identifiers only; names, signs and unknown abbreviations are never guessed or repaired.
const reference=/(?<![A-Za-z0-9_-])(?:[NR]-F-|G-|HIST-TEMPORAL-|NEWS[-_]|[NR]-BIND-)[A-Za-z0-9_-]+(?![A-Za-z0-9_-])/g;

/** Checks reference integrity across domains. It does not verify what the cited sentence claims. */
export function auditScenarioReferences(scenarios:unknown[],facts:Fact[],snapshot:string,contextIds:string[],openConditionIds:string[]){
 const findings:Finding[]=[],bindings:Binding[]=[];
 const byId=new Map(facts.map(f=>[f.id,f])),available=new Set(contextIds),open=new Set(openConditionIds),stamp=Date.parse(snapshot);
 if(!Number.isFinite(stamp))throw Error('REFERENCE_AUDIT_INVALID_FRAME');
 for(const raw of scenarios){const s=object(raw);if(!['NASDAQ','RUSSELL_2000'].includes(s.market))continue;
  const roles=new Map<string,string[]>();
  for(const role of ['supports','opposes','contextSources'])if(Array.isArray(s[role]))for(const id of s[role])if(typeof id==='string')roles.set(id,[...(roles.get(id)??[]),role]);
  if(typeof s.monitorConditionId==='string')roles.set(s.monitorConditionId,[...(roles.get(s.monitorConditionId)??[]),'monitorConditionId']);
  for(const field of ['reason','counterargument']){
   if(typeof s[field]!=='string')continue;
   const text=s[field],ids=[...new Set([...text.matchAll(reference)].map(m=>m[0]))];
   const add=(code:string,sourceId:string|null)=>findings.push({market:s.market,field,sourceId,code,quote:text,withhold:true});
   for(const id of ids){
    const f=byId.get(id),chosen=roles.get(id)??[];
    const monitor=f?.domain==='Preisbedingungen'&&id===s.monitorConditionId&&open.has(id);
    const inInput=!!f&&(available.has(id)||monitor);
    let code:string|null=null;
    if(!f)code='REFERENCE_UNKNOWN';
    else if(![s.market,'SHARED'].includes(f.market))code='REFERENCE_FOREIGN_MARKET';
    else if(f.status==='MISSING'||!f.asOf||!Number.isFinite(Date.parse(f.asOf))||Date.parse(f.asOf)>stamp)code='REFERENCE_UNAVAILABLE_OR_FUTURE';
    else if(!inInput)code='REFERENCE_NOT_IN_MODEL_CATALOG';
    else if(!chosen.length)code='REFERENCE_NOT_SELECTED';
    if(code)add(code,id);
    bindings.push({market:s.market,field,sourceId:id,selectedAs:chosen,availableInModelInput:inInput,verified:code===null});
   }
   // Abstention may honestly describe a data gap without a source or invented evidence.
   if(s.direction!=='ABSTAIN'&&ids.length===0)add('REFERENCE_FIELD_UNBOUND',null);
  }
 }
 return {version:'SCENARIO_REFERENCE_AUDIT_V1',findings,bindings,originalChanged:false,automaticSourceAdditions:false,
  scope:'Explizite vollständige Quellenkennungen in reason/counterargument aller gelieferten Bereiche: Existenz, Markt, Datum, Modellkatalog und eigene Auswahl einschließlich optionaler Monitorreferenz. Gerichtete Szenarien benötigen mindestens einen expliziten Verweis je Text. ABSTAIN darf eine Lücke ohne erfundene Kennung benennen. Keine automatische Erkennung jeder unbelegten Tatsachenbehauptung, keine Prüfung der Bedeutung oder Instrumentwirkung eines Satzes. Ein korrekt gebundener Verweis belegt nicht die Richtigkeit der Interpretation.',semanticTruthVerified:false};
}

