import {describeMarketFrames} from '@/lib/market/dataFrameStatus';
export default function MarketDataStatus({map}:{map:any}){
 const frame=describeMarketFrames(map),warn=frame.status!=='ALIGNED_DATES';
 const label=frame.status==='MIXED_DATES'?'Unterschiedliche Datenstände – aktuelle Signale vorsichtig einordnen':frame.status==='INCOMPLETE_DATES'?'Datenstände teilweise unbekannt':'Datenstände zeitlich zugeordnet';
 return <div role="status" className={`mb-4 border p-3 text-sm ${warn?'border-amber-800 text-amber-200':'border-zinc-700 text-zinc-300'}`}>
  <strong>{label}</strong>
  <div className="mt-1 text-xs">{frame.rows.map(r=>`${r.name}: ${r.date??'unbekannt'}`).join(' · ')}</div>
  <div className="mt-1 text-xs text-zinc-400">Gleicher Kalendertag bestätigt keinen endgültigen Schlusskurs. Einzelaktienkurse werden je beobachtetem Indexdatum und 15-Minuten-Fenster zwischengespeichert; Anbieter können später aktualisieren. Kein automatischer Neuabruf.</div>
 </div>;
}
