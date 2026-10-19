import type { SynthesisEvidence } from './aiResearchSynthesisEvidence';
export interface ChartPriceLevel { id:string;price:number;label:string;asOfDate:string;basis:'DAILY_CLOSE_REFERENCE';distancePct:number; }
export interface InstrumentPriceReferences { instrument:'NASDAQ_PUT'|'NASDAQ_CALL'|'RUSSELL_CALL';market:'NASDAQ'|'RUSSELL_2000';status:'AVAILABLE'|'UNAVAILABLE';asOfDate:string|null;lastClose:number|null;upLevels:ChartPriceLevel[];downLevels:ChartPriceLevel[];note:string; }
const obj=(v:unknown):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const positive=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>0;
/** Existing observed references only. No fitted lines, targets or newly invented support levels. */
export function buildInstrumentPriceReferences(evidence:SynthesisEvidence[],reference:string):InstrumentPriceReferences[]{
 return (['NASDAQ_PUT','NASDAQ_CALL','RUSSELL_CALL'] as const).map(instrument=>{
  const market=instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ',row=evidence.find(e=>e.id==='CHART_'+market&&e.available),c=obj(row?.data);
  const date=typeof c.asOfDate==='string'?c.asOfDate:null,time=date?Date.parse(date+'T00:00:00Z'):NaN,at=Date.parse(reference);
  const validDate=!!date&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===date&&time<=at&&at-time<=5*86400000;
  const available=Boolean(row&&validDate&&positive(c.lastClose)),levels:ChartPriceLevel[]=[];
  const add=(id:string,value:unknown,label:string)=>{if(available&&positive(value))levels.push({id,price:value,label,asOfDate:date!,basis:'DAILY_CLOSE_REFERENCE',distancePct:(value/c.lastClose-1)*100});};
  if(available){
   add('PRIOR20_LOW',obj(c.prior20).lowClose,'Tiefster Schlusskurs der vorherigen 20 Sitzungen');
   add('PRIOR20_HIGH',obj(c.prior20).highClose,'Höchster Schlusskurs der vorherigen 20 Sitzungen');
   add('PRIOR63_LOW',obj(c.prior63).lowClose,'Tiefster Schlusskurs der vorherigen 63 Sitzungen');
   add('PRIOR63_HIGH',obj(c.prior63).highClose,'Höchster Schlusskurs der vorherigen 63 Sitzungen');
   for(const m of Array.isArray(c.movingAverages)?c.movingAverages:[])if([20,50,200].includes(m.period))add('MA'+m.period,m.closeAverage,m.period+'-Tage-Schlusskursdurchschnitt');
   const formations=obj(c.formations);
   for(const p of Array.isArray(formations.pointFigure)?formations.pointFigure:[]){
    const latest=p.latest??(Array.isArray(p.signals)?p.signals[p.signals.length-1]:null);
    for(const [kind,f]of [['FORMING',p.forming],['ALIGNED',latest]] as const){
     if(!f||f.status==='INVALIDATED'||kind==='ALIGNED'&&f.currentRelation!=='ALIGNED_WITH_CURRENT_COLUMN')continue;
     const prefix='PNF'+p.boxPercent+'_'+kind;
     add(prefix+'_TRIGGER',f.confirmationLevel,'P&F '+p.boxPercent+' % · '+(kind==='FORMING'?'offene Preisbedingung':'frühere ausgelöste Preisbedingung'));
     add(prefix+'_INVALIDATION',f.invalidationLevel,'P&F '+p.boxPercent+' % · Gegenmarke zur Formation');
    }
   }
   for(const f of Array.isArray(formations.classic)?formations.classic:[])if(f.status!=='INVALIDATED'){
    add('CLASSIC_'+f.family+'_TRIGGER',f.confirmationLevel,'Klassisches Muster · Preisbedingung');
    add('CLASSIC_'+f.family+'_INVALIDATION',f.invalidationLevel,'Klassisches Muster · Gegenmarke');
   }
   if(!levels.some(l=>l.price<c.lastClose))add('PRIOR252_LOW',obj(c.prior252).lowClose,'Weit zurückreichender Bezug: Tief der vorherigen 252 Sitzungen; keine nahe Unterstützung');
   if(!levels.some(l=>l.price>c.lastClose))add('PRIOR252_HIGH',obj(c.prior252).highClose,'Weit zurückreichender Bezug: Hoch der vorherigen 252 Sitzungen; kein geprüfter Widerstand');
  }
  const unique=(items:ChartPriceLevel[])=>items.filter((v,i)=>!items.slice(0,i).some(old=>Math.abs(old.price-v.price)<=Math.max(0.005,v.price*0.0000001))).slice(0,3);
  return {instrument,market,status:available?'AVAILABLE':'UNAVAILABLE',asOfDate:available?date:null,lastClose:available?c.lastClose:null,
   upLevels:unique(levels.filter(l=>l.price>c.lastClose).sort((a,b)=>a.price-b.price)),downLevels:unique(levels.filter(l=>l.price<c.lastClose).sort((a,b)=>b.price-a.price)),
   note:'Datierte Schlusskursreferenzen, keine geprüften Unterstützungen/Widerstände. Rückkehr über bzw. Unterschreiten einer Marke ist ein bedingter Hinweis, kein garantierter Kursverlauf oder automatischer Einstieg.'};
 });
}
/** Flag only explicitly mentioned crossing prices; do not discard an otherwise readable thesis. */
export function unverifiedPriceReferenceNotes(flow:any,evidence:SynthesisEvidence[],reference:string):string[]{
 const own=buildInstrumentPriceReferences(evidence,reference).find(r=>r.instrument===flow.instrument);
 const c=obj(evidence.find(e=>e.id==='CHART_'+(flow.instrument==='RUSSELL_CALL'?'RUSSELL_2000':'NASDAQ')&&e.available)?.data);
 const values=[...own?.upLevels??[],...own?.downLevels??[]].map(l=>l.price);
 for(const m of Array.isArray(c.movingAverages)?c.movingAverages:[])if(positive(m.closeAverage))values.push(m.closeAverage);
 for(const range of [c.prior20,c.prior63,c.prior252])for(const value of Object.values(obj(range)))if(positive(value))values.push(value);
 const text=[flow.reasoning,flow.whyNow,flow.counterargument].join('. '),missing:number[]=[];
 for(const match of text.matchAll(/(?:über|unter)\s+(\d[\d.,]*)/giu)){
  const after=text.slice(match.index!+match[0].length);
  if(/^\s*(?:%|[- ]?(?:tage|sitzungen|sessions))/iu.test(after))continue;
  const token=match[1].replace(/[.,]+$/u,''),value=/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(token)?Number(token.replace(/\./g,'').replace(',','.')):Number(token.replace(',','.'));
  if(positive(value)&&!values.some(p=>Math.abs(p-value)<=Math.max(0.51,p*0.00005)))missing.push(value);
 }
 return [...new Set(missing)].map(value=>'Die von der KI genannte Kursmarke '+value.toLocaleString('de-DE',{maximumFractionDigits:2})+' ist nicht als solche aus den abgeglichenen Kursreferenzen belegt. Maßgeblich sind die separat angezeigten datierten Chartmarken.');
}
