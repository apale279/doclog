import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isDoclogAdmin } from '../../lib/doclogUsers';
import { DOCLOG_PMA_ID } from '../../constants';

/** Richiede login. Senza profilo utente abilitato → messaggio + logout. */
export function RequireAuthDoclog() {
  const { user, loading, profile, profileLoading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">Verifica accesso…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile && !profileLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 text-center">
        <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-semibold text-amber-950">
            Account non abilitato in DOCLOG.
          </p>
          <p className="mt-2 text-xs text-amber-900">
            L&apos;utente <strong>{user.email}</strong> non ha un profilo. Chiedi a un amministratore
            di abilitarlo in Impostazioni → Utenti.
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold uppercase text-red-900 hover:bg-red-100"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

/** Solo ADMIN. Altri rank → desk PPI. */
export function RequireAdmin() {
  const { profile, profileLoading } = useAuth();
  if (profileLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-600">
        Caricamento…
      </div>
    );
  }
  if (!isDoclogAdmin(profile)) {
    return <Navigate to={`/pma/${DOCLOG_PMA_ID}`} replace />;
  }
  return <Outlet />;
}
