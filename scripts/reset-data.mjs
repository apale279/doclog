/**
 * Reset dati operativi DOCLOG:
 *  - azzera pmaClinica.farmaci_consumati
 *  - elimina tutti i pazienti
 * Non tocca utenti, impostazioni cliniche, manifestazioni.
 *
 *   node scripts/reset-data.mjs <password-admin>
 *
 * Richiede l'accesso come admin@doclog.it (le regole Firestore richiedono login).
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const ADMIN_EMAIL = 'admin@doclog.it';
const ADMIN_PASSWORD = process.argv[2];
if (!ADMIN_PASSWORD) {
  console.error('Uso: node scripts/reset-data.mjs <password-admin>');
  process.exit(1);
}

const config = {
  apiKey: 'AIzaSyD1BzDmjFDtU1BZGJKhTPRnMgvNwEgyDqc',
  authDomain: 'doclog-e2f95.firebaseapp.com',
  projectId: 'doclog-e2f95',
  storageBucket: 'doclog-e2f95.firebasestorage.app',
  messagingSenderId: '160920927187',
  appId: '1:160920927187:web:16cd440b0ecb9c35e10d26',
};
const TENANT = 'doclog';

async function main() {
  const app = initializeApp(config);
  const db = getFirestore(app);
  await signInWithEmailAndPassword(getAuth(app), ADMIN_EMAIL, ADMIN_PASSWORD);

  // 1) Azzera farmaci consumati
  const impRef = doc(db, 'manifestazioni', TENANT, 'settings', 'impostazioni');
  try {
    await updateDoc(impRef, { 'pmaClinica.farmaci_consumati': [] });
  } catch {
    await setDoc(impRef, { pmaClinica: { farmaci_consumati: [] } }, { merge: true });
  }
  console.log('✓ Farmaci consumati azzerati.');

  // 2) Elimina tutti i pazienti
  const col = collection(db, 'manifestazioni', TENANT, 'pazienti');
  const snap = await getDocs(col);
  let n = 0;
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
    n += 1;
  }
  console.log(`✓ Pazienti eliminati: ${n}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Reset fallito:', err);
  process.exit(1);
});
