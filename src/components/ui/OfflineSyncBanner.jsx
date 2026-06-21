import { useFirestoreSync } from '../../context/FirestoreSyncContext';

/** Banner sotto header quando si lavora offline o con sync in sospeso. */
export function OfflineSyncBanner() {
  const {
    browserOnline,
    offlineMode,
    servingFromCache,
    hasPendingWrites,
    lastServerSyncAt,
    error,
  } = useFirestoreSync();

  if (browserOnline && !offlineMode && !hasPendingWrites && !error) {
    return null;
  }

  let tone = 'border-amber-200 bg-amber-50 text-amber-950';
  let title = 'Modalità locale';
  let detail =
    'Stai usando i dati memorizzati su questo dispositivo. Le modifiche restano in coda e verranno inviate a Firebase quando la connessione torna disponibile.';

  if (!browserOnline) {
    title = 'Sei offline';
    detail =
      'Nessuna connessione internet. Puoi continuare a lavorare: lettura dalla cache locale e salvataggi in coda.';
  } else if (hasPendingWrites) {
    title = 'Sincronizzazione in corso';
    detail = 'Ci sono modifiche locali da inviare al database. Resta connesso finché la sync termina.';
    tone = 'border-sky-200 bg-sky-50 text-sky-950';
  } else if (error && !servingFromCache) {
    tone = 'border-red-200 bg-red-50 text-red-950';
    title = 'Database temporaneamente non raggiungibile';
    detail = `${error} — se hai già aperto l'app online, i dati in cache restano utilizzabili.`;
  }

  const syncHint = lastServerSyncAt
    ? `Ultimo aggiornamento dal server: ${lastServerSyncAt.toLocaleTimeString('it-IT')}.`
    : 'Apri l\'app almeno una volta online per scaricare i dati sul dispositivo.';

  return (
    <div className={`shrink-0 border-b px-3 py-2 text-xs leading-snug sm:px-4 ${tone}`} role="status">
      <p className="font-bold uppercase tracking-wide">{title}</p>
      <p className="mt-0.5">{detail}</p>
      <p className="mt-1 opacity-80">{syncHint}</p>
    </div>
  );
}
