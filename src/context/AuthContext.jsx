import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { COLLECTIONS } from '../lib/firestorePaths';
import { useTenantContext } from './TenantContext';
import { setImpostazioniConfigCanEdit } from '../lib/impostazioniEditGate';
import { isDoclogAdmin } from '../lib/doclogUsers';

const AuthContext = createContext(null);

/** Durata massima sessione: logout automatico dopo 6 ore dal login. */
const SESSION_MAX_MS = 6 * 60 * 60 * 1000;
const SESSION_START_KEY = 'doclog.sessionStart';

function readSessionStart() {
  try {
    return Number(window.localStorage.getItem(SESSION_START_KEY) || 0);
  } catch {
    return 0;
  }
}
function writeSessionStart(value) {
  try {
    if (value == null) window.localStorage.removeItem(SESSION_START_KEY);
    else window.localStorage.setItem(SESSION_START_KEY, String(value));
  } catch {
    /* localStorage non disponibile */
  }
}

/**
 * Profilo applicativo per il codice clinico ereditato da CROSS: l'operatore DOCLOG
 * (qualsiasi rank) ha pieni privilegi clinici. Il rank DOCLOG (ADMIN/PMA) vive nel
 * campo `rank` e serve per: gestione utenti/impostazioni (ADMIN) e notifiche (PMA).
 */
function buildProfile(raw) {
  if (!raw) return null;
  return {
    ...raw,
    accessType: 'CENTRALE',
    pmaRank: 'MEDICO',
  };
}

export function AuthProvider({ children }) {
  const { tenantId } = useTenantContext();
  const [user, setUser] = useState(() => auth.currentUser ?? null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loading, setLoading] = useState(() => !auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user || !tenantId) {
      setProfile(null);
      setProfileLoading(false);
      setImpostazioniConfigCanEdit(false);
      return undefined;
    }
    setProfileLoading(true);
    const ref = doc(db, COLLECTIONS.manifestazioni, tenantId, 'userProfiles', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const prof = snap.exists() ? buildProfile(snap.data()) : null;
        setProfile(prof);
        setProfileLoading(false);
        setImpostazioniConfigCanEdit(isDoclogAdmin(prof));
      },
      () => {
        setProfile(null);
        setProfileLoading(false);
        setImpostazioniConfigCanEdit(false);
      },
    );
    return unsub;
  }, [user, tenantId]);

  const login = useCallback(
    async ({ email, password }) => {
      const emailNorm = String(email ?? '').trim();
      if (!emailNorm) throw new Error("Inserisci l'indirizzo email.");
      const cred = await signInWithEmailAndPassword(auth, emailNorm, password);
      writeSessionStart(Date.now());
      if (!tenantId) return null;
      const snap = await getDoc(
        doc(db, COLLECTIONS.manifestazioni, tenantId, 'userProfiles', cred.user.uid),
      );
      const prof = snap.exists() ? buildProfile(snap.data()) : null;
      setProfile(prof);
      return prof;
    },
    [tenantId],
  );

  const logout = useCallback(async () => {
    writeSessionStart(null);
    await signOut(auth);
    setProfile(null);
  }, []);

  // Logout automatico a 6 ore dall'inizio sessione (persistente tra ricaricamenti).
  useEffect(() => {
    if (!user) return undefined;
    let start = readSessionStart();
    if (!start) {
      start = Date.now();
      writeSessionStart(start);
    }
    const elapsed = Date.now() - start;
    if (elapsed >= SESSION_MAX_MS) {
      void logout();
      return undefined;
    }
    const timer = window.setTimeout(() => {
      void logout();
    }, SESSION_MAX_MS - elapsed);
    return () => window.clearTimeout(timer);
  }, [user, logout]);

  const value = useMemo(
    () => ({
      user,
      profile,
      profileLoading,
      loading,
      login,
      logout,
      // compat con codice ereditato
      logActivity: async () => {},
      refreshProfile: async () => profile,
    }),
    [user, profile, profileLoading, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return ctx;
}
