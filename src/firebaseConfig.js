import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// DOCLOG — configurazione Firebase dedicata (modificabile liberamente).
export const firebaseConfig = {
  apiKey: 'AIzaSyD1BzDmjFDtU1BZGJKhTPRnMgvNwEgyDqc',
  authDomain: 'doclog-e2f95.firebaseapp.com',
  projectId: 'doclog-e2f95',
  storageBucket: 'doclog-e2f95.firebasestorage.app',
  messagingSenderId: '160920927187',
  appId: '1:160920927187:web:16cd440b0ecb9c35e10d26',
};

const app = initializeApp(firebaseConfig);

// Cache offline persistente (IndexedDB): l'app funziona anche senza rete e
// sincronizza automaticamente quando torna online. Multi-tab supportato.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const auth = getAuth(app);
// Sessione login persistente sul dispositivo (necessaria per riaprire offline).
void setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Auth persistence non impostata:', err);
});
export const storage = getStorage(app);

