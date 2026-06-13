import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { STATO_PZ_PMA } from '../../lib/pmaModule';
import { btnPrimary, btnSecondary, FormField } from '../ui/FormField';
import { PazienteAnagraficaFields } from '../pazienti/PazienteAnagraficaFields';
import { PazienteTipoEventoFields } from '../pazienti/PazienteTipoEventoFields';
import { createPazientePmaAutopresentato } from '../../services/pmaPazientiService';
import { PmaCodiceColoreField } from '../../pma/components/scheda-paziente/PmaCodiceColoreField';

function parseEtaDraft(s) {
  if (s === '' || s == null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const STATO_AUTO_PMA = STATO_PZ_PMA.IN_ATTESA;

export function PmaPatientQuickForm({
  manifestationId,
  pma,
  impostazioni,
  allPazienti,
  doclogManifestazioneId,
  onCreated,
  onCancel,
}) {
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    nome: '',
    cognome: '',
    telefono: '',
    comune: '',
    indirizzo: '',
    dataNascita: '',
    eta: '',
    sesso: '',
    notePaziente: '',
    tipoEvento: '',
    dettaglioEvento: '',
    codiceColore: '',
  });

  const patchDraft = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.tipoEvento.trim()) {
      alert('Indica il tipo evento (motivo della presentazione).');
      return;
    }
    if (!draft.dettaglioEvento.trim()) {
      alert('Indica il dettaglio evento.');
      return;
    }
    if (!draft.codiceColore) {
      alert('Seleziona il codice colore.');
      return;
    }

    setSaving(true);
    try {
      const pmaSchedaSeed = {
        tipo_evento: draft.tipoEvento.trim(),
        dettaglio_evento: draft.dettaglioEvento.trim(),
        codice_colore: draft.codiceColore,
      };

      const result = await createPazientePmaAutopresentato(
        manifestationId,
        pma.id,
        pma.nome,
        {
          nome: draft.nome.trim(),
          cognome: draft.cognome.trim(),
          telefono: draft.telefono.trim(),
          comune: draft.comune.trim(),
          indirizzo: draft.indirizzo.trim(),
          dataNascita: draft.dataNascita.trim(),
          eta: parseEtaDraft(draft.eta),
          sesso: draft.sesso.trim(),
          notePaziente: draft.notePaziente.trim(),
          apertura: Timestamp.now(),
          statoPzPma: STATO_AUTO_PMA,
          doclogManifestazioneId: doclogManifestazioneId ?? '',
          pmaSchedaSeed,
        },
        allPazienti,
      );
      onCreated?.(result);
    } catch (err) {
      alert(err.message ?? 'Errore creazione paziente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <PmaCodiceColoreField
        compact
        value={draft.codiceColore}
        canEdit
        onChange={(c) => patchDraft('codiceColore', c)}
      />
      {!draft.codiceColore && (
        <p className="text-xs text-amber-800">Codice colore obbligatorio — seleziona un valore.</p>
      )}

      <div>
        <p className="mb-2 text-xs font-bold uppercase text-slate-600">Anagrafica</p>
        <PazienteAnagraficaFields draft={draft} onChange={patchDraft} />
      </div>

      <div className="border-t border-slate-200 pt-3">
        <p className="mb-2 text-xs font-bold uppercase text-slate-600">
          Motivo presentazione (obbligatorio)
        </p>
        <PazienteTipoEventoFields
          impostazioni={impostazioni}
          tipoEvento={draft.tipoEvento}
          dettaglioEvento={draft.dettaglioEvento}
          required
          onChange={(partial) => setDraft((d) => ({ ...d, ...partial }))}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
        <button type="submit" className={btnPrimary} disabled={saving}>
          {saving ? 'Salvataggio…' : 'Crea paziente'}
        </button>
        {onCancel && (
          <button type="button" className={btnSecondary} onClick={onCancel}>
            Annulla
          </button>
        )}
      </div>
    </form>
  );
}
