export const CHECK_CONTRACT="CF_COMPREHENSION_CHECK_V1";
export const CHECK_PROMPT="Beantworte sechs einfache Fragen ausschließlich anhand der gelieferten synthetischen Fakten. Dies ist ein Verständnistest, keine Finanzberatung und keine aktuelle Marktanalyse. Gib nur JSON mit Q1 bis Q6 zurück. Wähle je Frage genau eine der angebotenen Antworten. Keine zusätzlichen Erklärungen.";
export function buildComprehensionCheck(){return {test:CHECK_CONTRACT,synthetic:true,questions:[
 {id:"Q1",facts:"Index A: Rendite über fünf Tage minus fünf Prozent, über zwanzig Tage minus zwei Prozent.",question:"Welche Richtung beschreibt die beobachtete Kursbewegung?",choices:["UP","DOWN","UNKNOWN"]},
 {id:"Q2",facts:"Index B: Rendite über fünf Tage plus drei Prozent, über zwanzig Tage plus vier Prozent.",question:"Welche Richtung beschreibt die beobachtete Kursbewegung?",choices:["UP","DOWN","UNKNOWN"]},
 {id:"Q3",facts:"Eine historische Vergleichsgruppe hatte im Mittel eine positive spätere INDEXrendite. Ein Put profitiert bei sonst gleichen Bedingungen von fallenden Indexkursen.",question:"Passt die positive historische INDEXrichtung zur gewünschten Put-Richtung oder wirkt sie dagegen?",choices:["SUPPORTS","OPPOSES","UNKNOWN"]},
 {id:"Q4",facts:"Die Nettoposition einer Gruppe verändert sich von minus achtzig auf minus zwanzig Kontrakte.",question:"Wird der Netto-Shortüberhang kleiner oder größer?",choices:["SMALLER","LARGER","UNCHANGED"]},
 {id:"Q5",facts:"Die Nettoposition einer Gruppe verändert sich von minus zwanzig auf minus achtzig Kontrakte.",question:"Wird der Netto-Shortüberhang kleiner oder größer?",choices:["SMALLER","LARGER","UNCHANGED"]},
 {id:"Q6",facts:"Index A fällt, während Index B steigt. Ein Anleger untersucht einen Call auf Index B.",question:"Beweist der Rückgang von A für sich, dass B ebenfalls fällt?",choices:["YES","NO","UNKNOWN"]}
]};}
export const CHECK_SCHEMA={type:"object",additionalProperties:false,properties:Object.fromEntries(buildComprehensionCheck().questions.map(q=>[q.id,{type:"string",enum:q.choices}])),required:["Q1","Q2","Q3","Q4","Q5","Q6"]};
export function gradeComprehensionCheck(value:unknown){
 const expected:Record<string,string>={Q1:"DOWN",Q2:"UP",Q3:"OPPOSES",Q4:"SMALLER",Q5:"LARGER",Q6:"NO"};
 const raw=value&&typeof value==="object"&&!Array.isArray(value)?value as Record<string,unknown>:{};
 const answers=Object.fromEntries(Object.keys(expected).map(key=>[key,typeof raw[key]==="string"?(raw[key] as string).slice(0,40):null]));
 const issues=Object.keys(expected).filter(key=>answers[key]!==expected[key]).map(key=>"WRONG_OR_MISSING:"+key);
 if(Object.keys(raw).some(key=>!(key in expected)))issues.push("UNEXPECTED_FIELDS");
 return {passed:issues.length===0,issues,answers,expected};
}
