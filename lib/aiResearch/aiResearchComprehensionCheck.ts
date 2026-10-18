import { buildInstrumentBriefs } from "./aiResearchInstrumentBriefs";
import type { SynthesisEvidence } from "./aiResearchSynthesisEvidence";
export const CHECK_CONTRACT="CF_REAL_NASDAQ_CHECK_V2";
export const CHECK_PROMPT="Analysiere ausschließlich die gelieferten echten Nasdaq-Fakten. Antworte als JSON. priceDirection beschreibt die beobachtete Fünftagesrichtung. historicalPutEffect beschreibt, ob die mittlere historische spätere INDEXrichtung zur fallenden Put-Richtung passt. cotShortChange beschreibt den gewählten wöchentlichen Netto-Shortüberhang. historicalMeanProvesEntry beantwortet, ob ein historischer Mittelwert allein einen heutigen Einstieg beweist. Schreibe balance als eigenständige deutsche Abwägung in drei kurzen Sätzen: aktuelle Nasdaq-Lage und Struktur, entgegenstehender historischer Kontext, verbleibende Unsicherheit/fehlende Entwicklung. Keine allgemeinen Lehrsätze statt Faktenbezug, keine Orders, keine erfundenen Chartmarken, keine Optionsgewinne. Wenn Fakten fehlen, benenne die Lücke. Die getrennten Faktenfragen sind keine Handelsempfehlung.";
const object=(v:unknown):Record<string,any>=>v&&typeof v==="object"?v as Record<string,any>:{};
export function buildComprehensionCheck(evidence:SynthesisEvidence[]=[]){
 const b=buildInstrumentBriefs(evidence).find(b=>b.instrument==="NASDAQ_PUT");
 const structure=object(object(evidence.find(e=>e.id==="APP")?.data.instrumentStructure).NASDAQ);
 const study=b?.histories.find(h=>h.family==="OWN_TREND")??null;
 const cot=b?.cot.find(g=>g.group==="LEVERAGED_MONEY")??null;
 return {test:CHECK_CONTRACT,synthetic:false,market:"NASDAQ100",currentIndex:b?.price??null,ownStructure:structure,
 historicalStudy:study,cotOneWeek:cot?{group:cot.group,reportDate:cot.reportDate,previousNet:cot.previousWeekNet,currentNet:cot.netPosition,fact:cot.weeklyFact}:null,
 limits:"Descriptive overlapping historical index outcomes, not option returns. Delayed TFF-COT net positioning, not gross transactions or a validated timing rule. No chart or options valuation supplied."};
}
export const CHECK_SCHEMA={type:"object",additionalProperties:false,properties:{
 priceDirection:{type:"string",enum:["UP","DOWN","FLAT","UNKNOWN"]},historicalPutEffect:{type:"string",enum:["SUPPORTS","OPPOSES","NEUTRAL","UNKNOWN"]},
 cotShortChange:{type:"string",enum:["SMALLER","LARGER","UNCHANGED","UNKNOWN"]},historicalMeanProvesEntry:{type:"string",enum:["YES","NO"]},balance:{type:"string"}},
 required:["priceDirection","historicalPutEffect","cotShortChange","historicalMeanProvesEntry","balance"]};
export function gradeComprehensionCheck(value:unknown,evidence:SynthesisEvidence[]=[]){
 const facts=buildComprehensionCheck(evidence),p=facts.currentIndex?.momentum5D,m=facts.historicalStudy?.meanPct,c=facts.cotOneWeek;
 const expected:Record<string,string>={priceDirection:typeof p!=="number"?"UNKNOWN":p<0?"DOWN":p>0?"UP":"FLAT",historicalPutEffect:typeof m!=="number"?"UNKNOWN":m>0?"OPPOSES":m<0?"SUPPORTS":"NEUTRAL",
 cotShortChange:typeof c?.currentNet!=="number"||typeof c?.previousNet!=="number"||c.currentNet>=0||c.previousNet>=0?"UNKNOWN":c.currentNet>c.previousNet?"SMALLER":c.currentNet<c.previousNet?"LARGER":"UNCHANGED",historicalMeanProvesEntry:"NO"};
 const raw=object(value),answers=Object.fromEntries([...Object.keys(expected),"balance"].map(k=>[k,typeof raw[k]==="string"?raw[k].slice(0,1600):null]));
 const issues=Object.keys(expected).filter(k=>answers[k]!==expected[k]).map(k=>"WRONG_OR_MISSING:"+k);
 if(typeof answers.balance!=="string"||answers.balance.length<80||answers.balance.length>1500)issues.push("MISSING_OR_OVERSIZED_BALANCE");
 if(Object.keys(raw).some(k=>!(k in expected)&&k!=="balance"))issues.push("UNEXPECTED_FIELDS");
 return {passed:issues.length===0,issues,answers,expected};
}
