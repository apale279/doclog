import { useEffect, useRef, useState } from 'react';
import { useManifestationId } from '../../context/ManifestazioneContext';
import { useImpostazioniField } from '../../hooks/useImpostazioniField';
import { saveImpostazioniDotPath } from '../../services/impostazioniService';
import { buildMedicoFirmaPayloadFromFile } from '../../pma/lib/signatureSvg';
import { btnPrimary, btnSecondary } from '../ui/FormField';
import { SaveFeedback } from './SaveFeedback';

/**
 * DOCLOG — Firma medico per le dimissioni.
 * Nome, cognome e firma (immagine caricata → convertita in SVG e applicata al
 * referto di dimissione). Sostituisce la firma legata all'account utente.
 */
export function FirmaMedicoEditor() {
  const manifestationId = useManifestationId();
  const { value: firmaMedico, loading } = useImpostazioniField('firmaMedico');
  const fileRef = useRef(null);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [firmaSvg, setFirmaSvg] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (loading) return;
    const fm = firmaMedico ?? {};
    setNome(fm.nome ?? '');
    setCognome(fm.cognome ?? '');
    setFirmaSvg(fm.firma_svg ?? '');
  }, [firmaMedico, loading]);

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploadBusy(true);
    try {
      const { svgDataUrl } = await buildMedicoFirmaPayloadFromFile(file);
      setFirmaSvg(svgDataUrl);
    } catch (err) {
      setError(err?.message ?? 'Caricamento firma non riuscito.');
    } finally {
      setUploadBusy(false);
    }
  }

  async function handleSave() {
    setError('');
    setFeedback('');
    setSaving(true);
    try {
      await saveImpostazioniDotPath(manifestationId, 'firmaMedico', {
        nome: nome.trim(),
        cognome: cognome.trim(),
        firma_svg: firmaSvg,
      });
      setFeedback('Firma medico salvata.');
    } catch (err) {
      setError(err?.message ?? 'Errore salvataggio firma.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Caricamento firma medico…</p>;
  }

  return (
    <section className="rounded border border-emerald-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-bold uppercase text-emerald-900">Firma medico (dimissioni)</h3>
      <p className="mb-4 text-xs text-slate-600">
        Il nome e la firma indicati qui vengono apposti sul referto di dimissione. L&apos;immagine
        caricata viene convertita in SVG e inserita nel PDF.
      </p>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-bold uppercase text-slate-700">
          Nome
          <input
            type="text"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm normal-case"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>
        <label className="block text-xs font-bold uppercase text-slate-700">
          Cognome
          <input
            type="text"
            className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm normal-case"
            value={cognome}
            onChange={(e) => setCognome(e.target.value)}
          />
        </label>
      </div>

      <div className="mb-4">
        <span className="block text-xs font-bold uppercase text-slate-700">Firma</span>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void onFileChange(e)}
          />
          <button
            type="button"
            className={btnSecondary}
            disabled={uploadBusy}
            onClick={() => fileRef.current?.click()}
          >
            {uploadBusy ? 'Conversione…' : firmaSvg ? 'Sostituisci firma' : 'Carica firma'}
          </button>
          {firmaSvg ? (
            <button
              type="button"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-100"
              onClick={() => setFirmaSvg('')}
            >
              Rimuovi firma
            </button>
          ) : null}
        </div>
        {firmaSvg ? (
          <div className="mt-3 inline-block max-w-full rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
            <img src={firmaSvg} alt="Firma medico" className="max-h-28 max-w-full object-contain" />
          </div>
        ) : (
          <p className="mt-2 text-xs italic text-slate-500">Nessuna firma caricata.</p>
        )}
      </div>

      {error ? (
        <p className="mb-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Salvataggio…' : 'Salva firma medico'}
        </button>
      </div>

      <div className="mt-3">
        <SaveFeedback message={feedback} onClear={() => setFeedback('')} />
      </div>
    </section>
  );
}
