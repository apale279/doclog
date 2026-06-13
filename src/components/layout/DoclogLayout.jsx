import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { RouteErrorBoundary } from '../ui/RouteErrorFallback';
import { DOCLOG_PMA_ID } from '../../constants';
import { useFirestoreSync } from '../../context/FirestoreSyncContext';
import { useManifestationId } from '../../context/ManifestazioneContext';
import { useManifestazioneAttiva } from '../../hooks/useManifestazioneAttiva';
import { useAuth } from '../../context/AuthContext';
import { isDoclogAdmin } from '../../lib/doclogUsers';
import { saveImpostazioniField } from '../../services/impostazioniService';
import { PmaChiamaTriageAlertListener } from '../pma/PmaChiamaTriageAlertListener';

const SPORTIVA_NOME = 'MANIFESTAZIONE SPORTIVA';

function ManifestazioneSportivaToggle() {
  const manifestationId = useManifestationId();
  const { lista, attivaId } = useManifestazioneAttiva();
  const [busy, setBusy] = useState(false);

  const sportiva = lista.find(
    (m) => m.nome.trim().toUpperCase() === SPORTIVA_NOME,
  );
  const checked = Boolean(sportiva && attivaId === sportiva.id);

  const onToggle = async () => {
    if (!sportiva) {
      window.alert(
        `Crea prima la manifestazione «${SPORTIVA_NOME}» in Impostazioni → Manifestazioni.`,
      );
      return;
    }
    if (!checked) {
      if (
        !window.confirm(
          `Attivare «${SPORTIVA_NOME}» come manifestazione corrente?\n\nResterà attiva finché non ne selezioni un'altra manualmente in Impostazioni → Manifestazioni.`,
        )
      ) {
        return;
      }
      setBusy(true);
      try {
        await saveImpostazioniField(manifestationId, 'manifestazioneAttivaId', sportiva.id);
      } catch (e) {
        window.alert(e?.message ?? 'Errore attivazione manifestazione.');
      } finally {
        setBusy(false);
      }
    } else {
      if (
        !window.confirm(
          `Disattivare «${SPORTIVA_NOME}»?\n\nDovrai poi selezionare una manifestazione manualmente.`,
        )
      ) {
        return;
      }
      setBusy(true);
      try {
        await saveImpostazioniField(manifestationId, 'manifestazioneAttivaId', '');
      } catch (e) {
        window.alert(e?.message ?? 'Errore disattivazione manifestazione.');
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <label
      className={`ml-1 inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
        checked
          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
          : 'border-slate-300 text-slate-600 hover:bg-slate-100'
      } ${busy ? 'opacity-60' : ''}`}
      title="Attiva la manifestazione generica per piccoli eventi (es. partite)."
    >
      <input
        type="checkbox"
        className="h-4 w-4 accent-emerald-600"
        checked={checked}
        disabled={busy}
        onChange={() => void onToggle()}
      />
      Manif. sportiva
    </label>
  );
}

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-semibold transition ${
    isActive
      ? 'bg-sky-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`;

function DbStatusBadge() {
  const { online, error } = useFirestoreSync();
  const ok = online && !error;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${
        ok ? 'text-emerald-600' : 'text-red-600'
      }`}
      title={error ? `Errore DB: ${error}` : ok ? 'Database connesso' : 'Database non raggiungibile'}
    >
      <span
        className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}
        aria-hidden
      />
      {ok ? 'DB online' : 'DB offline'}
    </span>
  );
}

export function DoclogLayout() {
  const { pathname } = useLocation();
  const isDesk = pathname === '/' || pathname.startsWith('/pma');
  const { attiva } = useManifestazioneAttiva();
  const { user, profile, logout } = useAuth();
  const admin = isDoclogAdmin(profile);

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <PmaChiamaTriageAlertListener />
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-slate-200 bg-white px-3 py-2 shadow-sm sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Link to={`/pma/${DOCLOG_PMA_ID}`} className="flex items-center gap-2">
            <img src="/logo.svg" alt="DOCLOG" className="h-8 w-8" decoding="async" />
            <span className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tight text-sky-700">DOCLOG</span>
              <DbStatusBadge />
            </span>
          </Link>
          {attiva ? (
            <span className="hidden max-w-[40vw] truncate text-sm font-semibold text-slate-700 sm:inline">
              {attiva.nome}
            </span>
          ) : null}
        </div>
        <nav className="flex flex-wrap items-center justify-end gap-1">
          <NavLink to={`/pma/${DOCLOG_PMA_ID}`} className={() => navLinkClass({ isActive: isDesk })}>
            DASHBOARD
          </NavLink>
          <NavLink to="/pazienti" className={navLinkClass}>
            PAZIENTI
          </NavLink>
          {admin ? (
            <NavLink to="/impostazioni" className={navLinkClass}>
              IMPOSTAZIONI
            </NavLink>
          ) : null}
          {admin ? <ManifestazioneSportivaToggle /> : null}
          <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-2">
            <span className="hidden text-xs text-slate-500 md:inline" title={user?.email ?? ''}>
              {profile?.nome || user?.email}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-red-900 hover:bg-red-100"
            >
              LOGOUT
            </button>
          </div>
        </nav>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto">
        <RouteErrorBoundary>
          <Outlet />
        </RouteErrorBoundary>
      </main>
    </div>
  );
}
