/**
 * Migrazione impostazioni PMA da CROSS → DOCLOG.
 *
 * Copia i campi usati dalla parte PMA (prestazioni, farmaci, preset dimissione,
 * consensi/testi legali PDF, tipi evento + dettagli, lista ospedali) con i valori
 * reali presenti nel DB di CROSS.
 *
 * Entrambi i progetti hanno regole Firestore aperte, quindi è sufficiente l'SDK web.
 *
 *   node scripts/migrate-cross-impostazioni.mjs
 */
import { initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

const CROSS_CONFIG = {
  apiKey: 'AIzaSyASRz-oFMKG2nITAqoHiF-fsG4Oa4d82dg',
  authDomain: 'cross-8bb72.firebaseapp.com',
  projectId: 'cross-8bb72',
  storageBucket: 'cross-8bb72.firebasestorage.app',
  messagingSenderId: '267160473122',
  appId: '1:267160473122:web:174c958fdcc4a6c3f6c47b',
};
const CROSS_TENANT = 'Lr4XjZMr4UWWJWD2m0iW';

const DOCLOG_CONFIG = {
  apiKey: 'AIzaSyD1BzDmjFDtU1BZGJKhTPRnMgvNwEgyDqc',
  authDomain: 'doclog-e2f95.firebaseapp.com',
  projectId: 'doclog-e2f95',
  storageBucket: 'doclog-e2f95.firebasestorage.app',
  messagingSenderId: '160920927187',
  appId: '1:160920927187:web:16cd440b0ecb9c35e10d26',
};
const DOCLOG_TENANT = 'doclog';

/** Campi impostazioni rilevanti per la compilazione di scheda paziente + cartella PMA. */
const FIELDS_TO_COPY = [
  'pmaClinica', // prestazioni, farmaci, farmaci_consumati, preset_dimissione, preset_farmaci, consensi, EO rapido
  'tipiEvento',
  'dettagliPerTipoEvento',
  'listaOspedali',
];

async function main() {
  const crossApp = initializeApp(CROSS_CONFIG, 'cross');
  const doclogApp = initializeApp(DOCLOG_CONFIG, 'doclog');
  const crossDb = getFirestore(crossApp);
  const doclogDb = getFirestore(doclogApp);

  const crossRef = doc(crossDb, 'manifestazioni', CROSS_TENANT, 'settings', 'impostazioni');
  const snap = await getDoc(crossRef);
  if (!snap.exists()) {
    console.error('Documento impostazioni CROSS non trovato:', crossRef.path);
    process.exit(1);
  }
  const data = snap.data();

  const payload = { manifestationId: DOCLOG_TENANT };
  for (const key of FIELDS_TO_COPY) {
    if (data[key] !== undefined) payload[key] = data[key];
  }

  // Log di riepilogo
  const pc = payload.pmaClinica ?? {};
  console.log('— Riepilogo campi da copiare —');
  console.log('Prestazioni:', (pc.prestazioni ?? []).length);
  console.log('Farmaci (catalogo):', (pc.farmaci ?? []).length);
  console.log('Farmaci consumati:', (pc.farmaci_consumati ?? []).length);
  console.log('Preset dimissione:', (pc.preset_dimissione ?? []).length);
  console.log('Preset farmaci:', (pc.preset_farmaci ?? []).length);
  console.log('Tipi evento:', (payload.tipiEvento ?? []).length);
  console.log('Dettagli per tipo evento:', Object.keys(payload.dettagliPerTipoEvento ?? {}).length);
  console.log('Lista ospedali:', (payload.listaOspedali ?? []).length);

  const doclogRef = doc(doclogDb, 'manifestazioni', DOCLOG_TENANT, 'settings', 'impostazioni');
  // merge:true → preserva `pma` (default) e `firmaMedico` già impostata.
  await setDoc(doclogRef, payload, { merge: true });

  console.log('\nImpostazioni copiate in DOCLOG:', doclogRef.path);
  process.exit(0);
}

main().catch((err) => {
  console.error('Migrazione fallita:', err);
  process.exit(1);
});
