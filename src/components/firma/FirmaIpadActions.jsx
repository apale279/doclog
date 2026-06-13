import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { buildFirmaGuestUrl, buildFirmaRefertoUrl, openFirmaRefertoWindow } from '../../lib/openFirmaWindow';
import { blobToDataUrl } from '../../lib/firmaGuestToken';
import { ensureFirmaGuestToken } from '../../services/firmaGuestTokenService';
import { useFirmaGuestSync } from '../../hooks/useFirmaGuestSync';
import { btnSecondary } from '../ui/FormField';

/**
 * Firma remota: Sidecar (sessione medico) + QR online (senza login, token per paziente).
 */
export function FirmaIpadActions({
  manifestationId,
  pmaId,
  pazienteDocId,
  patientLabel,
  idPazienteVisibile,
  buildPdfBlob,
  currentFirma = null,
  disabled = false,
}) {
  const { user } = useAuth();
  const [tokenId, setTokenId] = useState(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrErr, setQrErr] = useState(null);
  const [guestSynced, setGuestSynced] = useState(false);
  const [copied, setCopied] = useState(false);

  const sidecarUrl = useMemo(
    () => buildFirmaRefertoUrl(pmaId, pazienteDocId),
    [pmaId, pazienteDocId],
  );

  const guestUrl = useMemo(
    () => (tokenId ? buildFirmaGuestUrl(tokenId) : null),
    [tokenId],
  );

  const qrSrc = guestUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(guestUrl)}`
    : null;

  const refreshGuestToken = useCallback(async () => {
    if (!manifestationId || !pazienteDocId || disabled) return;
    setQrBusy(true);
    setQrErr(null);
    try {
      let pdfDataUrl = '';
      if (buildPdfBlob) {
        const blob = await buildPdfBlob();
        if (blob) pdfDataUrl = await blobToDataUrl(blob);
      }
      const id = await ensureFirmaGuestToken(manifestationId, {
        pazienteDocId,
        pmaId,
        patientLabel: patientLabel || 'Paziente',
        idPazienteVisibile: idPazienteVisibile || '',
        pdfDataUrl,
        createdByUid: user?.uid ?? '',
      });
      setTokenId(id);
    } catch (e) {
      setQrErr(e instanceof Error ? e.message : 'Generazione QR non riuscita.');
    } finally {
      setQrBusy(false);
    }
  }, [
    manifestationId,
    pazienteDocId,
    pmaId,
    patientLabel,
    idPazienteVisibile,
    buildPdfBlob,
    user?.uid,
    disabled,
  ]);

  useEffect(() => {
    if (!disabled) void refreshGuestToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifestationId, pazienteDocId, disabled]);

  useFirmaGuestSync({
    enabled: !disabled && Boolean(tokenId),
    manifestationId,
    pazienteDocId,
    tokenId,
    currentFirma,
    onSynced: () => setGuestSynced(true),
  });

  useEffect(() => {
    if (!guestSynced) return undefined;
    const t = window.setTimeout(() => setGuestSynced(false), 4000);
    return () => window.clearTimeout(t);
  }, [guestSynced]);

  const copyGuestLink = async () => {
    if (!guestUrl) return;
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copia questo link e aprilo su iPad o telefono:', guestUrl);
    }
  };

  return (
    <div className="mb-3 space-y-4">
      {/* Sidecar: stessa sessione del medico */}
      <div className="rounded-lg border border-violet-200 bg-violet-50/70 px-3 py-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-900">
          Schermo esteso (Sidecar / cavo)
        </p>
        <p className="mb-3 text-xs leading-relaxed text-violet-950">
          Apre la firma nella sessione del medico. Trascina la finestra sull&apos;iPad collegato come
          secondo schermo, oppure usa il link sotto (richiede login DOCLOG).
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void openFirmaRefertoWindow(pmaId, pazienteDocId)}
            className={`${btnSecondary} w-full sm:w-auto`}
          >
            🖊️ Apri firma su schermo esteso
          </button>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(sidecarUrl)}
            className="text-xs font-medium text-violet-800 underline"
          >
            Copia link Sidecar
          </button>
        </div>
      </div>

      {/* QR online: senza login */}
      <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-sky-900">
          iPad / telefono (QR online, senza login)
        </p>
        <p className="mb-3 text-xs leading-relaxed text-sky-950">
          Scansiona il QR con iPad o telefono: si apre lo spazio firma collegato a{' '}
          <strong>questo paziente</strong>. Alla dimissione il link viene disattivato.
        </p>
        {guestSynced ? (
          <p className="mb-2 text-xs font-semibold text-emerald-800" role="status">
            ✓ Firma ricevuta dal dispositivo — sincronizzata in scheda
          </p>
        ) : null}
        {qrErr ? (
          <p className="mb-2 text-xs text-red-800" role="alert">
            {qrErr}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-2">
            {qrBusy ? (
              <div className="flex h-[180px] w-[180px] items-center justify-center rounded border border-slate-200 bg-white text-xs text-slate-500">
                Aggiorno QR…
              </div>
            ) : qrSrc ? (
              <img
                src={qrSrc}
                alt="QR firma paziente"
                className="rounded border border-slate-200 bg-white p-1"
                width={180}
                height={180}
              />
            ) : null}
            <button
              type="button"
              disabled={qrBusy || disabled}
              onClick={() => void refreshGuestToken()}
              className="text-xs font-medium text-sky-800 underline disabled:opacity-50"
            >
              Aggiorna QR e anteprima PDF
            </button>
            {guestUrl ? (
              <button
                type="button"
                onClick={() => void copyGuestLink()}
                className="text-xs font-medium text-sky-800 underline"
              >
                {copied ? 'Link copiato' : 'Copia link firma'}
              </button>
            ) : null}
          </div>
          {guestUrl ? (
            <p className="min-w-0 flex-1 break-all font-mono text-[10px] leading-snug text-slate-700">
              {guestUrl}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
