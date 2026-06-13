/**
 * Crea (o ripara) l'utente amministratore di default DOCLOG.
 *   node scripts/seed-admin.mjs [password]
 *
 * Richiede che in Firebase Console sia abilitato il provider Email/Password
 * (Authentication → Sign-in method).
 */
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

const config = {
  apiKey: 'AIzaSyD1BzDmjFDtU1BZGJKhTPRnMgvNwEgyDqc',
  authDomain: 'doclog-e2f95.firebaseapp.com',
  projectId: 'doclog-e2f95',
  storageBucket: 'doclog-e2f95.firebasestorage.app',
  messagingSenderId: '160920927187',
  appId: '1:160920927187:web:16cd440b0ecb9c35e10d26',
};

const EMAIL = 'admin@doclog.it';
const PASSWORD = process.argv[2];
const TENANT = 'doclog';

if (!PASSWORD || PASSWORD.length < 6) {
  console.error('Uso: node scripts/seed-admin.mjs <password>  (min 6 caratteri)');
  process.exit(1);
}

async function main() {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD);
    uid = cred.user.uid;
    console.log('✓ Utente Auth creato:', EMAIL);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
      uid = cred.user.uid;
      console.log('• Utente già esistente: profilo verrà aggiornato.');
    } else if (
      e.code === 'auth/operation-not-allowed' ||
      e.code === 'auth/configuration-not-found'
    ) {
      console.error(
        '\n✗ Authentication non configurata / provider Email/Password non abilitato.\n' +
          '  1) Firebase Console → progetto doclog-e2f95 → Authentication → "Get started"\n' +
          '  2) Sign-in method → abilita "Email/Password"\n' +
          '  3) Riesegui:  node scripts/seed-admin.mjs\n',
      );
      process.exit(1);
    } else {
      throw e;
    }
  }

  await setDoc(
    doc(db, 'manifestazioni', TENANT, 'userProfiles', uid),
    { email: EMAIL, nome: 'Amministratore', rank: 'ADMIN', createdAt: new Date() },
    { merge: true },
  );

  console.log('✓ Profilo ADMIN scritto.');
  console.log('\n  Email:    ', EMAIL);
  console.log('  Password: ', PASSWORD);
  console.log('\n  Cambia la password dopo il primo accesso (Firebase Console → Authentication).');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed admin fallito:', err);
  process.exit(1);
});
