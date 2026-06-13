const ORIGINE = { emoji: '⛺', title: 'Autopresentato' };

/** Emoji origine paziente (dashboard): autopresentato. */
export function PmaOrigineEmoji({ className = '' }) {
  return (
    <span
      className={`pma-patient-card__origin inline-flex shrink-0 ${className}`.trim()}
      title={ORIGINE.title}
      aria-label={ORIGINE.title}
      role="img"
    >
      {ORIGINE.emoji}
    </span>
  );
}
