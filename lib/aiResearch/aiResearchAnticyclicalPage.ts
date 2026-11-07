export function anticyclicalPage(){return `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Antizyklische Einstiegszonen</title><style>
body{font:16px system-ui;line-height:1.5;background:#0d1520;color:#d8e3ee;max-width:1280px;margin:24px auto;padding:16px}h1,h2,h3{color:#f2f6fa}button,select{font:inherit;background:#1b2d40;color:#f2f6fa;border:1px solid #56708b;border-radius:6px;padding:9px;margin:4px}button:disabled{opacity:.5}article,details{border:1px solid #334b62;border-radius:9px;padding:14px;margin:12px 0}p{margin:8px 0}.muted{color:#9baec0}.green{color:#72dfad}.red{color:#f4a0a5}.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:10px;border-bottom:1px solid #2c4256;text-align:right;vertical-align:top}td:first-child,th:first-child{text-align:left;min-width:210px}small{display:block;color:#9baec0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}summary{cursor:pointer}.error{color:#ffb5b5}
</style><h1>Antizyklische Einstiegszonen</h1><p>FrÃ¼her Einstieg und erste Erholungszeichen im historischen Vergleich. Nasdaq-100 und Russell 2000 getrennt.</p>
<button id="load">Historie auswerten Â· ohne KI</button><label>Folgezeitraum <select id="horizon"><option value="5">5 Intervalle</option><option value="20">20 Intervalle</option><option value="60" selected>60 Intervalle Â· ungefÃ¤hr 3 Monate</option><option value="80">80 Intervalle Â· ungefÃ¤hr 4 Monate</option></select></label>
<p id="state" role="status">Noch kein Abruf. Beim Ã–ffnen startet keine Kurs- oder KI-Abfrage.</p><div id="cards"></div>
<details><summary>Methode und Quellen</summary><p>Sieben feste, nicht optimierte Regeln. GezÃ¤hlt werden bekannte Episodenstarts, nicht jeder Tag desselben Zustands. Ein Signal wird erst am Schluss erkannt; der Vergleich startet am folgenden beobachteten Schluss. Dieser ist eine Rechenreferenz, kein angenommener tatsÃ¤chlicher Kaufkurs.</p><p>Die Haupttabelle zeigt pro Horizont zeitlich getrennte FÃ¤lle. Die Fallauswahl erfolgt ohne Kenntnis ihrer Folgerendite. Alle FÃ¤lle, offene FÃ¤lle und feste KalenderblÃ¶cke bleiben im vollstÃ¤ndigen Ergebnis. Zwischen Indikatoren bestehen gemeinsame PreisabhÃ¤ngigkeiten.</p><p>â€žWeiterer RÃ¼ckgangâ€œ bezeichnet den niedrigsten spÃ¤teren Schluss relativ zum Startschluss. Intraday-Tiefs sind nicht enthalten. Ein RÃ¼ckschlag von 1â€“2 % darf mit einer spÃ¤teren positiven Entwicklung zusammenfallen. Ein kleines Anfangsinvestment oder Aufstocken wird hier noch nicht berechnet oder automatisch freigegeben.</p><p>Historische Indexentwicklungen sind keine Optionsscheinrenditen oder heutigen Erfolgswahrscheinlichkeiten.</p>
<p><a href="https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/RSI" target="_blank" rel="noopener noreferrer">Fidelity: RSI</a> Â· <a href="https://chartschool.stockcharts.com/table-of-contents/market-indicators/bullish-percent-index-bpi" target="_blank" rel="noopener noreferrer">StockCharts: BPI</a> Â· <a href="https://www.cboe.com/tradable-products/volatility-trading" target="_blank" rel="noopener noreferrer">Cboe: VIX</a></p></details>
<details id="full"><summary>VollstÃ¤ndiges Ergebnis Â· zum Kopieren Ã¶ffnen</summary><pre id="out"></pre></details><script>
const el=id=>document.getElementById(id);let data=null,busy=false;
function add(p,t,s){const e=document.createElement(t);e.textContent=s;p.appendChild(e);return e;}
const fmt=n=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('de-DE',{maximumFractionDigits:2}):'â€”';
const pct=n=>typeof n==='number'&&Number.isFinite(n)?(n>0?'+':'')+fmt(n)+' %':'â€”';
function color(e,n){e.className=typeof n==='number'?(n>0?'green':n<0?'red':''):'';return e;}
function render(){el('cards').replaceChildren();if(!data)return;el('out').textContent=JSON.stringify(data,null,2);const h=Number(el('horizon').value);
 if(data.message)add(el('cards'),'p',data.message);
 for(const m of data.markets||[]){const a=add(el('cards'),'article','');add(a,'h2',m.market==='NASDAQ'?'Nasdaq-100':'Russell 2000');
 add(a,'p','Daten: '+(m.firstSuppliedDate||'â€”')+' bis '+(m.lastSuppliedDate||'â€”')+' Â· Untersuchungsbeginn 2012 Â· '+m.coverage.studyObservations+' Beobachtungen.').className='muted';
 if(m.status!=='AVAILABLE'||!m.coverage.historyIncludes2012)add(a,'p','Historische Abdeckung unvollstÃ¤ndig: '+m.status).className='error';
 const f=m.currentFeatures;if(f)add(a,'p','Letzter Stand '+f.date+': RSI14 '+fmt(f.rsi14)+' Â· Abstand vom 252-Schlusskurshoch '+pct(f.drawdown252));
 const wrap=add(a,'div','');wrap.className='scroll';const table=add(wrap,'table',''),thead=add(table,'thead',''),tr=add(thead,'tr','');
 for(const s of ['Konstellation','FÃ¤lle','Median danach','p10 / p90','Positive Folgen','Weiterer RÃ¼ckgang: Median','Nach 1â€“2 % RÃ¼ckschlag positiv'])add(tr,'th',s);
 const tbody=add(table,'tbody','');
 for(const rule of m.studies){const x=rule.horizons.find(x=>x.horizonIntervals===h),s=x.nonOverlapping,row=add(tbody,'tr',''),name=add(row,'td',rule.title);
 add(name,'small',rule.stage==='EARLY_ZONE'?'FrÃ¼he Stresszone':'Erstes Erholungszeichen');add(name,'small',rule.current.active===true?'Am letzten Kurstag erfÃ¼llt':rule.current.active===null?'Aktueller Abgleich nicht verfÃ¼gbar':'Am letzten Kurstag nicht erfÃ¼llt');
 if(rule.current.recentSignalWithin10)add(name,'small','JÃ¼ngstes Signal: '+rule.current.latestSignalDate+' Â· '+rule.current.intervalsSinceSignal+' Intervalle zurÃ¼ck');
 add(row,'td',String(s.matureCases));color(add(row,'td',pct(s.medianReturnPct)),s.medianReturnPct);add(row,'td',pct(s.p10ReturnPct)+' / '+pct(s.p90ReturnPct));
 add(row,'td',s.positiveCount+' / '+s.matureCases);color(add(row,'td',pct(s.medianWorstFurtherCloseChangePct)),s.medianWorstFurtherCloseChangePct);
 add(row,'td',s.positiveEndAfter1to2PctDipCount+' / '+s.dipped1to2PctCases);
 const d=add(a,'details','');add(d,'summary',rule.title+' Â· Einzelheiten');add(d,'p',rule.definition);
 add(d,'p','Alle bekannten Starts: '+rule.knownEpisodeStarts+' Â· Haupttabelle: '+s.matureCases+' reife, '+(s.waitingForAnchor+s.waitingForHorizon)+' noch offene zeitlich getrennte FÃ¤lle.');
 add(d,'p','Mittelwert der ausgewÃ¤hlten FÃ¤lle: '+pct(s.meanReturnPct)+' Â· Mittelwert aller auswertbaren Starttage: '+pct(x.baseline.meanReturnPct)+' Â· Differenz '+fmt(x.excessMeanPp)+' Prozentpunkte.');
 add(d,'p','Schlechtester weiterer SchlusskursrÃ¼ckgang: '+pct(s.worstFurtherCloseChangePct)+' Â· p10 des weiteren RÃ¼ckgangs: '+pct(s.p10WorstFurtherCloseChangePct));
 add(d,'p','Letzte historische FÃ¤lle (nicht nach Erfolg ausgewÃ¤hlt):');
 for(const g of x.byMA200||[])add(d,'p','Signal bei '+(g.state==='BELOW'?'Kurs unter MA200':g.state==='ABOVE_OR_ON'?'Kurs über/auf MA200':'unbekannter MA200-Lage')+': '+g.summary.matureCases+' Fälle · Median '+pct(g.summary.medianReturnPct));
 for(const o of x.episodes.slice(-8))add(d,'p',o.signalDate+' â†’ Start '+(o.anchorDate||'offen')+' â†’ '+(o.endDate||'noch offen')+': '+pct(o.indexReturnPct)+' Â· weiterer RÃ¼ckgang '+pct(o.worstCloseChangePct)+(o.selectedNonOverlapping?' Â· Hauptauswahl':''));
 }
 }
 const sources=add(el('cards'),'details','');add(sources,'summary','Datenabdeckung und Quellenabruf');for(const s of data.sources||[])add(sources,'p',s.symbol+' Â· '+(s.ok?'verfÃ¼gbar':'nicht verfÃ¼gbar')+' Â· '+(s.firstDate||'â€”')+' bis '+(s.lastDate||'â€”')+' Â· '+(s.errorCode||'kein Abruffehler'));
 add(sources,'p','Nicht vorhanden: '+(data.missingHistoricalInputs||[]).join('; '));
}
el('horizon').onchange=render;
el('load').onclick=async()=>{if(busy)return;busy=true;el('load').disabled=true;el('state').textContent='Historische Kurse und FÃ¤lle werden gelesen â€¦';try{const r=await fetch(location.pathname+'?format=json',{cache:'no-store'});const v=await r.json();data=v;render();el('state').textContent=v.ok?'Auswertung abgeschlossen Â· 0 KI-Aufrufe.':'Auswertung derzeit nicht verfÃ¼gbar Â· 0 KI-Aufrufe.';}catch{el('state').textContent='Abruf fehlgeschlagen. Vorhandene Auswertung bleibt sichtbar.';}finally{busy=false;el('load').disabled=false;}};
</script></html>`;}
