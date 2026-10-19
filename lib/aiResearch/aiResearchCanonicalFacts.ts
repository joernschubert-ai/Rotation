import type { SynthesisEvidence } from './aiResearchSynthesisEvidence';
import { buildInstrumentBriefs } from './aiResearchInstrumentBriefs';
const object=(v:unknown):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const format=(v:number)=>v.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
export function canonicalMarketFacts(evidence:SynthesisEvidence[],market:'NASDAQ'|'RUSSELL_2000'){
 const chart=object(evidence.find(e=>e.id==='CHART_'+market&&e.available)?.data),close=chart.lastClose;
 const averages=(Array.isArray(chart.movingAverages)?chart.movingAverages:[]).filter((m:any)=>[20,50,200].includes(m.period)&&finite(m.closeAverage)&&m.closeAverage>0&&finite(close)&&close>0).map((m:any)=>{
  const relation=close<m.closeAverage?'BELOW':close>m.closeAverage?'ABOVE':'EQUAL',distancePct=(close/m.closeAverage-1)*100;
  return {period:m.period,close,average:m.closeAverage,relation,distancePct,formula:'100 * (CLOSE / AVERAGE - 1)',fact:'Schlusskurs '+format(close)+' liegt '+(relation==='BELOW'?'UNTER':relation==='ABOVE'?'ÜBER':'GENAU AUF')+' MA'+m.period+' '+format(m.closeAverage)+'; Abstand des Kurses zur MA: '+format(distancePct)+' %.'};
 });
 const b=buildInstrumentBriefs(evidence).find(b=>b.instrument===(market==='NASDAQ'?'NASDAQ_CALL':'RUSSELL_CALL')),h=b?.histories.find(h=>h.family==='OWN_TREND');
 const history=h&&finite(h.meanPct)&&finite(h.baselineMeanPct)?{horizonSessions:h.horizonDays,meanIndexReturn:{value:h.meanPct,unit:'PERCENT'},baselineIndexReturn:{value:h.baselineMeanPct,unit:'PERCENT'},meanDifference:{value:h.excessMeanPp,unit:'PERCENTAGE_POINTS'},fact:'Historische '+h.horizonDays+'-Sitzungs-Folgerendite: Mittel '+format(h.meanPct)+' %, Basis '+format(h.baselineMeanPct)+' %, Mehrertrag '+(finite(h.excessMeanPp)?format(h.excessMeanPp):'nicht verfügbar')+' PROZENTPUNKTE. Mehrertrag ist NICHT die absolute Indexrendite. Kein Nachweis eines aktuellen langfristigen Trends.'}:null;
 const cotRow=evidence.find(e=>e.id==='COT_'+market),cotQuality=object(cotRow?.data.dataQuality);
 // Fetch/cache transport state is displayed separately, not part of the model evidence hash.
 const cotAvailability={available:cotRow?.available===true,observationDate:cotQuality.observationDate??null,publicationTimeKnown:false,context:'LAGGED_WEEKLY_POSITIONING_NOT_LIVE_QUOTES'};
 return {asOfDate:chart.asOfDate??null,priceVsAverages:averages,history,cotAvailability};
}
/** Fact contradictions get explicit caveats, not invented replacement model opinions. */
export function canonicalClaimNotes(prose:string,evidence:SynthesisEvidence[],market:'NASDAQ'|'RUSSELL_2000'):string[]{
 const facts=canonicalMarketFacts(evidence,market),notes:string[]=[];
 const directClaims=prose.split(/[!?]|\.(?:\s|$)/u).filter(s=>!/nicht\s+(?:unter|über)/iu.test(s)).join('. ');
 for(const a of facts.priceVsAverages){
  const ma='MA\\s*'+a.period;
  const saysBelow=new RegExp(ma+'[^.!?]{0,24}unter (?:dem )?kurs','iu').test(directClaims)||new RegExp('kurs[^.!?]{0,24}über (?:dem )?'+ma,'iu').test(directClaims);
  const saysAbove=new RegExp(ma+'[^.!?]{0,24}über (?:dem )?kurs','iu').test(directClaims)||new RegExp('kurs[^.!?]{0,24}unter (?:dem )?'+ma,'iu').test(directClaims);
  const quote=evidence.find(e=>e.id==='PRICE_'+market&&e.available)?.data.current;
  if(finite(quote)&&quote>0&&Math.sign(quote-a.average)!==Math.sign(a.close-a.average))continue; // Intraday and completed-close bases can differ.
  if(a.relation==='BELOW'&&saysBelow||a.relation==='ABOVE'&&saysAbove)notes.push('Die KI beschreibt die MA'+a.period+'-Lage widersprüchlich. Geprüfter Datenfakt: '+a.fact);
 }
 const h=facts.history;
 if(h&&finite(h.meanDifference.value))for(const sentence of prose.split(/[!?]|\.(?:\s|$)/u)){
  if(!/historisch|folgerendite|rendite nach/iu.test(sentence)||/mehrertrag|prozentpunkt|excess|differenz|zusatzrendite/iu.test(sentence))continue;
  const values=[...sentence.matchAll(/([+-]?\d+(?:[.,]\d+)?)\s*%/gu)].map(m=>Number(m[1].replace(',','.')));
  if(values.some(v=>Math.abs(v-h.meanDifference.value!)<=0.005&&Math.abs(v-h.meanIndexReturn.value)>0.02))notes.push('Historischer Mehrertrag und absolute Rendite sind verwechselt. Geprüfter Datenfakt: '+h.fact);
 }
 return [...new Set(notes)];
}

/** Narrow, evidence-bound checks. Ambiguous prose is not a licence to reverse a model opinion. */
export function auditMarketInterpretation(evaluations:Record<string,any>|undefined,evidence:SynthesisEvidence[],market:'NASDAQ'|'RUSSELL_2000'){
 const notes:string[]=[],unresolved:Array<'COT'|'HISTORY'>=[];
 const b=buildInstrumentBriefs(evidence).find(b=>b.instrument===(market==='NASDAQ'?'NASDAQ_CALL':'RUSSELL_CALL'));
 const c=evaluations?.COT,reason=String(c?.reason??'');
 const lm=b?.cot.find(c=>c.group==='LEVERAGED_MONEY');
 if(c?.reading==='BEARISH'&&/leveraged money/iu.test(reason)&&/reduziert.*short|short.*(?:kleiner|reduziert|abgebaut)/iu.test(reason)&&lm&&finite(lm.weeklyChange)&&lm.weeklyChange>0&&!/aber|jedoch|trotz|während/iu.test(reason)){
  notes.push('COT-Beitrag bleibt offen: Ein kleinerer Netto-Shortüberhang ist eine Verschiebung in Richtung Long. Die KI begründet damit allein dennoch BEARISH. Das Gesamtbild darf weitere Faktoren enthalten; aus dieser Begründung wird kein automatisches BULLISH abgeleitet.');unresolved.push('COT');
 }
 const h=String(evaluations?.HISTORY?.reason??'');
 if(canonicalClaimNotes(h,evidence,market).some(n=>n.startsWith('Historischer Mehrertrag'))){unresolved.push('HISTORY');notes.push('Historienbeitrag bleibt wegen verwechselter Renditeeinheiten offen; die geprüften Vergleichszahlen und die eigene Instrumentthese bleiben sichtbar.');}
 return {notes,unresolved};
}

export function conditionalStateNotes(flow:{counterargument?:string;reasoning?:string;whyNow?:string;assessmentExplanation?:string},evidence:SynthesisEvidence[],market:'NASDAQ'|'RUSSELL_2000'){
 const facts=canonicalMarketFacts(evidence,market),notes:string[]=[],counter=flow.counterargument??'';
 for(const a of facts.priceVsAverages){
  if(a.relation==='ABOVE'&&new RegExp('(?:erholung|rückkehr|anstieg)\\s+über\\s+(?:die\\s+)?MA\\s*'+a.period+'(?!\\d)','iu').test(counter))notes.push('Die genannte künftige Rückkehr über MA'+a.period+' ist auf Schlusskursbasis bereits erfüllt. '+a.fact+' Als neue Widerlegungsbedingung ist sie so nicht geeignet.');
  if(a.relation==='BELOW'&&new RegExp('(?:rückgang|rückkehr|fallen)\\s+unter\\s+(?:die\\s+)?MA\\s*'+a.period+'(?!\\d)','iu').test(counter))notes.push('Die genannte künftige Rückkehr unter MA'+a.period+' ist auf Schlusskursbasis bereits erfüllt. '+a.fact);
 }
 const chart=object(evidence.find(e=>e.id==='CHART_'+market&&e.available)?.data),scales=object(chart.formations).pointFigure;
 const prose=[flow.reasoning,flow.whyNow,flow.assessmentExplanation].filter(Boolean).join('. ');
 if(/P&F.*(?:bruch|O-Tief)/iu.test(prose)&&Array.isArray(scales)&&scales.some((s:any)=>String(s.forming?.family).includes('BOTTOM_BREAKDOWN'))&&!scales.some((s:any)=>String(s.latest?.family).includes('BOTTOM_BREAKDOWN')&&s.latest?.status==='CONFIRMED'))notes.push('Der P&F-Bruch unter das O-Tief ist in den gelieferten Daten noch ein entstehendes Muster. Die Preisbedingung ist offen; weiteres Fallen ist ein bedingtes Szenario, kein bereits bestätigter Bruch.');
 if(/P&F.*(?:ausbruch|X-Hoch)/iu.test(prose)&&Array.isArray(scales)&&scales.some((s:any)=>s.currentColumn==='O'&&String(s.latest?.family).includes('TOP_BREAKOUT'))&&!/(?:früher|historisch|damalig|alte[nr]?)\w*\s+P&F/iu.test(prose))notes.push('Der erwähnte P&F-Aufwärtsausbruch ist ein früheres Preisereignis; die zugehörige aktuelle Säule läuft abwärts. Daraus folgt keine frische Aufwärtsbestätigung. Eine künftige Erholung bleibt als Hypothese möglich.');
 return notes;
}


