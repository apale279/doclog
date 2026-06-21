/** Data locale Europe/Rome (stringa gg/mm/aaaa). */
export function calendarDayItaly(value) {
  let d;
  if (value == null) return null;
  if (typeof value?.toDate === 'function') d = value.toDate();
  else if (typeof value === 'string' || typeof value === 'number') {
    d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
  } else return null;
  return d.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
}

export function isSameCalendarDayItaly(value, ref = new Date()) {
  const day = calendarDayItaly(value);
  if (!day) return false;
  return day === calendarDayItaly(ref);
}

/** Paziente «visto oggi»: apertura, ingresso in carico o dimissione nella giornata. */
export function pazienteVistoOggi(p, ref = new Date()) {
  const scheda = p.pmaScheda ?? {};
  const candidates = [
    p.apertura,
    p.arrivatoHAt,
    scheda.ingresso_carico_at,
    scheda.dimesso_at,
  ];
  return candidates.some((ts) => isSameCalendarDayItaly(ts, ref));
}

export function filterPazientiVistiOggi(pazienti, ref = new Date()) {
  return (pazienti ?? []).filter((p) => pazienteVistoOggi(p, ref));
}

export function formatDayStampItaly(ref = new Date()) {
  const d = ref.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
  const [day, month, year] = d.split('/');
  return `${year}-${month}-${day}`;
}
