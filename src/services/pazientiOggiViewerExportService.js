import { filterPazientiVistiOggi } from '../lib/pazientiOggiFilter';
import { downloadPazientiOggiViewerZip } from '../lib/pazientiViewerExport';

/**
 * Esporta ZIP viewer per pazienti visti oggi (manifestazione attiva).
 * @param {object[]} pazientiTutti snapshot da Firestore
 * @param {string | null | undefined} attivaId doclogManifestazioneId attiva
 * @param {string} manifestazioneNome etichetta manifestazione
 */
export async function exportPazientiOggiViewerZip(pazientiTutti, attivaId, manifestazioneNome) {
  const base = attivaId
    ? (pazientiTutti ?? []).filter((p) => String(p.doclogManifestazioneId ?? '') === attivaId)
    : [];
  const oggi = filterPazientiVistiOggi(base);
  if (oggi.length === 0) {
    throw new Error('Nessun paziente visto oggi per la manifestazione attiva.');
  }
  const meta = await downloadPazientiOggiViewerZip(oggi, { manifestazioneNome });
  return { count: oggi.length, meta };
}
