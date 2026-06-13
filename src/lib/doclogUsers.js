/** Utenti DOCLOG: due soli rank. */
export const DOCLOG_RANK = {
  ADMIN: 'ADMIN',
  PMA: 'PMA',
};

export const DOCLOG_RANK_LABEL = {
  [DOCLOG_RANK.ADMIN]: 'Admin',
  [DOCLOG_RANK.PMA]: 'Operatore (notifiche)',
};

/** Rank sconosciuto → PMA (privilegio minimo: nessuna gestione utenti/impostazioni). */
export function normalizeDoclogRank(value) {
  const v = String(value ?? '').trim().toUpperCase();
  return v === DOCLOG_RANK.ADMIN ? DOCLOG_RANK.ADMIN : DOCLOG_RANK.PMA;
}

export function isDoclogAdmin(profile) {
  return normalizeDoclogRank(profile?.rank) === DOCLOG_RANK.ADMIN;
}

/** Utente che deve ricevere la notifica «Fai entrare paziente». */
export function isDoclogPmaRank(profile) {
  return normalizeDoclogRank(profile?.rank) === DOCLOG_RANK.PMA;
}
