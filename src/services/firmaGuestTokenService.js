import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteField } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { TENANT_ID } from '../constants';
import {
  FIRMA_GUEST_PDF_MAX_BYTES,
  generateFirmaGuestTokenId,
  isValidGuestFirmaDataUrl,
} from '../lib/firmaGuestToken';
import { firmaGuestTokenPath, pazientiPath } from '../lib/firestorePaths';

function tokenRef(manifestationId, tokenId) {
  return doc(db, ...firmaGuestTokenPath(manifestationId ?? TENANT_ID), tokenId);
}

function pazienteRef(manifestationId, pazienteDocId) {
  return doc(db, ...pazientiPath(manifestationId ?? TENANT_ID), pazienteDocId);
}

export function subscribeFirmaGuestToken(manifestationId, tokenId, onData, onError) {
  if (!tokenId) return () => {};
  return onSnapshot(
    tokenRef(manifestationId, tokenId),
    (snap) => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError,
  );
}

export async function getFirmaGuestToken(manifestationId, tokenId) {
  const snap = await getDoc(tokenRef(manifestationId, tokenId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

async function findActiveTokenForPaziente(manifestationId, pazienteDocId) {
  const colRef = collection(db, ...firmaGuestTokenPath(manifestationId));
  const q = query(
    colRef,
    where('pazienteDocId', '==', pazienteDocId),
    where('active', '==', true),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/**
 * Crea o aggiorna il token QR per un paziente (solo utente autenticato).
 * @param {object} opts
 * @param {string} opts.pazienteDocId
 * @param {string} opts.pmaId
 * @param {string} opts.patientLabel
 * @param {string} opts.idPazienteVisibile
 * @param {string} [opts.pdfDataUrl] - anteprima referto (data URL)
 * @param {string} opts.createdByUid
 */
export async function ensureFirmaGuestToken(manifestationId, opts) {
  const {
    pazienteDocId,
    pmaId,
    patientLabel,
    idPazienteVisibile,
    pdfDataUrl = '',
    createdByUid,
  } = opts;

  let existing = await findActiveTokenForPaziente(manifestationId, pazienteDocId);
  const tokenId = existing?.id ?? generateFirmaGuestTokenId();
  const ref = tokenRef(manifestationId, tokenId);

  const pdfOk =
    typeof pdfDataUrl === 'string' &&
    pdfDataUrl.startsWith('data:') &&
    pdfDataUrl.length <= FIRMA_GUEST_PDF_MAX_BYTES;

  const payload = {
    pazienteDocId,
    pmaId,
    patientLabel: patientLabel || 'Paziente',
    idPazienteVisibile: idPazienteVisibile || '',
    active: true,
    revokedAt: deleteField(),
    updatedAt: serverTimestamp(),
    ...(pdfOk ? { pdfDataUrl, pdfUpdatedAt: serverTimestamp() } : {}),
    ...(existing ? {} : { createdAt: serverTimestamp(), createdByUid: createdByUid ?? '' }),
  };

  if (existing) {
    await updateDoc(ref, payload);
  } else {
    await setDoc(ref, {
      ...payload,
      firma_paziente_base64: null,
      firma_saved_at: null,
    });
  }

  await updateDoc(pazienteRef(manifestationId, pazienteDocId), {
    firmaGuestTokenId: tokenId,
  });

  return tokenId;
}

/** Salva firma dal dispositivo guest (senza login). */
export async function saveGuestFirmaFromToken(manifestationId, tokenId, firmaDataUrl) {
  if (!isValidGuestFirmaDataUrl(firmaDataUrl)) {
    throw new Error('Formato firma non valido.');
  }
  const snap = await getDoc(tokenRef(manifestationId, tokenId));
  if (!snap.exists() || snap.data()?.active !== true) {
    throw new Error('Link firma non valido o scaduto.');
  }
  await updateDoc(tokenRef(manifestationId, tokenId), {
    firma_paziente_base64: firmaDataUrl.trim(),
    firma_saved_at: serverTimestamp(),
  });
}

/** Invalida il token QR (es. alla dimissione). */
export async function revokeFirmaGuestTokenForPaziente(manifestationId, pazienteDocId, tokenIdHint) {
  let tokenId = tokenIdHint;
  if (!tokenId) {
    const pSnap = await getDoc(pazienteRef(manifestationId, pazienteDocId));
    tokenId = pSnap.data()?.firmaGuestTokenId ?? null;
  }
  if (!tokenId) {
    const found = await findActiveTokenForPaziente(manifestationId, pazienteDocId);
    tokenId = found?.id ?? null;
  }
  if (tokenId) {
    try {
      await updateDoc(tokenRef(manifestationId, tokenId), {
        active: false,
        revokedAt: serverTimestamp(),
        pdfDataUrl: deleteField(),
      });
    } catch {
      // Token già rimosso o non accessibile.
    }
  }
  try {
    await updateDoc(pazienteRef(manifestationId, pazienteDocId), {
      firmaGuestTokenId: deleteField(),
    });
  } catch {
    // Paziente già chiuso o campo assente.
  }
}
