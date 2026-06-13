import { usePmaMobile } from './usePmaMobile'

/** DOCLOG: layout touch ottimizzato su qualsiasi smartphone/tablet stretto. */
export function usePmaFieldUx(): boolean {
  return usePmaMobile()
}
