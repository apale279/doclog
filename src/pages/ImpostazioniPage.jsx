import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TipiEventoChipsEditor } from '../components/impostazioni/TipiEventoChipsEditor';
import { DettagliPerTipoEditor } from '../components/impostazioni/DettagliPerTipoEditor';
import { ListEditorField } from '../components/impostazioni/ListEditorField';
import { PmaClinicaImpostazioniPanel } from '../components/impostazioni/PmaClinicaImpostazioniPanel';
import { FirmaMedicoEditor } from '../components/impostazioni/FirmaMedicoEditor';
import { ManifestazioniEditor } from '../components/impostazioni/ManifestazioniEditor';
import { UtentiEditor } from '../components/impostazioni/UtentiEditor';
import { ImpostazioniEditProvider } from '../context/ImpostazioniEditContext';

const tabClass = (active) =>
  `border-b-2 px-4 py-2 text-sm font-bold uppercase tracking-wide ${
    active
      ? 'border-sky-600 text-sky-700'
      : 'border-transparent text-slate-500 hover:text-slate-700'
  }`;

const VALID_TABS = ['manifestazioni', 'scheda', 'cartella', 'firma', 'utenti'];

function ImpostazioniPageContent() {
  const [searchParams] = useSearchParams();
  const initialTab = VALID_TABS.includes(searchParams.get('tab') ?? '')
    ? searchParams.get('tab')
    : 'manifestazioni';
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-8 pt-4">
      <h2 className="mb-4 text-xl font-bold uppercase text-slate-900">Impostazioni</h2>

      <nav className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
        <button type="button" className={tabClass(tab === 'manifestazioni')} onClick={() => setTab('manifestazioni')}>
          Manifestazioni
        </button>
        <button type="button" className={tabClass(tab === 'scheda')} onClick={() => setTab('scheda')}>
          Scheda paziente
        </button>
        <button type="button" className={tabClass(tab === 'cartella')} onClick={() => setTab('cartella')}>
          Cartella e dimissioni
        </button>
        <button type="button" className={tabClass(tab === 'firma')} onClick={() => setTab('firma')}>
          Firma medico
        </button>
        <button type="button" className={tabClass(tab === 'utenti')} onClick={() => setTab('utenti')}>
          Utenti
        </button>
      </nav>

      {tab === 'manifestazioni' && <ManifestazioniEditor />}

      {tab === 'scheda' && (
        <div className="grid gap-4">
          <p className="text-xs text-slate-600">
            Tipi evento e dettagli proposti nella scheda del paziente autopresentato (motivo della
            presentazione).
          </p>
          <TipiEventoChipsEditor />
          <DettagliPerTipoEditor />
        </div>
      )}

      {tab === 'cartella' && (
        <div className="grid gap-4">
          <PmaClinicaImpostazioniPanel />
          <ListEditorField fieldKey="listaOspedali" label="Lista ospedali (invio in PS)" />
        </div>
      )}

      {tab === 'firma' && <FirmaMedicoEditor />}

      {tab === 'utenti' && <UtentiEditor />}
    </div>
  );
}

export default function ImpostazioniPage() {
  return (
    <ImpostazioniEditProvider>
      <ImpostazioniPageContent />
    </ImpostazioniEditProvider>
  );
}
