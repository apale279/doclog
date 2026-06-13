import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, firebaseConfig } from '../firebaseConfig';
import { COLLECTIONS } from '../lib/firestorePaths';
import { normalizeDoclogRank } from '../lib/doclogUsers';

function userProfilesCol(tenantId) {
  return collection(db, COLLECTIONS.manifestazioni, tenantId, 'userProfiles');
}
function userProfileRef(tenantId, uid) {
  return doc(db, COLLECTIONS.manifestazioni, tenantId, 'userProfiles', uid);
}

export function subscribeDoclogUsers(tenantId, onChange, onError) {
  return onSnapshot(
    userProfilesCol(tenantId),
    (snap) => onChange(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))),
    (err) => onError?.(err),
  );
}

/**
 * Crea un utente Firebase Auth con un'app secondaria (non tocca la sessione admin
 * corrente), poi scrive il profilo applicativo.
 */
export async function createDoclogUser(tenantId, { email, password, nome, rank }) {
  const emailNorm = String(email ?? '').trim();
  if (!emailNorm) throw new Error("Inserisci l'email.");
  if (String(password ?? '').length < 6) throw new Error('Password di almeno 6 caratteri.');

  const secondary = initializeApp(firebaseConfig, `doclog-usercreate-${Date.now()}`);
  let uid;
  try {
    const secAuth = getAuth(secondary);
    const cred = await createUserWithEmailAndPassword(secAuth, emailNorm, password);
    uid = cred.user.uid;
    await signOut(secAuth).catch(() => {});
  } finally {
    await deleteApp(secondary).catch(() => {});
  }

  await setDoc(userProfileRef(tenantId, uid), {
    email: emailNorm,
    nome: String(nome ?? '').trim(),
    rank: normalizeDoclogRank(rank),
    createdAt: serverTimestamp(),
  });
  return uid;
}

export async function updateDoclogUser(tenantId, uid, { nome, rank }) {
  const patch = {};
  if (nome !== undefined) patch.nome = String(nome ?? '').trim();
  if (rank !== undefined) patch.rank = normalizeDoclogRank(rank);
  if (Object.keys(patch).length === 0) return;
  await updateDoc(userProfileRef(tenantId, uid), patch);
}

/**
 * Rimuove il profilo applicativo (l'utente non potrà più operare). La credenziale
 * Firebase Auth resta: va eliminata dalla Console Firebase se necessario.
 */
export async function deleteDoclogUserProfile(tenantId, uid) {
  await deleteDoc(userProfileRef(tenantId, uid));
}
