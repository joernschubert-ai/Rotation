import { researchAuthorized } from '@/lib/aiResearch/aiResearchSession';
import { diagnoseSavedNews } from '@/lib/aiResearch/aiResearchNewsDiagnostic';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const page=`<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nachrichten prüfen</title><style>body{font:16px system-ui;max-width:960px;margin:24px auto;padding:20px;background:#111820;color:#e8edf2}textarea,input,button{font:inherit;box-sizing:border-box;padding:10px}textarea{width:100%;min-height:230px}input{width:100%}button{margin:16px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}article{border:1px solid #617082;border-radius:8px;padding:16px;margin:16px 0}small{display:block}label{display:block;margin-top:16px}</style><h1>Gespeicherte Nachrichten prüfen</h1><p>Hier einen bereits vorhandenen Researchbericht als JSON einfügen. Die Prüfung lädt keine neuen Nachrichten und startet keine KI. Es wird nichts gespeichert. Die normale Research-Auswertung bleibt unverändert.</p><label for="data">Gespeicherter Bericht</label><textarea id="data" spellcheck="false"></textarea><label for="asof">Optional: anderer Analysezeitpunkt mit Zeitzone</label><input id="asof" placeholder="Leer lassen: snapshotTimestamp des Berichts"><p>Veröffentlichungszeit ist nicht Ereigniszeit. Gleiche Themen bedeuten nicht automatisch dasselbe Ereignis. Fehlende Informationen bleiben offen.</p><button id="run">Nachrichten prüfen · ohne KI</button><p id="status" role="status">Noch keine Prüfung.</p><section id="cards"></section><details><summary>Vollständiges Prüfergebnis</summary><pre id="output"></pre></details><script>
const button=document.getElementById('run'),status=document.getElementById('status'),cards=document.getElementById('cards'),out=document.getElementById('output');
const line=(parent,text)=>{const p=document.createElement('p');p.textContent=text;parent.appendChild(p)};
button.onclick=async()=>{button.disabled=true;cards.replaceChildren();out.textContent='';status.textContent='Prüfung läuft …';try{
const payload=JSON.parse(document.getElementById('data').value);const response=await fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload,asOf:document.getElementById('asof').value})});const r=await response.json();out.textContent=JSON.stringify(r,null,2);if(!r.ok)throw Error(r.message||'Prüfung fehlgeschlagen.');
status.textContent=r.cards.length+' Karten · '+r.duplicateSourceCount+' Quellkopien gebündelt · '+r.excluded.length+' ausgeschlossen · 0 KI-Aufrufe. Analysezeitpunkt: '+r.asOf;
for(const c of r.cards){const article=document.createElement('article'),h=document.createElement('h2');h.textContent=c.title;article.appendChild(h);line(article,c.summary||'Nur Überschrift vorhanden.');line(article,'Quelle: '+(c.publisher||'unbekannt')+' · veröffentlicht: '+c.publishedAt);line(article,'Inhalt: '+(c.contentLevel==='EXCERPT'?'Auszug':'Überschrift')+' · '+(c.recency==='OLDER_CONTEXT'?'älterer Kontext':'innerhalb sieben Tagen'));line(article,'Suchhinweise: '+([...c.marketHints,...c.topicHints].join(', ')||'keine'));line(article,'Ereigniszeit, Überraschung, Neuigkeitswert und Kurswirkung: nicht festgestellt.');line(article,'Belege: '+c.sourceIds.join(', ')+' · thematisch verwandte Karten: '+(c.relatedCardIds.join(', ')||'keine'));cards.appendChild(article)}
}catch(e){status.textContent=e.message||'Prüfung fehlgeschlagen. Keine automatische Wiederholung.'}finally{button.disabled=false}};
</script></html>`;
export async function GET(request:Request){
  if(!researchAuthorized(request)) return Response.json({ok:false,message:'Bitte in der App anmelden.',modelRequestsUsed:0},{status:401,headers});
  return new Response(page,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"}});
}
export async function POST(request:Request){
  if(!researchAuthorized(request)) return Response.json({ok:false,message:'Bitte in der App anmelden.',modelRequestsUsed:0},{status:401,headers});
  if(request.headers.get('origin')!==new URL(request.url).origin) return Response.json({ok:false,message:'Ungültiger Anfrageursprung.',modelRequestsUsed:0},{status:403,headers});
  if(!(request.headers.get('content-type')??'').toLowerCase().startsWith('application/json'))return Response.json({ok:false,message:'JSON erforderlich.',modelRequestsUsed:0},{status:415,headers});
  const reader=request.body?.getReader(); if(!reader)return Response.json({ok:false,message:'Bericht fehlt.',modelRequestsUsed:0},{status:400,headers});
  try{
    const chunks:Uint8Array[]=[];let size=0;
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1048576){await reader.cancel();return Response.json({ok:false,message:'Bericht zu groß (maximal 1 MiB).',modelRequestsUsed:0},{status:413,headers});}chunks.push(value);}
    const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.byteLength;}
    const body=JSON.parse(new TextDecoder().decode(all));
    return Response.json(diagnoseSavedNews(body?.payload,typeof body?.asOf==='string'?body.asOf:undefined),{headers});
  }catch{return Response.json({ok:false,message:'Bericht, Quellen oder Analysezeitpunkt ungültig. Erwartet JSON mit sources oder report.sources und snapshotTimestamp; alternativ Analysezeitpunkt angeben.',modelRequestsUsed:0},{status:400,headers});}
  finally{reader.releaseLock();}
}
