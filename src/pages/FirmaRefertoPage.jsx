import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useImpostazioni } from '../hooks/useImpostazioni';
import { usePazienteDocument } from '../hooks/usePazienteDocument';
import { usePmaClinicaListe } from '../pma/hooks/usePmaClinicaListe';
import { crossDocToPazienteView } from '../pma/adapters/crossPazienteAdapter';
import { buildPazientePdfBlob } from '../pma/lib/pdf/pazientePdfReport';
import { createPdfObjectUrl, revokePdfObjectUrl } from '../pma/lib/pdf/pdfBlobActions';
import { resolveMedicoFirmaSrc } from '../pma/lib/medicoFirma';
import { SignatureCanvas } from '../pma/components/scheda-paziente/SignatureCanvas';
import { patchPazientePmaGranular } from '../pma/lib/pazientePmaPatch';
import { findPmaById } from '../lib/pmaModule';
import {
  findManifestazione,
  manifestazioneAttiva,
  manifestazioneLabel,
} from '../lib/doclogManifestazioni';
import { displayNomePazientePma } from '../lib/pmaDisplayName';

/**
 * Finestra firma referto pensata per uno schermo esteso (iPad via Sidecar):
 * anteprima PDF in alto + campo firma in basso. Stessa sessione/DB del medico.
 */
export default function FirmaRefertoPage() {
  const { pmaId, pazienteDocId } = useParams();
  const decodedPmaId = decodeURIComponent(pmaId ?? '');
  const docId = decodeURIComponent(pazienteDocId ?? '');
  const { impostazioni } = useImpostazioni();
  const liste = usePmaClinicaListe();
  const { rawDoc, loading, manifestationId } = usePazienteDocument(docId);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  const p = useMemo(
    () => (rawDoc ? crossDocToPazienteView(rawDoc, manifestationId, decodedPmaId) : null),
    [rawDoc, manifestationId, decodedPmaId],
  );

  const buildPdf = useCallback(async () => {
    if (!p) return;
    setPdfErr(null);
    setPdfBusy(true);
    try {
      const manifest =
        findManifestazione(impostazioni, rawDoc?.doclogManifestazioneId) ??
        manifestazioneAttiva(impostazioni);
      const pma = findPmaById(impostazioni, decodedPmaId);
      const firmaMedico = resolveMedicoFirmaSrc({
        firma_medico_svg: impostazioni?.firmaMedico?.firma_svg ?? '',
      });
      const blob = await buildPazientePdfBlob(p, {
        manifestazioneNome: manifestazioneLabel(manifest) || 'Manifestazione',
        pmaNome: pma?.nome ?? 'PPI',
        prestazioniManifestazioneLista: liste.prestazioni,
        consensoGenericoCure: liste.consensoGenericoCure?.trim() || undefined,
        consensoPrivacy: liste.consensoPrivacy?.trim() || undefined,
        rifiutoInvioPsText: liste.rifiutoInvioPs?.trim() || undefined,
        firmaMedicoProfiloDataUrl: firmaMedico ?? undefined,
      });
      setPdfUrl((prev) => {
        revokePdfObjectUrl(prev);
        return createPdfObjectUrl(blob);
      });
    } catch (e) {
      setPdfErr(e instanceof Error ? e.message : 'Errore generazione PDF.');
    } finally {
      setPdfBusy(false);
    }
  }, [p, impostazioni, liste, rawDoc?.doclogManifestazioneId, decodedPmaId]);

  // Genera l'anteprima quando il paziente è pronto.
  useEffect(() => {
    if (p) void buildPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id]);

  useEffect(() => () => revokePdfObjectUrl(pdfUrl), [pdfUrl]);

  const handleSaveFirma = async (dataUrl) => {
    setSaveErr(null);
    try {
      await patchPazientePmaGranular(manifestationId, docId, {
        firma_paziente_base64: dataUrl,
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Salvataggio firma non riuscito.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Caricamento referto…
      </div>
    );
  }
  if (!rawDoc || !p) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-600">
        Paziente non trovato.
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900">
            {displayNomePazientePma(rawDoc) || 'Paziente'}
          </p>
          <p className="text-xs text-slate-500">Firma referto di dimissione</p>
        </div>
        <button
          type="button"
          onClick={() => void buildPdf()}
          disabled={pdfBusy}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {pdfBusy ? 'Aggiorno…' : 'Aggiorna anteprima'}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden bg-slate-200">
        {pdfErr ? (
          <p className="p-4 text-sm text-red-700">{pdfErr}</p>
        ) : pdfUrl ? (
          <iframe title="Anteprima referto" src={pdfUrl} className="h-full w-full border-0" />
        ) : (
          <p className="p-4 text-sm text-slate-500">Generazione anteprima…</p>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-300 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Firma del paziente
          </span>
          {saved ? (
            <span className="text-sm font-semibold text-emerald-700" role="status">
              ✓ Firma salvata
            </span>
          ) : null}
        </div>
        {saveErr ? (
          <p className="mb-2 text-sm text-red-700" role="alert">
            {saveErr}
          </p>
        ) : null}
        <SignatureCanvas
          key={`firma-${p.id}`}
          variant="compact"
          preloadImageSrc={p.firma_paziente_base64 ?? null}
          onSaveDataUrl={handleSaveFirma}
        />
      </div>
    </div>
  );
}
