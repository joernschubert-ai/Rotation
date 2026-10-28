export interface ReturnPeriodFinding {code:string;market?:string;quote?:string;correction:string;}
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
/** Explicit observed N-session return claims only; no classification of forecasts or historical studies. */
export function auditReturnPeriods(blocks:Array<{market:string;body:string}>,indices:Record<string,any>):ReturnPeriodFinding[]{
 const findings:ReturnPeriodFinding[]=[];
 for(const block of blocks){
  const chart=indices[block.market]?.completedChart;if(!chart)continue;
  const windows=Array.isArray(chart.priceTrajectory?.windows)?chart.priceTrajectory.windows:[];
  for(const sentence of block.body.split(/(?<=[.!?])\s+|\n/)){
   if(/historisch|Historie|Mittelwert|\bBasis\b|folgenden|nächsten|Prognose|erwartet|voraussichtlich|zukünftig|könnte|würde|falls|\bwenn\b/i.test(sentence))continue;
   for(const claim of sentence.matchAll(/\b(positiv\w*|negativ\w*)\s+(\d+)\s*[- ]?Sitzungs?[- ]?rendite/gi)){
    const tail=sentence.slice(claim.index!+claim[0].length).split(/;|\s+(?:und|sowie)\s+(?=(?:die\s+|eine\s+)?(?:positive|negative))/i)[0];
    if(/OWN_|ROTATION_|PRICE_VIX|\bKontext\b|[NR]-F-H\d|[NR]-F-PFH\d|historisch|Historie/i.test(tail))continue;
    const sessions=Number(claim[2]),window=windows.find((w:any)=>w.sessions===sessions&&w.toDate===chart.asOfDate);
    const expected=finite(window?.returnPct)?window.returnPct:sessions===20?chart.return20SessionsPct:sessions===5?chart.return5SessionsPct:null;
    if(!finite(expected)||expected===0)continue;
    const positive=/^positiv/i.test(claim[1]);
    if(positive===(expected>0))continue;
    findings.push({code:'OBSERVED_RETURN_SIGN_CONTRADICTION',market:block.market,quote:sentence.trim(),correction:`Beobachtete ${sessions}-Sitzungsrendite: ${Number(expected.toFixed(4))} % (Stand ${chart.asOfDate??'unbekannt'}), also ${expected>0?'positiv':'negativ'}. Nahe null bedeutet nahezu unverändert, ändert aber nicht das Vorzeichen. Historischer Studienkontext ist davon getrennt; frühe Markthypothese bleibt frei.`});
   }
   for(const claim of sentence.matchAll(/(\d+)\s*[- ]?Sitzungs?[- ]?rendite\s*(?:(?:von|beträgt|lag bei|liegt bei|ist|um)\s*)?([+-]?\d+(?:[.,]\d+)?)\s*%/gi)){
    const sessions=Number(claim[1]),reported=Number(claim[2].replace(',','.'));
    const window=windows.find((w:any)=>w.sessions===sessions&&w.toDate===chart.asOfDate);
    const expected=finite(window?.returnPct)?window.returnPct:sessions===20?chart.return20SessionsPct:sessions===5?chart.return5SessionsPct:null;
    if(!finite(expected))continue;
    const decimals=claim[2].split(/[.,]/)[1]?.length??0,tolerance=0.5*Math.pow(10,-decimals)+0.000001;
    if(Math.abs(expected-reported)<=tolerance)continue;
    const latest=chart.priceTrajectory?.magnitudeContext?.latest;
    const day=finite(latest?.returnPct)&&Math.abs(latest.returnPct-reported)<=tolerance?` Die genannte Zahl gehört zum letzten Tagesintervall ${latest.fromDate??'?'} bis ${latest.date??'?'}.`:'';
    findings.push({code:'OBSERVED_RETURN_PERIOD_MISMATCH',market:block.market,quote:sentence.trim(),correction:`Gelieferte beobachtete Rendite über ${sessions} Sitzungsintervalle: ${Number(expected.toFixed(4))} % (Chartstand ${chart.asOfDate??'unbekannt'}).${day} Tagesbewegung, rollierende Rendite und historische Folgerendite getrennt benennen. Das ist eine Faktenkorrektur, keine Widerlegung einer frühen Markthypothese.`});
   }
  }
 }
 return findings;
}
