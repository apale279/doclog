import { useEffect, useRef } from 'react';
import { subscribeFirmaGuestToken } from '../services/firmaGuestTokenService';
import { patchPazientePmaGranular } from '../pma/lib/pazientePmaPatch';

/**
 * Sincronizza firma dal token guest (QR) alla scheda paziente lato medico.
 */
export function useFirmaGuestSync({
  enabled,
  manifestationId,
  pazienteDocId,
  tokenId,
  currentFirma,
  onSynced,
}) {
  const lastSyncedRef = useRef(null);

  useEffect(() => {
    if (!enabled || !manifestationId || !tokenId || !pazienteDocId) return undefined;

    return subscribeFirmaGuestToken(
      manifestationId,
      tokenId,
      (token) => {
        if (!token?.active || !token.firma_paziente_base64) return;
        const guestFirma = token.firma_paziente_base64.trim();
        if (!guestFirma || guestFirma === lastSyncedRef.current) return;
        if (currentFirma && currentFirma.trim() === guestFirma) {
          lastSyncedRef.current = guestFirma;
          return;
        }
        lastSyncedRef.current = guestFirma;
        void patchPazientePmaGranular(manifestationId, pazienteDocId, {
          firma_paziente_base64: guestFirma,
        })
          .then(() => onSynced?.())
          .catch((err) => console.warn('[useFirmaGuestSync]', err));
      },
      (err) => console.warn('[useFirmaGuestSync] snapshot:', err),
    );
  }, [enabled, manifestationId, pazienteDocId, tokenId, currentFirma, onSynced]);
}
