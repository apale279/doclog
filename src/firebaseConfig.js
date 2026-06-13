import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
