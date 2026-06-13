import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TENANT_ID } from '../constants';
import { SignatureCanvas } from '../pma/components/scheda-paziente/SignatureCanvas';
import {
  getFirmaGuestToken,
  saveGuestFirmaFromToken,
  subscribeFirmaGuestToken,
} from '../services/firmaGuestTokenService';

/**
 * Pagina firma pubblica (QR): nessun login. Token monouso per paziente, revocato alla dimissione.
 */
export default function FirmaGuestPage() {
  const { token } = useParams();
  const tokenId = decodeURIComponent(token ?? '').trim();
  const manifestationId = TENANT_ID;

  const [tokenDoc, setTokenDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  useEffect(() => {
    if (!tokenId) {
      setLoading(false);
      setLoadErr('Link non valido.');
      return undefined;
    }
    setLoading(true);
    setLoadErr(null);
    void getFirmaGuestToken(manifestationId, tokenId)
      .then((doc) => {
        setTokenDoc(doc);
        if (!doc) setLoadErr('Link firma non trovato.');
        else if (!doc.active) setLoadErr('Link firma scaduto: il paziente è già stato dimesso.');
      })
      .catch((e) => setLoadErr(e?.message ?? 'Errore caricamento.'))
      .finally(() => setLoading(false));

    return subscribeFirmaGuestToken(
      manifestationId,
      tokenId,
      (doc) => {
        setTokenDoc(doc);
        if (!doc) {
          setLoadErr('Link firma non trovato.');
        } else if (!doc.active) {
          setLoadErr('Link firma scaduto: il paziente è già stato dimesso.');
        } else {
          setLoadErr(null);
        }
      },
      () => {
        setLoadErr('Link firma scaduto: il paziente è già stato dimesso.');
        setTokenDoc((prev) => (prev ? { ...prev, active: false } : prev));
      },
    );
  }, [manifestationId, tokenId]);

  const pdfDataUrl = tokenDoc?.pdfDataUrl ?? null;
  const preloadFirma = tokenDoc?.firma_paziente_base64 ?? null;

  const handleSaveFirma = useCallback(
    async (dataUrl) => {
      if (!tokenId || !tokenDoc?.active) return;
      setSaveErr(null);
      try {
        await saveGuestFirmaFromToken(manifestationId, tokenId, dataUrl);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 4000);
      } catch (e) {
        setSaveErr(e instanceof Error ? e.message : 'Salvataggio firma non riuscito.');
      }
    },
    [manifestationId, tokenId, tokenDoc?.active],
  );

  const invalid = Boolean(loadErr) || !tokenDoc?.active;

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 p-4 text-sm text-slate-600">
        Caricamento…
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-100 p-6 text-center">
        <p className="text-lg font-bold text-slate-800">Firma non disponibile</p>
        <p className="mt-2 max-w-sm text-sm text-slate-600">
          {loadErr ?? 'Questo link non è più valido.'}
        </p>
        <p className="mt-4 text-xs text-slate-500">DOCLOG — firma referto</p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-100">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900">{tokenDoc.patientLabel}</p>
          <p className="text-xs text-slate-500">
            {tokenDoc.idPazienteVisibile ? `ID ${tokenDoc.idPazienteVisibile} · ` : ''}
            Firma referto di dimissione
          </p>
        </div>
        {saved ? (
          <span className="shrink-0 text-sm font-semibold text-emerald-700" role="status">
            ✓ Salvata
          </span>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-hidden bg-slate-200">
        {pdfDataUrl ? (
          <iframe title="Anteprima referto" src={pdfDataUrl} className="h-full w-full border-0" />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-600">
            Anteprima referto in aggiornamento. Puoi firmare qui sotto; il medico vedrà la firma in
            scheda.
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-300 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700">
          Firma del paziente
        </p>
        {saveErr ? (
          <p className="mb-2 text-sm text-red-700" role="alert">
            {saveErr}
          </p>
        ) : null}
        <SignatureCanvas
          key={`guest-firma-${tokenId}`}
          variant="compact"
          preloadImageSrc={preloadFirma}
          onSaveDataUrl={handleSaveFirma}
        />
      </div>
    </div>
  );
}
