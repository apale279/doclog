import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { waitForPendingWrites } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const FirestoreSyncContext = createContext(null);

function readBrowserOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/**
 * Stato rete + cache Firestore (IndexedDB).
 * - offline: browser senza rete → lettura/scrittura in locale, coda sync
 * - cache: dati serviti da IndexedDB finché il server non risponde
 * - pending: scritture in attesa di upload
 */
export function FirestoreSyncProvider({ children }) {
  const [browserOnline, setBrowserOnline] = useState(readBrowserOnline);
  const [firestoreReachable, setFirestoreReachable] = useState(true);
  const [servingFromCache, setServingFromCache] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [lastServerSyncAt, setLastServerSyncAt] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const onOnline = () => setBrowserOnline(true);
    const onOffline = () => {
      setBrowserOnline(false);
      setFirestoreReachable(false);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!browserOnline) return undefined;
    let cancelled = false;
    void waitForPendingWrites(db)
      .then(() => {
        if (cancelled) return;
        setHasPendingWrites(false);
        setFirestoreReachable(true);
        setLastServerSyncAt(new Date());
        setError(null);
      })
      .catch(() => {
        /* offline o timeout: restano eventuali write in coda */
      });
    return () => {
      cancelled = true;
    };
  }, [browserOnline]);

  const reportSnapshot = useCallback((snap) => {
    const meta = snap?.metadata;
    if (!meta) return;
    setServingFromCache(meta.fromCache);
    setHasPendingWrites(meta.hasPendingWrites);
    if (!meta.fromCache) {
      setFirestoreReachable(true);
      setLastServerSyncAt(new Date());
      setError(null);
    }
  }, []);

  /** Chiamare ad ogni onSnapshot (passare lo snapshot se disponibile). */
  const reportSync = useCallback(
    (snap) => {
      if (snap?.metadata) {
        reportSnapshot(snap);
        return;
      }
      setFirestoreReachable(true);
      setLastServerSyncAt(new Date());
      setError(null);
    },
    [reportSnapshot],
  );

  /** Errore listener: non cancellare i dati già in cache — solo segnala. */
  const reportError = useCallback((err) => {
    console.warn('Firestore listener error:', err);
    setFirestoreReachable(false);
    setError(err?.message ?? 'Errore Firestore');
  }, []);

  const online = browserOnline && firestoreReachable && !servingFromCache;
  const offlineMode = !browserOnline || servingFromCache || !firestoreReachable;

  const value = useMemo(
    () => ({
      online,
      offlineMode,
      browserOnline,
      firestoreReachable,
      servingFromCache,
      hasPendingWrites,
      lastSyncAt: lastServerSyncAt,
      lastServerSyncAt,
      error,
      reportSync,
      reportSnapshot,
      reportError,
    }),
    [
      online,
      offlineMode,
      browserOnline,
      firestoreReachable,
      servingFromCache,
      hasPendingWrites,
      lastServerSyncAt,
      error,
      reportSync,
      reportSnapshot,
      reportError,
    ],
  );

  return (
    <FirestoreSyncContext.Provider value={value}>{children}</FirestoreSyncContext.Provider>
  );
}

export function useFirestoreSync() {
  const ctx = useContext(FirestoreSyncContext);
  if (!ctx) {
    throw new Error('useFirestoreSync va usato dentro FirestoreSyncProvider');
  }
  return ctx;
}

export function useFirestoreSyncOptional() {
  return useContext(FirestoreSyncContext);
}
