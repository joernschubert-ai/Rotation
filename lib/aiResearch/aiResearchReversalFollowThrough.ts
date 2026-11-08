import type {RecoveryPoint} from './aiResearchAnticyclicalStudy';
export const FOLLOW_THROUGH_POLICY={version:'REVERSAL_FOLLOW_THROUGH_V1',recentIntervals:10,breach:'DAILY_CLOSE_STRICTLY_BELOW_FIXED_REFERENCE',equal:'AT_REFERENCE_NOT_HELD',resurrection:false,tradeGate:false,weightsChanged:false} as const;
type Signal={index:number;signalDate:string;knownAt:string;reference:number|null;originDate:string;secondLowDate?:string};
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const pct=(a:number,b:number)=>100*(a/b-1);
/** Only observed closes at/after knownAt; never treats an old recovery of a lost level as a fresh event. */
export function assessReversalFollowThrough(points:RecoveryPoint[],event:Signal|undefined,ruleId:string){
 const last=points.at(-1),empty={version:FOLLOW_THROUGH_POLICY.version,asOf:last?.date??null,status:points.length?'NO_EVENT':'UNAVAILABLE',tone:'neutral',label:points.length?'Kein bekanntes Signal':'Daten fehlen',signalDate:null as string|null,ageIntervals:null as number|null,fresh:false,recent:false,currentAboveReference:null as boolean|null,reference:null as number|null,referenceMeaning:null as string|null,firstReferenceLostDate:null as string|null,structuralLow:null as number|null,firstStructuralBreakDate:null as string|null,changeSinceSignalPct:null as number|null,worstCloseSinceSignalPct:null as number|null,latestClose:last?.close??null,effect:'Keine eigenständige Einstiegsentscheidung.'};
 if(!event)return empty;
 const i=event.index;
 if(!last||!Number.isInteger(i)||i<0||i>=points.length||event.signalDate!==points[i].date||event.knownAt!==points[i].date||!points.every((p,j)=>finite(p.close)&&p.close>0&&(!j||p.date>points[j-1].date)))return {...empty,status:'UNAVAILABLE',label:'Signalbezug nicht eindeutig'};
 let reference=event.reference,meaning='',structuralLow:number|null=null;
 const second=event.secondLowDate?points.findIndex(p=>p.date===event.secondLowDate):-1;
 if(['PRICE_RETEST','W_EARLY','W_CONFIRMED'].includes(ruleId)){
  if(second<0||second>=i)return {...empty,status:'UNAVAILABLE',label:'Muster-Tief fehlt'};
  structuralLow=points[second].close;
 }
 if(ruleId==='FAILED_LOW_RECLAIM')meaning='Damals zurückeroberte, eingefrorene 20-Schluss-Tiefzone';
 else if(ruleId==='BAND_REENTRY')meaning='Unteres Bollinger-Band am Erkennungstag, als feste Vergleichsmarke; kein bewiesener Stop oder dauerhafter Halt';
 else if(ruleId==='PRICE_RETEST'||ruleId==='W_EARLY'){reference=structuralLow;meaning='Zweites bestätigtes Schlusstief, nicht das Zwischenhoch';}
 else if(ruleId==='W_CONFIRMED')meaning='Beim Ausbruch überbotenes, eingefrorenes Zwischenhoch';
 else return {...empty,status:'UNAVAILABLE',label:'Unbekannte Referenzregel'};
 if(!finite(reference)||reference<=0)return {...empty,status:'UNAVAILABLE',label:'Referenz fehlt'};
 const after=points.slice(i+1),lost=after.find(p=>p.close<reference!),broken=structuralLow===null?undefined:after.find(p=>p.close<structuralLow!),age=points.length-1-i,relation=last.close>reference?'ABOVE':last.close<reference?'BELOW':'ON';
 let status:string,label:string,tone:string;
 if(broken){status='STRUCTURE_BROKEN';label='Muster-Tief inzwischen unterschritten';tone='bad';}
 else if(lost&&relation==='BELOW'){status='REFERENCE_LOST';label='Referenz wieder unterschritten';tone='bad';}
 else if(lost){status='RECOVERED_AFTER_LOSS';label='Referenz nach Rückschlag wieder erreicht · kein neues Signal';tone='watch';}
 else if(relation==='BELOW'){status='REFERENCE_LOST';label='Schluss unter der Referenz';tone='bad';}
 else if(relation==='ON'){status='AT_REFERENCE';label='Schluss auf der Referenz · Halt offen';tone='watch';}
 else if(age===0){status='FRESH';label='Frisch erkannt · Folgeverlauf noch offen';tone='watch';}
 else if(age<=FOLLOW_THROUGH_POLICY.recentIntervals){status='HELD';label='Referenz seit Erkennung gehalten';tone='good';}
 else{status='HELD';label='Referenz seit Erkennung gehalten';tone='good';}
 const trajectoryStatus=status;
 if(age>FOLLOW_THROUGH_POLICY.recentIntervals){status='HISTORICAL';tone='neutral';label=broken?'Älterer Befund · Muster-Tief später unterschritten':lost?'Älterer Befund · Referenz zwischenzeitlich verloren':'Älterer Befund · keine frische Bestätigung';}
 return {...empty,status,trajectoryStatus,tone,label,signalDate:event.signalDate,ageIntervals:age,fresh:age===0,recent:age<=FOLLOW_THROUGH_POLICY.recentIntervals,currentAboveReference:relation==='ABOVE',currentRelation:relation,reference,referenceMeaning:meaning,firstReferenceLostDate:lost?.date??null,structuralLow,firstStructuralBreakDate:broken?.date??null,changeSinceSignalPct:pct(last.close,points[i].close),worstCloseSinceSignalPct:pct(Math.min(...points.slice(i).map(p=>p.close)),points[i].close),signalClose:points[i].close,knownAt:event.knownAt,effect:'Beschreibt nur den Verlauf dieses Preiszeichens. Keine Call-/Put-Freigabe, keine Änderung anderer Frühzeichen oder historischer Gewichtungen.'};
}
