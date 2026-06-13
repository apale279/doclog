/** Helpers per le manifestazioni DOCLOG (raggruppano i pazienti, impostazioni condivise). */

/**
 * Paracadute: manifestazione predefinita sempre disponibile. Quando nessuna
 * manifestazione è attiva (o quella attiva è stata eliminata) l'app usa questa,
 * così non si blocca mai. Non è eliminabile.
 */
export const MANIFESTAZIONE_GENERICA = Object.freeze({
  id: 'generica',
  nome: 'MANIFESTAZIONE GENERICA',
  luogo: '',
  data: '',
  note: '',
  predefinita: true,
});

export function listaManifestazioni(impostazioni) {
  return (impostazioni?.doclogManifestazioni ?? [])
    .map((m) => ({
      id: String(m?.id ?? '').trim(),
      nome: String(m?.nome ?? '').trim(),
      luogo: String(m?.luogo ?? '').trim(),
      data: String(m?.data ?? '').trim(),
      note: String(m?.note ?? '').trim(),
    }))
    .filter((m) => m.id && m.nome && m.id !== MANIFESTAZIONE_GENERICA.id);
}

/** Elenco mostrato nei selettori: include sempre la generica (in cima). */
export function listaManifestazioniConGenerica(impostazioni) {
  return [MANIFESTAZIONE_GENERICA, ...listaManifestazioni(impostazioni)];
}

export function manifestazioneAttivaId(impostazioni) {
  return String(impostazioni?.manifestazioneAttivaId ?? '').trim();
}

export function findManifestazione(impostazioni, id) {
  const key = String(id ?? '').trim();
  if (!key) return null;
  if (key === MANIFESTAZIONE_GENERICA.id) return MANIFESTAZIONE_GENERICA;
  return listaManifestazioni(impostazioni).find((m) => m.id === key) ?? null;
}

/** Manifestazione attiva «effettiva»: mai null → fallback alla generica. */
export function manifestazioneAttiva(impostazioni) {
  return findManifestazione(impostazioni, manifestazioneAttivaId(impostazioni)) ?? MANIFESTAZIONE_GENERICA;
}

/** Etichetta sintetica: «Nome — Luogo (data)». */
export function manifestazioneLabel(m) {
  if (!m) return '';
  const parti = [m.nome];
  const extra = [m.luogo, m.data].filter(Boolean).join(' · ');
  if (extra) parti.push(extra);
  return parti.filter(Boolean).join(' — ');
}
