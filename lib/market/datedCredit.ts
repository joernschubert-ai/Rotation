export type CreditBar={date:string;close:number|null};
const day=(s:any)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const price=(v:any):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>0;
export function calculateDatedCredit(hyg:CreditBar[]|undefined,ief:CreditBar[]|undefined,now=Date.now(),referenceDate?:string){
 const basis={ratioDefinition:'HYG / IEF',normalizedDefinition:'(HYG / IEF) / MA50(HYG / IEF)',timeOrder:'OLDEST_FIRST_REQUIRED',alignmentBasis:'DATED_COMMON_SESSION_WINDOW',calendarVerified:false};
 const fail=(reason:string)=>({creditSignal:'unknown',creditRatio:null,creditRatioMA50:null,creditRatioToMA50:null,creditDistancePct:null,creditDataQuality:{...basis,available:false,reason,dateAlignmentVerified:false}});
 if(!Array.isArray(hyg)||!Array.isArray(ief))return fail('MISSING_DATED_ETF_BARS');
 if([hyg,ief].some(a=>!a.length||a.some((b,i)=>!day(b?.date)||b.date>new Date(now).toISOString().slice(0,10)||(i>0&&a[i-1].date>=b.date))))return fail('INVALID_OR_UNORDERED_DATED_BARS');
 const hm=new Map(hyg.map(b=>[b.date,b.close])),im=new Map(ief.map(b=>[b.date,b.close]));
 if(referenceDate!==undefined&&!day(referenceDate))return fail('INVALID_REFERENCE_DATE');
 const shared=hyg.filter(b=>(referenceDate===undefined||b.date<=referenceDate)&&price(b.close)&&price(im.get(b.date)));
 if(shared.length<60)return fail('INSUFFICIENT_COMMON_HISTORY');
 const end=shared[shared.length-1].date;
 if(now-Date.parse(end+'T00:00:00Z')>5*86400000)return fail('DATED_CREDIT_TOO_OLD');
 const dates=[...new Set([...hm.keys(),...im.keys()])].filter(d=>d<=end).sort().slice(-50);
 if(dates.length!==50||dates.some(d=>!price(hm.get(d))||!price(im.get(d))))return fail('MISSING_PRICE_IN_DATED_MA50_WINDOW');
 const ratios=dates.map(d=>hm.get(d)!/im.get(d)!);const ma50=ratios.reduce((sum,n)=>sum+n/50,0),last=ratios[49];
 const tolerance=Number.EPSILON*64*Math.max(Math.abs(last),Math.abs(ma50));const normalized=Math.abs(last-ma50)<=tolerance?1:last/ma50;
 if(!price(ma50)||!price(normalized))return fail('INVALID_DATED_RATIO');
 return {creditSignal:normalized>1?'risk_on':normalized<1?'risk_off':'neutral',creditRatio:last,creditRatioMA50:ma50,creditRatioToMA50:normalized,creditDistancePct:(normalized-1)*100,
  creditDataQuality:{...basis,available:true,reason:null,dateAlignmentVerified:true,asOfDate:end,windowStartDate:dates[0],pairedObservations:50,commonHistory:shared.length,latestHygDate:hyg[hyg.length-1].date,latestIefDate:ief[ief.length-1].date,fallbackUsed:end!==hyg[hyg.length-1].date||end!==ief[ief.length-1].date,referenceDate:referenceDate??null,latestBarFinality:'UNVERIFIED'}};
}
