import { useState } from 'react';
import { useManifestationId } from '../../context/ManifestazioneContext';
import { useImpostazioni } from '../../hooks/useImpostazioni';
import {
  listaManifestazioniConGenerica,
  manifestazioneAttiva,
} from '../../lib/doclogManifestazioni';
import {
  saveImpostazioniArrayEntryById,
  deleteImpostazioniArrayEntryById,
  saveImpostazioniField,
} from '../../services/impostazioniService';
import { newLocalId } from '../../lib/ids';
import { btnPrimary, btnSecondary } from '../ui/FormField';
import { SaveFeedback } from './SaveFeedback';

const EMPTY = { id: '', nome: '', luogo: '', data: '', note: '' };

export function ManifestazioniEditor() {
  const manifestationId = useManifestationId();
  const { impostazioni, loading } = useImpostazioni();
  const lista = listaManifestazioniConGenerica(impostazioni);
  const attivaId = manifestazioneAttiva(impostazioni).id;

  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const editing = Boolean(draft.id);

  const patch = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const reset = () => setDraft(EMPTY);

  async function salva() {
    setError('');
    setFeedback('');
    if (!draft.nome.trim()) {
      setError('Il nome della manifestazione è obbligatorio.');
      return;
    }
    setBusy(true);
    try {
      const id = draft.id || newLocalId();
      await saveImpostazioniArrayEntryById(manifestationId, 'doclogManifestazioni', {
        id,
        nome: draft.nome.trim(),
        luogo: draft.luogo.trim(),
        data: draft.data.trim(),
        note: draft.note.trim(),
      });
      setFeedback(editing ? 'Manifestazione aggiornata.' : 'Manifestazione creata.');
      reset();
    } catch (err) {
      setError(err?.message ?? 'Errore salvataggio manifestazione.');
    } finally {
      setBusy(false);
    }
  }

  async function impostaAttiva(id) {
    setError('');
    setFeedback('');
    setBusy(true);
    try {
      await saveImpostazioniField(manifestationId, 'manifestazioneAttivaId', id);
      setFeedback('Manifestazione attiva aggiornata.');
    } catch (err) {
      setError(err?.message ?? 'Errore aggiornamento manifestazione attiva.');
    } finally {
      setBusy(false);
    }
  }

  async function elimina(m) {
    if (
      !window.confirm(
        `Eliminare la manifestazione "${m.nome}"? I pazienti collegati non verranno cancellati ma non saranno più visibili finché non riassociati.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await deleteImpostazioniArrayEntryById(manifestationId, 'doclogManifestazioni', m.id);
      if (attivaId === m.id) {
        await saveImpostazioniField(manifestationId, 'manifestazioneAttivaId', '');
      }
      if (draft.id === m.id) reset();
      setFeedback('Manifestazione eliminata.');
    } catch (err) {
      setError(err?.message ?? 'Errore eliminazione manifestazione.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Caricamento manifestazioni…</p>;
  }

  return (
    <section className="rounded border border-sky-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-bold uppercase text-sky-900">Manifestazioni</h3>
      <p className="mb-4 text-xs text-slate-600">
        Ogni manifestazione raggruppa i propri pazienti. Le altre impostazioni (prestazioni,
        farmaci, firma medico…) sono condivise. Seleziona la manifestazione <strong>attiva</strong>:
        i nuovi pazienti verranno raggruppati sotto di essa. Se nessuna è attiva, l&apos;app usa
        automaticamente la <strong>MANIFESTAZIONE GENERICA</strong> (non eliminabile), così non si
        blocca mai.
      </p>

      {/* Elenco */}
      <div className="mb-5 space-y-2">
        {lista.length === 0 ? (
          <p className="rounded border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
            Nessuna manifestazione. Creane una qui sotto per iniziare.
          </p>
        ) : (
          lista.map((m) => {
            const isAttiva = m.id === attivaId;
            return (
              <div
                key={m.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 ${
                  isAttiva ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{m.nome}</span>
                    {isAttiva ? (
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Attiva
                      </span>
                    ) : null}
                    {m.predefinita ? (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        Predefinita
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">
                    {m.predefinita
                      ? 'Usata automaticamente quando nessun\u2019altra è attiva.'
                      : [m.luogo, m.data].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isAttiva ? (
                    <button
                      type="button"
                      className={btnSecondary}
                      disabled={busy}
                      onClick={() => void impostaAttiva(m.id)}
                    >
                      Imposta attiva
                    </button>
                  ) : null}
                  {!m.predefinita ? (
                    <>
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setDraft({ ...EMPTY, ...m })}
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-100"
                        disabled={busy}
                        onClick={() => void elimina(m)}
                      >
                        Elimina
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form crea / modifica */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
        <h4 className="mb-3 text-xs font-bold uppercase text-slate-700">
          {editing ? 'Modifica manifestazione' : 'Nuova manifestazione'}
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold uppercase text-slate-700">
            Nome *
            <input
              type="text"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm normal-case"
              value={draft.nome}
              onChange={(e) => patch('nome', e.target.value)}
            />
          </label>
          <label className="block text-xs font-bold uppercase text-slate-700">
            Luogo
            <input
              type="text"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm normal-case"
              value={draft.luogo}
              onChange={(e) => patch('luogo', e.target.value)}
            />
          </label>
          <label className="block text-xs font-bold uppercase text-slate-700">
            Data (opzionale)
            <input
              type="date"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={draft.data}
              onChange={(e) => patch('data', e.target.value)}
            />
          </label>
          <label className="block text-xs font-bold uppercase text-slate-700 sm:col-span-2">
            Note
            <textarea
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm normal-case"
              rows={2}
              value={draft.note}
              onChange={(e) => patch('note', e.target.value)}
            />
          </label>
        </div>
        {error ? (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} disabled={busy} onClick={() => void salva()}>
            {busy ? 'Salvataggio…' : editing ? 'Salva modifiche' : 'Crea manifestazione'}
          </button>
          {editing ? (
            <button type="button" className={btnSecondary} disabled={busy} onClick={reset}>
              Annulla
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <SaveFeedback message={feedback} onClear={() => setFeedback('')} />
      </div>
    </section>
  );
}
