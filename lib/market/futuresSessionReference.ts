const positive=(v:any):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>0;
const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function futuresSessionReference(result:any,symbol:string,current:number|null,currentTime:number|null,referenceDate?:string|null){
 const missing={status:'UNAVAILABLE',referenceDate:referenceDate??null,returnPct:null,settlementVerified:false,contractContinuityVerified:false};
 if(!positive(current)||currentTime===null||!Number.isFinite(currentTime)||!referenceDate||!/^\d{4}-\d{2}-\d{2}$/.test(referenceDate))return {...missing,reason:'NO_VALID_PRICE_OR_OBSERVED_CASH_DATE'};
 if(result?.meta?.symbol&&result.meta.symbol!==symbol)return {...missing,reason:'FEED_SYMBOL_MISMATCH'};
 const times=result?.timestamp,closes=result?.indicators?.quote?.[0]?.close;
 if(!Array.isArray(times)||!Array.isArray(closes)||times.length!==closes.length)return {...missing,reason:'INVALID_SERIES'};
 const candidates:Array<{time:number;close:number}>=[];
 for(let i=0;i<times.length;i++){
  if(typeof times[i]!=='number'||!Number.isFinite(times[i]))continue;
  const t=times[i]*1000;if(t>=currentTime)continue;
  const p=parts.formatToParts(new Date(t)),get=(k:string)=>p.find(v=>v.type===k)?.value;
  if(`${get('year')}-${get('month')}-${get('day')}`===referenceDate&&get('hour')==='16'&&get('minute')==='00'&&get('second')==='00'){
   if(!positive(closes[i]))return {...missing,reason:'INVALID_REFERENCE_BAR'};
   candidates.push({time:t,close:closes[i]});
  }
 }
 if(candidates.length!==1)return {...missing,reason:'MISSING_OR_DUPLICATE_1600_NY_REFERENCE'};
 const ref=candidates[0],pct=(current/ref.close-1)*100;
 if(!Number.isFinite(pct))return {...missing,reason:"INVALID_NUMERIC_RETURN"};
 return {...missing,status:'AVAILABLE_OBSERVED_REFERENCE',reason:null,returnPct:pct,referencePrice:ref.close,referenceTimestamp:new Date(ref.time).toISOString(),observationTimestamp:new Date(currentTime).toISOString(),feedSymbol:symbol,referenceDefinition:'SAME_CONTINUOUS_FEED_PROVIDER_BAR_TIMESTAMP_1600_NEW_YORK',meaning:'Bewegung gegenüber Anbieterbalken um 16:00 New York am beobachteten Cash-Tag. Kein offizielles Settlement, kein Cash-Indexvergleich. Kontraktwechsel nicht verifiziert; nur beschreibender Kontext, keine Einstiegsfreigabe.'};
}
