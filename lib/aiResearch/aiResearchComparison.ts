import { createHash, randomBytes } from 'node:crypto';
import { Redis } from '@upstash/redis';
const PREFIX='rotation:research:cf:v1';
const ROOT=PREFIX+':full-comparison:v1';
export const COMPARISON_MODELS={qwen:'@cf/qwen/qwen3-30b-a3b-fp8',glm:'@cf/zai-org/glm-4.7-flash',nemotron:'@cf/nvidia/nemotron-3-120b-a12b',gemma:'@cf/google/gemma-4-26b-a4b-it'} as const;
export type FrozenResearch={id:string;createdAt:string;snapshotTimestamp:string;body:{temperature:number;max_tokens:number;messages:Array<{role:'system'|'user';content:string}>};note:string};
export function freezeRequest(snapshotTimestamp:string,system:string,user:string,temperature:number,maxTokens:number):FrozenResearch{
 const body={temperature,max_tokens:maxTokens,messages:[{role:'system' as const,content:system},{role:'user' as const,content:user}]};
 return {id:createHash('sha256').update(JSON.stringify(body)).digest('hex'),createdAt:new Date().toISOString(),snapshotTimestamp,body,
  note:'Prepared full research request. Same messages and sampling budget for each selected model. Not a microcase and not proof this exact request was previously sent.'};
}
export async function saveFrozenRequest(redis:Redis,value:FrozenResearch,options:{updateLatest?:boolean}={}){
 // Diagnostic capture is optional and never blocks normal research.
 try{await redis.set(ROOT+':input:'+value.id,value,{ex:86400,nx:true});if(options.updateLatest!==false)await redis.set(ROOT+':latest',value.id,{ex:86400});}catch{/* Existing normal flow remains available. */}
}
export async function readFrozenRequest(id?:string){
 const redis=Redis.fromEnv();const selected=id??await redis.get<string>(ROOT+':latest');
 if(typeof selected!=='string'||!/^[a-f0-9]{64}$/.test(selected))return null;
 return redis.get<FrozenResearch>(ROOT+':input:'+selected);
}
export function comparisonBody(value:FrozenResearch){
 const b=value.body;
 if(!b||!Number.isFinite(b.temperature)||b.temperature!==0.7||b.max_tokens!==2200||b.messages.length!==2||
 b.messages[0].role!=='system'||b.messages[1].role!=='user'||typeof b.messages[0].content!=='string'||typeof b.messages[1].content!=='string'||b.messages[1].content.length>26000)throw Error('Invalid frozen request');
 if(createHash('sha256').update(JSON.stringify(b)).digest('hex')!==value.id)throw Error('Invalid frozen hash');
 return b;
}
export function comparisonTransport(body:FrozenResearch['body'],variant:keyof typeof COMPARISON_MODELS){
 return (variant==='glm'||variant==='nemotron'||variant==='gemma')?{...body,chat_template_kwargs:{enable_thinking:false}}:body;
}
export function comparisonFailure(error:unknown,stage:string,elapsedMs:number){
 const name=error&&typeof error==='object'&&'name'in error?String(error.name):'';
 const timeout=name==='TimeoutError'||name==='AbortError';
 return {failureStage:stage,failureKind:timeout?'REQUEST_TIMEOUT':stage==='RESPONSE_JSON'?'INVALID_RESPONSE_JSON':stage==='PROVIDER_REQUEST'?'NETWORK_OR_TRANSPORT':'COMPARISON_PROCESSING',elapsedMs,
  message:timeout?'Cloudflare-Aufruf nach spätestens 45 Sekunden abgebrochen. Keine automatische Wiederholung.':stage==='RESPONSE_JSON'?'Cloudflare lieferte keine lesbare JSON-Antwort. Keine automatische Wiederholung.':stage==='PROVIDER_REQUEST'?'Netzwerk-/Transportfehler beim Cloudflare-Aufruf. Keine automatische Wiederholung.':'Fehler bei Vorbereitung oder Verarbeitung des Vergleichs. Keine automatische Wiederholung.'};
}
export async function runFullComparison(id:string,variant:keyof typeof COMPARISON_MODELS){
 const model=COMPARISON_MODELS[variant];
 if(!model)return {ok:false,message:'Ungültiges Vergleichsmodell.',modelRequestsUsed:0};
 const value=await readFrozenRequest(id);if(!value)return {ok:false,message:'Eingabe fehlt oder ist abgelaufen. Vergleichsseite neu öffnen.',modelRequestsUsed:0};
 const body=comparisonBody(value);
 const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID;
 if(!token||!account||!/^[a-f0-9]{32}$/i.test(account))return {ok:false,message:'Cloudflare-Konfiguration fehlt.',modelRequestsUsed:0};
 const redis=Redis.fromEnv(),lockKey=PREFIX+':lock',lockToken=randomBytes(16).toString('hex');
 // Preserve cached Qwen baseline; GLM direct mode is a distinct experiment.
 const key=ROOT+':result:'+id+':'+variant+(variant==='glm'?':direct-v44':'');let locked=false,started=false;
 const startedAt=Date.now();let stage='CACHE_READ',headersAfterMs:number|null=null;
 try{
  const cached=await redis.get<Record<string,unknown>>(key);if(cached)return {...cached,cached:true,modelRequestsUsed:0};
  stage='LOCK_ACQUIRE';locked=Boolean(await redis.set(lockKey,lockToken,{nx:true,ex:60}));
  if(!locked)return {ok:false,message:'Eine Analyse läuft bereits. Kein Aufruf gestartet.',modelRequestsUsed:0};
  const existing=await redis.get<Record<string,unknown>>(key);if(existing)return {...existing,cached:true,modelRequestsUsed:0};
  stage='QUOTA_CHECK';const admitted=await redis.eval<string[],number>(
   "if redis.call('GET',KEYS[3])~=ARGV[2] then return -3 end if redis.call('EXISTS',KEYS[2])==1 then return -1 end local n=tonumber(redis.call('GET',KEYS[1]) or '0') if n>=tonumber(ARGV[1]) then return -2 end redis.call('INCR',KEYS[1]) redis.call('EXPIRE',KEYS[1],172800) redis.call('SET',KEYS[2],'1','EX',90) return n+1",
   [PREFIX+':day:'+new Date().toISOString().slice(0,10),PREFIX+':cooldown',lockKey],['20',lockToken]);
  if(admitted<0)return {ok:false,message:admitted===-2?'Tageslimit erreicht.':admitted===-1?'Aufrufpause aktiv; 90 Sekunden Abstand einhalten.':'Aufrufschutz hat abgelehnt.',modelRequestsUsed:0};
  started=true;stage='PROVIDER_REQUEST';
  const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+'/ai/run/'+model,{
   method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(45000),body:JSON.stringify(comparisonTransport(body,variant))});
  headersAfterMs=Date.now()-startedAt;
  if(!response.ok)return {ok:false,model,inputId:id,message:'Cloudflare HTTP '+response.status+'. Keine Wiederholung und kein Modellwechsel.',modelRequestsUsed:1};
  stage='RESPONSE_JSON';const data=await response.json(),result=data?.result,choice=result?.choices?.[0];
  const text=choice?.message?.content??result?.response,finish=choice?.finish_reason??result?.finish_reason??null;
  const answer={ok:data?.success===true&&typeof text==='string'&&text.trim().length>0,cached:false,model,inputId:id,snapshotTimestamp:value.snapshotTimestamp,generatedAt:new Date().toISOString(),
   modelRequestsUsed:1,answerText:typeof text==='string'?text:null,finishReason:finish,truncated:finish==='length',usage:result?.usage??null,
   timing:{elapsedMs:Date.now()-startedAt,headersAfterMs,timeoutMs:45000},
   transportProfile:variant==='glm'?'GLM_DIRECT_V44':variant==='nemotron'?'NEMOTRON_DIRECT_V46':variant==='gemma'?'GEMMA_DIRECT_V47':'QWEN_ORIGINAL_V43',
   comparison:'Identischer eingefrorener System-/Nutzertext, Temperatur 0,7 und 2200 Ausgabetokens. GLM, Nemotron und Gemma setzen zusätzlich den dokumentierten Parameter chat_template_kwargs.enable_thinking=false. Qwen unverändert; Nemotron und Gemma nutzen denselben dokumentierten Direktmodus. Vergleich beider konfigurierter Aufrufwege, keine isolierte Modellmessung bei identischem Denkmodus.',
   reviewRequired:'MA-Lage, COT-Netto/Änderung, historische Zahlen, Zeiträume, Instrumentrichtung und frühe Hypothesen manuell prüfen. Kein automatischer Wahrheitsscore.'};
  try{await redis.set(key,answer,{ex:86400});}catch{/* Return without replay. */}return answer;
 }catch(error){const failure={ok:false,model,inputId:id,...comparisonFailure(error,stage,Date.now()-startedAt),headersAfterMs,transportProfile:variant==='glm'?'GLM_DIRECT_V44':variant==='nemotron'?'NEMOTRON_DIRECT_V46':variant==='gemma'?'GEMMA_DIRECT_V47':'QWEN_ORIGINAL_V43',modelRequestsUsed:started?1:0};
  if(started)try{await redis.set(key,failure,{ex:900});}catch{/* Do not retry failed inference. */}return failure;}
 finally{if(locked)try{await redis.eval("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",[lockKey],[lockToken]);}catch{/* Lock expires. */}}
}


