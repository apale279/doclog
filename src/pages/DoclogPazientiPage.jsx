import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLLECTIONS } from '../lib/firestorePaths';
import { useManifestazioneCollection } from '../hooks/useManifestazioneCollection';
import { useManifestazioneAttiva } from '../hooks/useManifestazioneAttiva';
import { DOCLOG_PMA_ID } from '../constants';
import {
  STATO_PZ_PMA,
  normalizeStatoPzPma,
  statoPzPmaLabel,
} from '../lib/pmaModule';

const STATO_BADGE = {
  [STATO_PZ_PMA.IN_ATTESA]: 'bg-orange-100 text-orange-900 border-orange-200',
  [STATO_PZ_PMA.IN_CARICO]: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  [STATO_PZ_PMA.IN_ARRIVO]: 'bg-amber-100 text-amber-900 border-amber-200',
  [STATO_PZ_PMA.DIMESSO]: 'bg-slate-200 text-slate-700 border-slate-300',
};

function pazienteMillis(p) {
  return (
    p.pmaScheda?.dimesso_at?.toMillis?.() ??
    p.pmaScheda?.ingresso_carico_at?.toMillis?.() ??
    p.apertura?.toMillis?.() ??
    0
  );
}

function dataLeggibile(p) {
  const ts =
    p.pmaScheda?.dimesso_at ?? p.pmaScheda?.ingresso_carico_at ?? p.apertura ?? null;
  if (ts?.toDate) return ts.toDate().toLocaleString('it-IT');
  return '—';
}

export default function DoclogPazientiPage() {
  const navigate = useNavigate();
  const { data: pazientiTutti, loading } = useManifestazioneCollection(COLLECTIONS.pazienti);
  const { attiva, attivaId } = useManifestazioneAttiva();
  const [query, setQuery] = useState('');
  const [filtroStato, setFiltroStato] = useState('tutti');

  const righe = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = attivaId
      ? (pazientiTutti ?? []).filter((p) => String(p.doclogManifestazioneId ?? '') === attivaId)
      : [];
    return [...base]
      .filter((p) => {
        const stato = normalizeStatoPzPma(p.statoPzPma);
        if (filtroStato === 'dimessi' && stato !== STATO_PZ_PMA.DIMESSO) return false;
        if (filtroStato === 'attivi' && stato === STATO_PZ_PMA.DIMESSO) return false;
        if (!q) return true;
        const hay = [p.nome, p.cognome, p.idPaziente, p.telefono, p.codice_fiscale]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => pazienteMillis(b) - pazienteMillis(a));
  }, [pazientiTutti, attivaId, query, filtroStato]);

  const apri = (docId) =>
    navigate(`/pma/${encodeURIComponent(DOCLOG_PMA_ID)}/paziente/${encodeURIComponent(docId)}`);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-4">
      <h2 className="mb-1 text-xl font-bold uppercase text-slate-900">Pazienti</h2>
      {attiva ? (
        <p className="mb-4 text-sm text-slate-500">
          Manifestazione attiva: <span className="font-semibold text-slate-700">{attiva.nome}</span>
        </p>
      ) : (
        <p className="mb-4 text-sm text-amber-700">Nessuna manifestazione attiva selezionata.</p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome, cognome, telefono…"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
        <select
          value={filtroStato}
          onChange={(e) => setFiltroStato(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
        >
          <option value="tutti">Tutti</option>
          <option value="attivi">Attivi</option>
          <option value="dimessi">Dimessi (chiusi)</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Caricamento pazienti…</p>
      ) : righe.length === 0 ? (
        <p className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Nessun paziente trovato.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
                <th className="hidden p-2 sm:table-cell">ID</th>
                <th className="p-2">Paziente</th>
                <th className="p-2">Stato</th>
                <th className="hidden p-2 sm:table-cell">Data</th>
                <th className="p-2 text-right">Azione</th>
              </tr>
            </thead>
            <tbody>
              {righe.map((p) => {
                const stato = normalizeStatoPzPma(p.statoPzPma);
                const nomeCompleto =
                  [p.cognome, p.nome].filter(Boolean).join(' ').trim() || '(senza nome)';
                return (
                  <tr
                    key={p._docId}
                    className="cursor-pointer border-b border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-sky-50"
                    onClick={() => apri(p._docId)}
                  >
                    <td className="hidden p-2 font-mono text-xs text-slate-500 sm:table-cell">
                      {p.idPaziente ?? '—'}
                    </td>
                    <td className="p-2 font-semibold text-slate-900">{nomeCompleto}</td>
                    <td className="p-2">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${
                          STATO_BADGE[stato] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {statoPzPmaLabel(p.statoPzPma) ?? '—'}
                      </span>
                    </td>
                    <td className="hidden p-2 text-xs text-slate-600 sm:table-cell">{dataLeggibile(p)}</td>
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          apri(p._docId);
                        }}
                        className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                      >
                        Apri
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
