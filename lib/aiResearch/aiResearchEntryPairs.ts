import type {AppFacts} from './aiResearchAppFacts';
const num=(v:any):v is number=>typeof v==='number'&&Number.isFinite(v);
const obj=(v:any):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};

/** Same source pair and IDs. Make the current recovery context explicit, without a new directional vote. */
function recoveryPairText(f:Record<string,any>,structure:string,decline:Record<string,any>,fallback:string){
 const a=obj(f.values?.anticyclical),d=obj(a.asymmetricDecision);
 if(a.version!=='ANTICYCLICAL_ENTRY_CONTEXT_V1'||a.status!=='AVAILABLE'||a.asOf!==f.asOf||d.version!=='ASYMMETRIC_DECISION_V1'||!num(a.rsi14))return fallback;
 const names:Record<string,string>={RSI_RECLAIM:'RSI30-Rueckkehr',RSI_FAILURE_SWING:'RSI-Erholungsmuster',RSI_DIVERGENCE:'RSI-Divergenz',MA20_RECLAIM_STRESS:'MA20-Rueckeroberung'};
 const selected=Array.isArray(d.examples)?d.examples.find((e:any)=>e.id===d.basisId):null;
 const age=selected?.ageIntervals,when=age===0?'neu':Number.isInteger(age)?`vor${age}Intervallen`:'offen';
 const basis=selected?`${names[selected.id]??'Preiszeichen'} ${when}`:'kein frisches Preiszeichen';
 const hs=Array.isArray(selected?.horizons)?[60,80].map(h=>selected.horizons.find((x:any)=>x.intervals===h)):[];
 const comparison=hs.length===2&&hs.every(h=>h&&num(h.medianPct)&&Number.isInteger(h.n))?`Stressfaelle60/80:Median ${hs.map(h=>h.medianPct.toFixed(2)).join('/')}%,n${hs.map(h=>h.n).join('/')}`:'60/80-Erholungsabwägung offen';
 return `${structure}; Abverkauf ${decline.date} ${decline.returnPct.toFixed(2)}%,seit dessen Schluss ${decline.recoverySinceDeclineClosePct.toFixed(2)}%. RSI14 ${a.rsi14.toFixed(2)};${basis};${comparison}. Kein Boden-/Optionsbeleg.`;
}
export function entryPairs(facts:AppFacts){
 return ['NASDAQ','RUSSELL_2000'].flatMap(market=>{
  const prefix=market==='NASDAQ'?'N':'R',sourceId=prefix+'-F-ENTRY-TIMING',f=facts.facts.find(f=>f.id===sourceId&&f.status==='CALCULATED'),c=obj(f?.values.context);
  if(!f||!f.asOf||f.asOf!==c.cashDate||f.asOf>facts.snapshotTimestamp.slice(0,10))return [];
  const ma=facts.facts.find(x=>x.id===prefix+'-F-MA20'&&x.status!=='MISSING'&&x.asOf===f.asOf),relation=ma?.values.relation,decline=obj(c.recentDecline);
  const structure=relation==='BELOW'?'Schluss unter MA20':relation==='ABOVE'?'Schluss über MA20':relation==='EQUAL'?'Schluss auf MA20':null;
  const pairs:Array<{id:string;sourceIds:string[];text:string}>=[];
  if(ma&&structure&&typeof decline.date==='string'&&decline.date<=f.asOf&&num(decline.returnPct)&&decline.returnPct<0&&num(decline.recoverySinceDeclineClosePct)){
   const recovery=decline.recoverySinceDeclineClosePct;
   pairs.push({id:prefix+'-ENTRY-PATH',sourceIds:[ma.id,f.id],text:recoveryPairText(f,structure,decline,`${structure}; Abverkauf ${decline.date} ${decline.returnPct.toFixed(2)}%, seither ${recovery.toFixed(2)}% relativ zu dessen Schluss. Richtungsstruktur und Attraktivität eines neuen Einstiegs getrennt abwägen; keine Bodenbestätigung.`)});
  }
  if(ma&&structure&&num(c.futuresReferenceMovePct)&&c.futuresAvailabilityReason==null&&typeof c.futuresAsOf==='string'&&Number.isFinite(Date.parse(c.futuresAsOf))&&Date.parse(c.futuresAsOf)<=Date.parse(facts.snapshotTimestamp)&&Date.parse(facts.snapshotTimestamp)-Date.parse(c.futuresAsOf)<=30*60000)pairs.push({id:prefix+'-ENTRY-FUTURES',sourceIds:[ma.id,f.id],text:`${structure}; datierte Futures-Bewegung ${c.futuresReferenceMovePct.toFixed(2)}% gegenüber Anbieterreferenz 16hNY. Keine neue Cash-Struktur, kein Settlement/Rollnachweis.`});
  return [{market,sourceId,asOf:f.asOf,pairs,openId:prefix+'-ENTRY-OPEN',note:'Modell wählt Befundpaar oder ausdrücklich offen. App berechnet keine Überlegenheit, Empfehlung oder Positionsgröße; keine unabhängigen Stimmen.'}];
 });
}
export function entryPairBinding(text:string,instrument:string,facts:AppFacts){
 const market=instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ',own=entryPairs(facts).find(x=>x.market===market);
 if(!own)return {status:'NOT_APPLICABLE',id:null,pair:null};
 const ids=[...text.matchAll(/\[([NR]-ENTRY-[A-Z]+)\]/g)].map(m=>m[1]);
 if(ids.length!==1)return {status:ids.length?'AMBIGUOUS_PAIR':'MISSING_PAIR',id:null,pair:null};
 if(ids[0]===own.openId)return {status:'DECLARED_OPEN',id:ids[0],pair:null};
 const pair=own.pairs.find(p=>p.id===ids[0]);
 return {status:pair?'OWN_PAIR_REFERENCED':'INVALID_OR_FOREIGN_PAIR',id:ids[0],pair:pair??null};
}
