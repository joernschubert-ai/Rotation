/** Display only: measurement coverage is not an entry rule. */
export function TemporalQualityNote({quality}:{quality:any}){
 if(quality?.policy!=='DATED_STRUCTURAL_HISTORY_V2')return null;
 const complete=quality.complete===true,missing=Array.isArray(quality.missing)?quality.missing:[];
 return <details style={{marginTop:8,marginBottom:8,padding:8,border:'1px solid '+(complete?'#264653':'#73532a'),borderRadius:6,fontSize:11,color:complete?'#86b8c7':'#e0bd83'}}>
 <summary style={{cursor:'pointer'}}>Datierte Vergleiche: {complete?'vollständig':'teilweise verfügbar'} · {quality.anchorDate??'Bezugsdatum fehlt'}</summary>
 <p>{complete?'Gleiche Sitzungsdaten und eigenes Universum verwendet.':'Modellwert teilweise auswertbar. Fehlende Trends sind keine gemessene Nullveränderung.'} Die alte Distributionshistorie bleibt separater Kontext.</p>
 {!complete&&<p>Fehlende Eingänge: {missing.join(', ')||'siehe Datenstand'}</p>}
 <p>Beobachtete Anbieter-Sitzungen; vollständiger Börsenkalender nicht unabhängig verifiziert.</p>
 </details>;
}
