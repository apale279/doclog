import { useEffect, useState } from 'react';
import { useManifestationId } from '../../context/ManifestazioneContext';
import { useAuth } from '../../context/AuthContext';
import { DOCLOG_RANK, DOCLOG_RANK_LABEL, normalizeDoclogRank } from '../../lib/doclogUsers';
import {
  createDoclogUser,
  deleteDoclogUserProfile,
  subscribeDoclogUsers,
  updateDoclogUser,
} from '../../services/doclogUsersService';
import { btnPrimary } from '../ui/FormField';
import { SaveFeedback } from './SaveFeedback';

const EMPTY = { email: '', nome: '', password: '', rank: DOCLOG_RANK.PMA };

export function UtentiEditor() {
  const manifestationId = useManifestationId();
  const { user } = useAuth();
  const [utenti, setUtenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const unsub = subscribeDoclogUsers(
      manifestationId,
      (rows) => {
        setUtenti(rows);
        setLoading(false);
      },
      (err) => {
        setError(err?.message ?? 'Errore lettura utenti.');
        setLoading(false);
      },
    );
    return unsub;
  }, [manifestationId]);

  const patch = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  async function creaUtente() {
    setError('');
    setFeedback('');
    setBusy(true);
    try {
      await createDoclogUser(manifestationId, draft);
      setDraft(EMPTY);
      setFeedback('Utente creato.');
    } catch (err) {
      const code = err?.code;
      if (code === 'auth/email-already-in-use') {
        setError('Email già registrata in Firebase Auth.');
      } else if (code === 'auth/operation-not-allowed') {
        setError(
          'Accesso email/password non abilitato nel progetto Firebase (Console → Authentication → Sign-in method).',
        );
      } else {
        setError(err?.message ?? 'Errore creazione utente.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function cambiaRank(uid, rank) {
    setError('');
    try {
      await updateDoclogUser(manifestationId, uid, { rank });
      setFeedback('Rank aggiornato.');
    } catch (err) {
      setError(err?.message ?? 'Errore aggiornamento rank.');
    }
  }

  async function elimina(u) {
    if (u.uid === user?.uid) {
      setError('Non puoi eliminare il tuo stesso account.');
      return;
    }
    if (!window.confirm(`Rimuovere l'accesso a ${u.email}?`)) return;
    setError('');
    try {
      await deleteDoclogUserProfile(manifestationId, u.uid);
      setFeedback('Profilo utente rimosso.');
    } catch (err) {
      setError(err?.message ?? 'Errore rimozione utente.');
    }
  }

  return (
    <section className="rounded border border-slate-300 bg-white p-4">
      <h3 className="mb-1 text-sm font-bold uppercase text-slate-900">Utenti</h3>
      <p className="mb-4 text-xs text-slate-600">
        <strong>Admin</strong>: accesso completo (gestione utenti e impostazioni).{' '}
        <strong>Operatore</strong>: opera normalmente e <strong>riceve la notifica</strong> quando qualcuno
        clicca «Fai entrare paziente».
      </p>

      <div className="mb-5 space-y-2">
        {loading ? (
          <p className="text-sm text-slate-500">Caricamento utenti…</p>
        ) : utenti.length === 0 ? (
          <p className="rounded border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
            Nessun utente. Creane uno qui sotto.
          </p>
        ) : (
          utenti
            .slice()
            .sort((a, b) => String(a.email).localeCompare(String(b.email)))
            .map((u) => (
              <div
                key={u.uid}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{u.email}</p>
                  {u.nome ? <p className="text-xs text-slate-500">{u.nome}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={normalizeDoclogRank(u.rank)}
                    onChange={(e) => void cambiaRank(u.uid, e.target.value)}
                    className="rounded border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    {Object.values(DOCLOG_RANK).map((r) => (
                      <option key={r} value={r}>
                        {DOCLOG_RANK_LABEL[r]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-900 hover:bg-red-100 disabled:opacity-40"
                    disabled={u.uid === user?.uid}
                    onClick={() => void elimina(u)}
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
        <h4 className="mb-3 text-xs font-bold uppercase text-slate-700">Nuovo utente</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-bold uppercase text-slate-700">
            Email *
            <input
              type="email"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm normal-case"
              value={draft.email}
              onChange={(e) => patch('email', e.target.value)}
            />
          </label>
          <label className="block text-xs font-bold uppercase text-slate-700">
            Nome
            <input
              type="text"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm normal-case"
              value={draft.nome}
              onChange={(e) => patch('nome', e.target.value)}
            />
          </label>
          <label className="block text-xs font-bold uppercase text-slate-700">
            Password * (min 6)
            <input
              type="text"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm normal-case"
              value={draft.password}
              onChange={(e) => patch('password', e.target.value)}
            />
          </label>
          <label className="block text-xs font-bold uppercase text-slate-700">
            Rank
            <select
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              value={draft.rank}
              onChange={(e) => patch('rank', e.target.value)}
            >
              {Object.values(DOCLOG_RANK).map((r) => (
                <option key={r} value={r}>
                  {DOCLOG_RANK_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error ? (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-3">
          <button type="button" className={btnPrimary} disabled={busy} onClick={() => void creaUtente()}>
            {busy ? 'Creazione…' : 'Crea utente'}
          </button>
        </div>
      </div>

      <div className="mt-3">
        <SaveFeedback message={feedback} onClear={() => setFeedback('')} />
      </div>
    </section>
  );
}
