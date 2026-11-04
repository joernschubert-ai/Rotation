import {buildScenarioEvidenceFrame,reviewScenarioMeaning} from './aiResearchScenarioMeaning';
type Fact=Parameters<typeof buildScenarioEvidenceFrame>[0][number];
type Input={baseEpisodeId:string;factsHash:string;sourceSnapshot:string;scenarioIssuedAt:string|null;scenarios:Array<Record<string,any>>;facts:Fact[];weighing:{status:string;requestId:string|null;issuedAt:string|null;view:Array<Record<string,any>>|null};archiveStates:Record<string,string>};
const obj=(v:unknown):Record<string,any>=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?String(v):'unbekannt';
const direction=(v:unknown)=>v==='UP'?'aufwärtsgerichtet':v==='DOWN'?'abwärtsgerichtet':'ohne bekannte Richtung';
const relation=(v:unknown)=>v==='SAME_DIRECTION_CONTEXT'?'gleichgerichteter Kontext':v==='OPPOSITE_DIRECTION_CONTEXT'?'Gegenkontext':'keine direkte Richtungszuordnung';
const unique=<T>(v:T[])=>[...new Set(v)];
/** Readable app templates, never a new model synthesis or direction decision. */
export function buildScenarioNarrative(input:Input){
 const frame=buildScenarioEvidenceFrame(input.facts,input.sourceSnapshot);
 const review=reviewScenarioMeaning(input.scenarios,input.facts,input.sourceSnapshot);
 const usable=input.facts.filter(f=>f.status!=='MISSING'&&f.asOf!==null&&Number.isFinite(Date.parse(f.asOf))&&Date.parse(f.asOf)<=Date.parse(input.sourceSnapshot));
 const markets=input.scenarios.map(s=>{
  const fixed=usable.filter(f=>f.market===s.market),chosen=input.weighing.status==='AVAILABLE'?input.weighing.view?.find(r=>r.market===s.market):null;
  const notes:Array<{code:string;text:string}>=[];
  if(!chosen)notes.push({code:'WEIGHING_UNAVAILABLE',text:'Keine passend geprüfte V4-Abwägung verfügbar. Es wird keine Ersatzabwägung erzeugt.'});
  if(chosen?.judgement==='OPEN')notes.push({code:'WEIGHING_OPEN',text:'Das Modell hat die Abwägung ausdrücklich offengelassen.'});
  const effects:Record<string,any>[]=chosen?unique([...chosen.sameEffects,...chosen.oppositeEffects,...chosen.history,...chosen.decisiveEffects].map(e=>e.effectId)).map(id=>[...chosen.sameEffects,...chosen.oppositeEffects,...chosen.history,...chosen.decisiveEffects].find(e=>e.effectId===id)):[];
  const allowed=(id:string)=>usable.find(f=>f.id===id&&(f.market===s.market||f.market==='SHARED'));
  // Source groups show the SAME canonical observation only once, even with several selected facets.
  const evidence=unique(effects.map(e=>e.sourceId)).map(sourceId=>{
   const fact=allowed(sourceId),selected=effects.filter(e=>e.sourceId===sourceId),r=frame.rows.find(r=>r.sourceId===sourceId);let text='';
   if(!fact)throw Error('NARRATIVE_SOURCE_UNAVAILABLE');
   if(r?.kind==='PNF_FACETS')text='Historische Musterwirkung: '+direction(r.historicalDirection)+'. Status: '+(r.status==='HISTORICALLY_CONFIRMED'?'historisch bestätigt':r.status==='FORMING'?'erst entstehend, nicht bestätigt':'unbekannt')+'. Aktuelle Säule: '+direction(r.columnDirection)+'; zum Muster '+(r.columnRelation==='COUNTER'?'gegenläufig':r.columnRelation==='ALIGNED'?'gleichgerichtet':'nicht eindeutig zugeordnet')+'. Aktuelle Preisbedingung: '+(r.currentConditionSatisfied===true?'erfüllt':r.currentConditionSatisfied===false?'nicht erfüllt':'unbekannt')+'. Daraus allein folgt keine neue Auslösung oder bestätigte Trendwende.';
   else if(r?.kind==='PRICE_RELATION')text='Gelieferte Kursrelation zur MA: '+(r.relation==='ABOVE'?'oberhalb':r.relation==='BELOW'?'unterhalb':r.relation==='AT'?'auf dem Durchschnitt':'unbekannt')+'. Dies belegt weder die MA-Steigung noch tragfähige Unterstützung oder einen neuen Bruch.';
   else if(r?.kind==='HISTORICAL_CONTEXT_ONLY'){
    const stats=obj(fact.values.statistics);text='Historisches Folgeindexmittel: '+num(r.meanPct)+' %; Basis: '+num(r.baselineMeanPct)+' %. Das absolute Mittel ist '+(r.absoluteMeanDirection==='UP'?'positiv':r.absoluteMeanDirection==='DOWN'?'negativ':r.meanPct===0?'null':'unbekannt')+' und liegt '+(r.versusBaseline==='ABOVE'?'über der Basis':r.versusBaseline==='BELOW'?'unter der Basis':r.versusBaseline==='EQUAL'?'auf der Basis':'in unbekannter Relation zur Basis')+'. p10/p90: '+num(stats.p10Pct)+' / '+num(stats.p90Pct)+' %; nichtüberlappende Fälle: '+num(stats.nonOverlappingCount)+'. Aktueller Zustandsabgleich: '+(r.currentMatch===true?'geliefert':r.currentMatch===false?'nicht passend':'unbekannt')+'. Beschreibender Kontext, kein heutiger Impuls oder nachgewiesener Prognosevorteil.';
   }else text=fact.text;
   return {sourceId,asOf:fact.asOf,text,canonicalText:fact.text,origin:'APP_TEMPLATE_FROM_BOUND_FACTS',selectedFacets:selected.map(e=>({effectId:e.effectId,facet:e.facet,relation:e.relation,roleText:relation(e.relation),isPrimary:chosen?.decisiveEffects.some((p:any)=>p.effectId===e.effectId)??false})),independentConfirmations:false};
  });
  const cotAvailable=fixed.filter(f=>f.domain==='COT'&&/^[NR]-F-COT\d+$/.test(f.id));
  const historyAvailable=fixed.filter(f=>f.domain==='Historische Vergleiche'&&/^[NR]-F-H\d+$/.test(f.id)&&f.values.currentMatch===true);
  const cotIds=new Set<string>(chosen?.cot.map((f:any)=>f.id)??[]),histIds=new Set<string>(effects.filter(e=>e.facet==='HISTORICAL_MEAN').map(e=>e.sourceId));
  const cot=cotAvailable.map(f=>{
   const r=frame.rows.find(r=>r.sourceId===f.id),changes=(r?.changes??[]) as Array<Record<string,any>>;
   return {sourceId:f.id,asOf:f.asOf,selected:cotIds.has(f.id),origin:'APP_TEMPLATE_FROM_BOUND_FACTS',text:'Gruppe '+(r?.group??'unbekannt')+': netto '+num(r?.net)+' Kontrakte; '+(r?.state==='NET_SHORT'?'weiterhin netto short':r?.state==='NET_LONG'?'weiterhin netto long':r?.state==='FLAT'?'netto ausgeglichen':'Bestand unbekannt')+'. '+changes.map(c=>num(c.weeks)+' Wochen: Nettoänderung '+num(c.delta)+' Kontrakte, '+(c.shift==='UP'?'Richtung Long':c.shift==='DOWN'?'Richtung Short':c.delta===0?'unverändert':'Richtung unbekannt')+'.').join(' ')+' Keine automatische Preisrichtung daraus abgeleitet.',canonicalText:f.text};
  });
  const same=chosen?.sameEffects??[],opposite=chosen?.oppositeEffects??[],primary=chosen?.decisiveEffects??[];
  const samePrice=unique([...same,...primary.filter((e:any)=>e.relation==='SAME_DIRECTION_CONTEXT'&&e.facet!=='HISTORICAL_MEAN')].map((e:any)=>e.effectId));
  const sameSources=unique(samePrice.map(id=>effects.find(e=>e.effectId===id)!.sourceId));
  if(samePrice.length>1&&sameSources.length===1)notes.push({code:'SAME_SOURCE_FACETS',text:samePrice.length+' gewählte gleichgerichtete Facetten stammen aus derselben Quelle. Das sind keine '+samePrice.length+' unabhängigen Bestätigungen.'});
  if(chosen&&!opposite.length&&!primary.some((e:any)=>e.relation==='OPPOSITE_DIRECTION_CONTEXT'&&e.facet!=='HISTORICAL_MEAN'))notes.push({code:'NO_PRICE_COUNTERFACET_SELECTED',text:'Keine entgegengesetzte Preis-/P&F-Facette ausgewählt. Historischer Kontext wird separat gezeigt; eine vollständige Gegenargumentprüfung ist nicht belegt.'});
  if(cotAvailable.length&&!cotIds.size)notes.push({code:'COT_NOT_SELECTED',text:'COT-Fakten vorhanden, aber in diesem V4-Auftrag nicht ausgewählt. Das beweist weder bewusste Nichtberücksichtigung noch eine Gewichtung.'});
  if(historyAvailable.length&&!histIds.size)notes.push({code:'HISTORY_NOT_SELECTED',text:'Passende historische Vergleiche vorhanden, aber kein historischer Mittelwert als V4-Facette ausgewählt.'});
  if(chosen)notes.push({code:'WEIGHTING_NOT_VERIFIED',text:'Auswahl und Schwerpunkt sind sichtbar. Wie stark COT, Historie und Gegenbelege tatsächlich gewichtet wurden, ist damit nicht nachgewiesen.'});
  const selectedShared=(chosen?.shared??[]).map((f:any)=>{const bound=allowed(f.id);if(!bound)throw Error('NARRATIVE_SHARED_SOURCE');return {sourceId:bound.id,asOf:bound.asOf,text:bound.text,origin:'BOUND_APP_SOURCE',causalPriceEffectProven:false};});
  const monitor=s.monitorConditionId?allowed(s.monitorConditionId):null;
  if(s.monitorConditionId&&(!monitor||monitor.domain!=='Preisbedingungen'||monitor.values.state!=='OPEN'))notes.push({code:'MONITOR_UNAVAILABLE',text:'Die gespeicherte Monitorreferenz ist hier nicht als eigene offene Preisbedingung verfügbar. Keine Ersatzmarke.'});
  const viewSummary=!chosen?'Keine passende archivierte Modellabwägung.':chosen.judgement==='OPEN'?'Das Modell lässt die Kontextabwägung offen.':chosen.judgement==='BASE_CONTEXT_STRONGER'?'Das Modell setzt den Schwerpunkt auf Kontext für die gespeicherte Richtung.':'Das Modell setzt den Schwerpunkt auf Gegenkontext zur gespeicherten Richtung. Die Prognoserichtung wird dadurch nicht geändert.';
  return {market:s.market,direction:s.direction,directionOrigin:'UNCHANGED_ARCHIVED_MODEL_SCENARIO',scenarioIssuedAt:input.scenarioIssuedAt,weighingIssuedAt:input.weighing.issuedAt,modelFocus:viewSummary,judgement:chosen?.judgement??null,primaryEffectIds:primary.map((e:any)=>e.effectId),evidence,cot,availableHistory:historyAvailable.map(f=>({sourceId:f.id,asOf:f.asOf,text:f.text,selected:histIds.has(f.id)})),shared:selectedShared,monitor:monitor&&monitor.domain==='Preisbedingungen'&&monitor.values.state==='OPEN'?{sourceId:monitor.id,asOf:monitor.asOf,text:monitor.text,meaning:'Optionale Beobachtungsreferenz; kein heutiger Unterstützungsbeleg, keine Pflichtschwelle oder automatische Widerlegung.'}:null,coverage:{cotChosen:cotIds.size,cotAvailable:cotAvailable.length,historyChosen:histIds.size,historyAvailable:historyAvailable.length,meaning:'Gewählt bedeutet referenziert, nicht nachgewiesen abgewogen.'},notes,originalReason:s.reason,originalCounterargument:s.counterargument,meaningReview:review.findings.filter(f=>f.market===s.market),independentVotes:false,semanticTruthVerified:false,predictiveQualityVerified:false};
 });
 return {version:'SCENARIO_NARRATIVE_V1',baseEpisodeId:input.baseEpisodeId,factsHash:input.factsHash,sourceSnapshot:input.sourceSnapshot,weighingRequestId:input.weighing.requestId,weighingStatus:input.weighing.status,archiveStates:input.archiveStates,markets,origin:'APP_TEMPLATES_AND_UNCHANGED_MODEL_SELECTION',readOnly:true,modelRequestsUsed:0,memoryWritten:false,originalChanged:false,forecastsChanged:false,newForecasts:0,limits:'Lesbare Darstellung einer gespeicherten Modellauswahl und ihres Quellenrahmens. Kein neues Gesamturteil, keine neue Prognose oder Handelsfreigabe. Historische Muster, Säulen und Bedingungen bleiben getrennt; Facetten und Quellenanzahlen sind keine unabhängigen Stimmen. Fehlende Archive oder Bezüge werden nicht ergänzt. Keine vollständige Bedeutungs- oder Gewichtungsprüfung.'};
}
