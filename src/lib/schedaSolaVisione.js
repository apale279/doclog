import { isPazienteOriginePma, pazientePmaChiuso } from './pmaModule';
import { isChiusoCentrale } from './pazienteStati';

export function isSchedaModificaForzata(paziente) {
  return paziente?.schedaModificaForzata === true;
}

/**
 * DOCLOG: nessuna scheda è in sola visione. L'operatore unico (privilegi pieni)
 * può modificare anche i pazienti dimessi/chiusi. Tutto sbloccato.
 */
export function isSchedaInSolaVisione(paziente) {
  return false;
}

/** Modifica consentita (scheda operativa aperta oppure sblocco manuale). */
export function isSchedaModificabile(paziente) {
  return Boolean(paziente) && !isSchedaInSolaVisione(paziente);
}
