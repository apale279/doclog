/** Lunghezza token URL (hex). */
export const FIRMA_GUEST_TOKEN_BYTES = 16;

/** PDF base64 max ~750 KB data URL (limite Firestore ~1 MiB/doc). */
export const FIRMA_GUEST_PDF_MAX_BYTES = 750_000;

export function generateFirmaGuestTokenId() {
  const bytes = new Uint8Array(FIRMA_GUEST_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildFirmaGuestUrl(tokenId) {
  const path = `/f/${encodeURIComponent(tokenId)}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Lettura blob non riuscita'));
    reader.readAsDataURL(blob);
  });
}

/** Accetta solo data URL immagine firma (PNG/JPEG/SVG) entro ~500 KB. */
export function isValidGuestFirmaDataUrl(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v.length < 32 || v.length > 700_000) return false;
  return (
    v.startsWith('data:image/png') ||
    v.startsWith('data:image/jpeg') ||
    v.startsWith('data:image/jpg') ||
    v.startsWith('data:image/svg+xml')
  );
}
