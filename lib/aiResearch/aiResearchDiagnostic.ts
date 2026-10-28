import { RESEARCH_MODEL, RESEARCH_TRANSPORT_PROFILE, researchTransport } from './aiResearchModel';
import { createHash, randomBytes } from 'node:crypto';
import { Redis } from '@upstash/redis';

const PREFIX='rotation:research:cf:v1';
const MODEL=RESEARCH_MODEL;
export const DIAGNOSTIC_VERSION='V60_GEMMA_FIXED_MICRO_CASES_20261021';
export const DIAGNOSTIC_FACTS={
 source:'Gespeicherter Nutzerbericht V31; Schlusskursstand 2026-10-16. Keine Live-Marktanalyse.',
 maCase:{index:'NASDAQ_100',close:29187.55078125,ma20:30524.2131,ma50:29867.9957,ma200:27737.9812},
 historyCase:{index:'NASDAQ_100',horizonSessions:20,conditionalMeanPct:2.5,unconditionalBaselineMeanPct:1.49,excessMeanPp:1.01,
  sample:'Überlappende historische Fälle; keine Signifikanztests, Konfidenzintervalle oder Optionspreise geliefert.'},
 reversalCase:{index:'RUSSELL_2000',close:2721.3701171875,ma20:2810.3525,ma50:2907.5112,ma200:2794.635,return5SessionsPct:-3.0499,
  pointFigure:{currentColumn:'O',latestEvent:'Bruch unter vorheriges O-Tief',eventDate:'2026-09-10'},
  assetManagerNet:29528,assetManagerDelta1Week:-15967,assetManagerDelta4Weeks:5255,assetManagerDelta13Weeks:21974,
  cotObservationDate:'2026-10-12'}
} as const;
const text={type:'string',minLength:15,maxLength:550};
const object=(properties:Record<string,unknown>)=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const choice=(values:string[])=>({type:'string',enum:values});
export const DIAGNOSTIC_SCHEMA=object({
 ma:object({ma20:choice(['ABOVE','BELOW','EQUAL','UNKNOWN']),ma50:choice(['ABOVE','BELOW','EQUAL','UNKNOWN']),ma200:choice(['ABOVE','BELOW','EQUAL','UNKNOWN']),explanation:text}),
 history:object({conditionalMeanPct:{type:'number'},baselineMeanPct:{type:'number'},excessMeanPp:{type:'number'},
  predictsNextReturn:choice(['YES','NO','UNKNOWN']),significanceTestAvailable:choice(['YES','NO','UNKNOWN']),explanation:text}),
 reversal:object({priceVsMA200:choice(['ABOVE','BELOW','EQUAL','UNKNOWN']),supportAtMA200Established:choice(['YES','NO','UNKNOWN']),
  recoveryEstablished:choice(['YES','NO','UNKNOWN']),observation:text,conditionalHypothesis:text,counterevidence:text})
});
export const DIAGNOSTIC_PROMPT=`Drei unabhängige kleine Faktenprüfungen. Antworte kurz auf Deutsch gemäß Schema. Keine Handelsurteile, Gewichte oder Kursprognosen.
ma: Vergleiche ausschließlich den Schlusskurs mit jedem Durchschnitt und erkläre die Lage.
history: Unterscheide bedingten Renditemittelwert, unbedingten Basismittelwert und Differenz in Prozentpunkten. Ist damit die nächste Rendite vorhergesagt? Wurde ein Signifikanztest geliefert?
reversal: Prüfe den Kurs relativ zur MA200. Ist Unterstützung an dieser MA bereits belegt und eine Erholung bereits nachgewiesen? Trenne Beobachtung, eine mögliche künftige Wendebedingung und stärkste Gegenevidenz. Eine fehlende Bestätigung verbietet keine bedingte Frühhypothese. Erfinde keine beobachtete Bodenbildung und keinen Wissensvorsprung.
Keine Beispiele aus den anderen Fällen übernehmen. /no_think`;

type Answer=Record<string,any>;
const obj=(v:unknown):Answer=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Answer:{};
export function gradeDiagnostic(raw:unknown){
 const data=obj(raw),ma=obj(data.ma),history=obj(data.history),reversal=obj(data.reversal);
 const checks=[
  {id:'NASDAQ_MA20',pass:ma.ma20==='BELOW'},
  {id:'NASDAQ_MA50',pass:ma.ma50==='BELOW'},
  {id:'NASDAQ_MA200',pass:ma.ma200==='ABOVE'},
  {id:'HISTORY_MEAN',pass:history.conditionalMeanPct===2.5},
  {id:'HISTORY_BASELINE',pass:history.baselineMeanPct===1.49},
  {id:'HISTORY_EXCESS_PP',pass:typeof history.excessMeanPp==='number'&&Math.abs(history.excessMeanPp-1.01)<0.00001},
  {id:'HISTORY_NOT_NEXT_RETURN',pass:history.predictsNextReturn==='NO'},
  {id:'HISTORY_NO_SIGNIFICANCE_TEST',pass:history.significanceTestAvailable==='NO'},
  {id:'RUSSELL_MA200',pass:reversal.priceVsMA200==='BELOW'},
  {id:'RUSSELL_SUPPORT_NOT_ESTABLISHED',pass:reversal.supportAtMA200Established==='NO'},
  {id:'RUSSELL_RECOVERY_NOT_ESTABLISHED',pass:reversal.recoveryEstablished==='NO'}
 ];
 const missingText=[ma.explanation,history.explanation,reversal.observation,reversal.conditionalHypothesis,reversal.counterevidence].some(v=>typeof v!=='string'||v.trim().length<15);
 return {checks,passed:checks.filter(c=>c.pass).length,total:checks.length,complete:!missingText,
  note:'Nur die elf expliziten Zahlen-/Auswahlfelder automatisch geprüft. Freie Erklärungen und Frühhypothese müssen separat gelesen werden; kein Nachweis von Prognosegüte.'};
}

export const PLAIN_DIAGNOSTIC_VERSION='V60_GEMMA_FIXED_MICRO_CASES_PLAIN_20261021';
// Change only the output-format instruction; all three questions and facts stay identical.
export const PLAIN_DIAGNOSTIC_PROMPT=DIAGNOSTIC_PROMPT.replace('gemäß Schema','in normalem Text ohne JSON-Vorgabe');
export async function runFixedDiagnostic(mode:'structured'|'plain'='structured'){
 const plain=mode==='plain',version=plain?PLAIN_DIAGNOSTIC_VERSION:DIAGNOSTIC_VERSION;
 const prompt=plain?PLAIN_DIAGNOSTIC_PROMPT:DIAGNOSTIC_PROMPT;
 const base={version,model:MODEL,transportProfile:RESEARCH_TRANSPORT_PROFILE,facts:DIAGNOSTIC_FACTS,modelRequestsUsed:0};
 const fail=(message:string)=>({...base,ok:false,message});
 const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID;
 if(!token||!account||!/^[a-f0-9]{32}$/i.test(account))return fail('Cloudflare-Konfiguration fehlt. Kein Aufruf gestartet.');
 const redis=Redis.fromEnv();
 const identity=JSON.stringify({version,model:MODEL,transportProfile:RESEARCH_TRANSPORT_PROFILE,temperature:0.7,max_tokens:1400,prompt,schema:plain?null:DIAGNOSTIC_SCHEMA,facts:DIAGNOSTIC_FACTS});
 const cacheKey=PREFIX+':diagnostic:'+createHash('sha256').update(identity).digest('hex');
 const lockKey=PREFIX+':lock',lockToken=randomBytes(16).toString('hex');
 let locked=false,started=false;
 try{
  const cached=await redis.get<Answer>(cacheKey);
  if(cached)return {...cached,cached:true,modelRequestsUsed:0};
  locked=Boolean(await redis.set(lockKey,lockToken,{nx:true,ex:60}));
  if(!locked)return fail('Eine KI-Analyse läuft bereits. Kein weiterer Aufruf gestartet.');
  const completed=await redis.get<Answer>(cacheKey);
  if(completed)return {...completed,cached:true,modelRequestsUsed:0};
  const admitted=await redis.eval<string[],number>(
   "if redis.call('GET',KEYS[3])~=ARGV[2] then return -3 end if redis.call('EXISTS',KEYS[2])==1 then return -1 end local n=tonumber(redis.call('GET',KEYS[1]) or '0') if n>=tonumber(ARGV[1]) then return -2 end redis.call('INCR',KEYS[1]) redis.call('EXPIRE',KEYS[1],172800) redis.call('SET',KEYS[2],'1','EX',90) return n+1",
   [PREFIX+':day:'+new Date().toISOString().slice(0,10),PREFIX+':cooldown',lockKey],['20',lockToken]);
  if(admitted<0)return fail(admitted===-2?'Das bestehende Tageslimit ist erreicht. Kein Aufruf gestartet.':admitted===-1?'Die bestehende Aufrufpause ist aktiv. Kein Aufruf gestartet.':'Der laufende Aufruf konnte nicht fortgesetzt werden.');
  started=true;
  const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/ai/run/'+MODEL,{
   method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(35000),
   body:JSON.stringify(researchTransport({temperature:0.7,max_tokens:1400,...(plain?{}:{response_format:{type:'json_schema',json_schema:DIAGNOSTIC_SCHEMA}}),
    messages:[{role:'system',content:prompt},{role:'user',content:JSON.stringify(DIAGNOSTIC_FACTS)}]}))});
  if(!response.ok)return {...fail('Cloudflare antwortet mit HTTP '+response.status+'. Kein Wiederholungsaufruf.'),modelRequestsUsed:1};
  const body=await response.json(),finish=body?.result?.choices?.[0]?.finish_reason;
  const raw=body?.result?.choices?.[0]?.message?.content??body?.result?.response;
  if(plain){
   if(body?.success!==true||finish==='length'||typeof raw!=='string'||raw.trim().length<15)return {...fail('Die freie Diagnoseantwort fehlt oder ist abgeschnitten. Kein Wiederholungsaufruf.'),modelRequestsUsed:1};
   const result={...base,ok:true,cached:false,generatedAt:new Date().toISOString(),modelRequestsUsed:1,
    answerText:raw,grading:{automaticScore:null,manualReviewRequired:true,note:'Freitext unverändert erhalten. Kursrelationen, historische Bedeutung und Wendeargument getrennt manuell prüfen; keine automatische Wahrheitsprüfung.'},
    comparison:{baseline:'V32_FIXED_MICRO_CASES_20261016',changed:'Freier Diagnosemodus ohne response_format. Gegenüber der historischen V32-Basis zusätzlich Gemma im Direktmodus statt Qwen; kein isolierter Formatvergleich.',unchanged:'Identische drei Fragen und Fakten, Temperatur 0,7, /no_think, 1400 Tokens und 35 Sekunden.'},
    message:'Freie Gegenprobe, keine aktuelle Markt- oder Einstiegsauswertung. Eine einzelne Antwort beweist keine Ursache.'};
   try{await redis.set(cacheKey,result,{ex:86400});}catch{/* Return the completed answer without a retry. */}
   return result;
  }
  let answer:Answer;
  try{answer=typeof raw==='string'?obj(JSON.parse(raw)):obj(raw);}catch{return {...fail('Die Diagnoseantwort ist kein vollständiges JSON. Kein Wiederholungsaufruf.'),modelRequestsUsed:1};}
  if(body?.success!==true||finish==='length'||!Object.keys(answer).length)return {...fail('Die Diagnoseantwort fehlt oder ist abgeschnitten. Kein Wiederholungsaufruf.'),modelRequestsUsed:1};
  const result={...base,ok:true,cached:false,generatedAt:new Date().toISOString(),modelRequestsUsed:1,answer,grading:gradeDiagnostic(answer),
   message:'Feste kleine Gegenprobe, keine aktuelle Markt- oder Einstiegsauswertung. Erfolgreicher Abruf bedeutet nicht, dass die Erklärung richtig ist.'};
  try{await redis.set(cacheKey,result,{ex:86400});}catch{/* The completed answer remains available to the caller. */}
  return result;
 }catch(error){return {...fail(/timeout|abort/i.test(String(obj(error).name??''))?'Cloudflare hat nicht rechtzeitig geantwortet. Kein Wiederholungsaufruf.':'Diagnose oder dauerhafter Aufrufschutz derzeit nicht erreichbar. Kein Wiederholungsaufruf.'),modelRequestsUsed:started?1:0};}
 finally{if(locked)try{await redis.eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",[lockKey],[lockToken]);}catch{/* Lock expires automatically. */}}
}

