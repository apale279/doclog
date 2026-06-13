/** URL assoluto pagina firma referto (stessa origine / sessione). */
export function buildFirmaRefertoUrl(pmaId, pazienteDocId) {
  const path = `/firma/${encodeURIComponent(pmaId)}/${encodeURIComponent(pazienteDocId)}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

/** URL pubblico firma guest (QR, senza login). */
export { buildFirmaGuestUrl } from './firmaGuestToken';

/**
 * Apre la finestra firma. Se disponibile Window Management API e c'è uno schermo
 * secondario (es. iPad via Sidecar), posiziona la finestra lì.
 */
export async function openFirmaRefertoWindow(pmaId, pazienteDocId) {
  const url = buildFirmaRefertoUrl(pmaId, pazienteDocId);
  const baseFeatures = 'width=860,height=1180,menubar=no,toolbar=no,location=no,status=no';

  try {
    if (typeof window !== 'undefined' && 'getScreenDetails' in window) {
      const screenDetails = await window.getScreenDetails();
      const secondary =
        screenDetails.screens.find((s) => !s.isPrimary) ??
        (screenDetails.screens.length > 1
          ? screenDetails.screens[screenDetails.screens.length - 1]
          : null);
      if (secondary && !secondary.isPrimary) {
        const left = secondary.availLeft + Math.max(0, (secondary.availWidth - 860) / 2);
        const top = secondary.availTop + Math.max(0, (secondary.availHeight - 1180) / 2);
        const win = window.open(
          url,
          'doclog-firma',
          `${baseFeatures},left=${Math.round(left)},top=${Math.round(top)}`,
        );
        if (win) return win;
      }
    }
  } catch {
    // Permesso negato o API non disponibile: fallback sotto.
  }

  return window.open(url, 'doclog-firma', baseFeatures);
}
