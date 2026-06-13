import { useMemo } from 'react';
import { useImpostazioni } from './useImpostazioni';
import {
  listaManifestazioni,
  manifestazioneAttiva,
} from '../lib/doclogManifestazioni';

/**
 * Manifestazione attiva DOCLOG + elenco. `attiva` non è mai null: se nessuna è
 * selezionata si usa la MANIFESTAZIONE GENERICA (paracadute). `attivaId` è quindi
 * sempre valorizzato.
 */
export function useManifestazioneAttiva() {
  const { impostazioni, loading } = useImpostazioni();
  return useMemo(() => {
    const attiva = manifestazioneAttiva(impostazioni);
    return {
      loading,
      lista: listaManifestazioni(impostazioni),
      attiva,
      attivaId: attiva.id,
      hasAttiva: true,
    };
  }, [impostazioni, loading]);
}
