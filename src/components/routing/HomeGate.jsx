import { Navigate } from 'react-router-dom';
import { useManifestazioneAttiva } from '../../hooks/useManifestazioneAttiva';
import { DOCLOG_PMA_ID } from '../../constants';

/**
 * Landing DOCLOG: se non c'è una manifestazione attiva → tab Manifestazioni in
 * Impostazioni; altrimenti → desk PMA della manifestazione attiva.
 */
export function HomeGate() {
  const { loading, hasAttiva } = useManifestazioneAttiva();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-600">
        Caricamento…
      </div>
    );
  }

  if (!hasAttiva) {
    return <Navigate to="/impostazioni?tab=manifestazioni" replace />;
  }

  return <Navigate to={`/pma/${DOCLOG_PMA_ID}`} replace />;
}
