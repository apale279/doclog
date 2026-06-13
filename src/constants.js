// DOCLOG: app monoutente senza login. L'operatore ha sempre pieni diritti clinici.
export const IS_SUPERADMIN = true;

/**
 * DOCLOG usa un'unica "manifestazione" fissa: tutti i dati vivono sotto
 * `manifestazioni/doclog/...`. Nessuna risoluzione dinamica del tenant.
 */
export const TENANT_ID = 'doclog';

/** Id del singolo PMA "generico" (senza nome) gestito da DOCLOG. */
export const DOCLOG_PMA_ID = 'pma';

export const GOOGLE_MAPS_API_KEY = (
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
).trim();

import { CHIAMANTI_EVENTO } from './lib/eventoCampi';
import { DEFAULT_TIPI_MEZZO } from './lib/tipiMezzo';
import {
  DEFAULT_DETTAGLI_PER_TIPO_LUOGO,
  DEFAULT_TIPI_LUOGO,
} from './data/defaultLuoghiImpostazioni';

export const ESITO_TRASPORTA = 'Trasporta';
export const ESITO_ALTRO = 'Altro (specificare)';

/** Valori iniziali se non esiste ancora il documento impostazioni */
export const DEFAULT_IMPOSTAZIONI = {
  tipiEvento: ['Trauma', 'Malore', 'Intossicazione', 'Parto', 'Altro'],
  /** Voci menu «Chiamante» in scheda evento */
  chiamantiEvento: [...CHIAMANTI_EVENTO],
  /** Dettaglio evento per ogni voce di tipiEvento (chiave = nome tipo) */
  dettagliPerTipoEvento: {},
  /** MSB/MSA — localizzazioni lesioni (array di nomi). */
  lesioniLocalizzazioni: [],
  /** MSB/MSA — tipologie lesioni (array di nomi). */
  lesioniTipologie: [],
  /** MSB/MSA — VAS massimo in scheda (1–10). */
  lesioniVasMax: 10,
  /** MSB/MSA — catalogo presidi (multiselect). */
  msbMsaPresidi: [],
  /** MSB — catalogo prestazioni valutazione. */
  prestazioniMsb: [],
  /** MSA — catalogo prestazioni valutazione. */
  prestazioniMsa: [],
  tipiLuogo: [...DEFAULT_TIPI_LUOGO],
  /** Dettaglio luogo per ogni voce di tipiLuogo (chiave = nome tipo luogo) */
  dettagliPerTipoLuogo: { ...DEFAULT_DETTAGLI_PER_TIPO_LUOGO },
  tipiMezzo: DEFAULT_TIPI_MEZZO,
  listaOspedali: [],
  stazionamenti: [],
  /**
   * DOCLOG: un unico PMA "generico". `nome` serve internamente (gating accessi e
   * intestazioni) ma non è mostrato come titolo nell'interfaccia.
   */
  pma: [{ id: DOCLOG_PMA_ID, nome: 'PPI', indirizzo: '', luogo_fisico: '', coordinate: null }],
  /** Foto tabella codici minori per PMA: { [pmaId]: [{ id, url, storagePath, uploadedAt }] } */
  codiciMinoriTabellaFoto: {},
  /** Corridori da Excel: [{ pettorale, nome, cognome, dataNascita, telefono }] */
  registryPartecipanti: [],
  coloriEvento: ['Bianco', 'Verde', 'Giallo', 'Rosso'],
  statiMissione: [
    'ALLERTARE',
    'ALLERTATO',
    'PARTITO',
    'IN POSTO',
    'DIRETTO H',
    'ARRIVATO H',
    'RIENTRO',
    'FINE MISSIONE',
    /** Missione interrotta (dirottamento, flag-down, ecc.): non conta come chiusura “normale” dell’evento. */
    'ANNULLATA',
  ],
  /**
   * Centro iniziale mappa dashboard quando nessun evento ha coordinate.
   * `{ luogo, lat, lng, zoom? }` oppure null = default geografico Roma.
   */
  mappaDashboardDefault: null,
  /** Piantina PNG per tabellone tattico (Storage → URL download). */
  piantina_url: null,
  /** Guida operativa PDF (Cloudinary raw → URL). */
  guida_pdf_url: null,
  /** Luogo fisico predefinito (struttura chiusa, settore, tribuna…). */
  luogo_fisico: '',
  /**
   * DOCLOG: elenco manifestazioni. Ogni manifestazione raggruppa i propri pazienti
   * (le impostazioni sono condivise). [{ id, nome, luogo, data, note }]
   */
  doclogManifestazioni: [],
  /** Id della manifestazione attiva (i pazienti vengono raggruppati sotto questa). */
  manifestazioneAttivaId: '',
  /** Se true, webhook e invio missioni Telegram sono consentiti. */
  telegramBotEnabled: false,
  /** Se false, niente posizione reale da Telegram e mappa solo stazionamento. */
  telegramGpsTrackingEnabled: true,
  /** Incrementato a ogni cambio password bot; i client Telegram devono allinearsi. */
  telegramPasswordEpoch: 0,
  /** Liste cliniche e testi legali per modulo PMA interno. */
  pmaClinica: {
    prestazioni: [],
    farmaci: [],
    farmaci_consumati: [],
    dettaglio_eo_rapido: {},
    dettaglio_eo_rapido_default: '',
    preset_dimissione: [],
    preset_farmaci: [],
    consenso_generico_cure: '',
    consenso_privacy: '',
    rifiuto_invio_ps: '',
  },
  /**
   * Firma medico per le dimissioni (DOCLOG): nome, cognome e firma (SVG/data URL).
   * Sostituisce la firma legata all'utente: qui non c'è login.
   */
  firmaMedico: {
    nome: '',
    cognome: '',
    firma_svg: '',
  },
};

export const ESITI_PAZIENTE = [
  ESITO_TRASPORTA,
  'Non trasporta',
  'Rifiuto trasporto',
  'Risolto in posto',
  'Si allontana',
  ESITO_ALTRO,
];

export const STATI_PAZIENTE = ['ATTESA', 'TRASPORTO', 'ARRIVATO H'];

/** Stato centrale per pazienti autopresentati al PMA (non usano il flusso missione/trasporto). */
export const STATO_PAZIENTE_PMA = 'PMA';
