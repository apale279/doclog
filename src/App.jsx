import { Navigate, Route, Routes } from 'react-router-dom';
import { AppDataShell } from './components/routing/AppDataShell';
import { HomeGate } from './components/routing/HomeGate';
import { RequireAuthDoclog, RequireAdmin } from './components/routing/AuthGuards';
import { DoclogLayout } from './components/layout/DoclogLayout';
import { DOCLOG_PMA_ID } from './constants';
import LoginPage from './pages/LoginPage';
import ImpostazioniPage from './pages/ImpostazioniPage';
import PmaDeskPage from './pages/PmaDeskPage';
import PmaPazientePage from './pages/PmaPazientePage';
import DoclogPazientiPage from './pages/DoclogPazientiPage';
import FirmaRefertoPage from './pages/FirmaRefertoPage';
import FirmaGuestPage from './pages/FirmaGuestPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Firma guest via QR — senza login, token monouso per paziente. */}
      <Route path="/f/:token" element={<FirmaGuestPage />} />
      <Route element={<RequireAuthDoclog />}>
        <Route element={<AppDataShell />}>
          {/* Scheda paziente a tutto schermo (fuori dal layout). */}
          <Route
            path="pma/:pmaId/paziente/:pazienteDocId"
            element={<PmaPazientePage />}
          />
          {/* Finestra firma per schermo esteso (iPad via Sidecar). */}
          <Route path="firma/:pmaId/:pazienteDocId" element={<FirmaRefertoPage />} />
          <Route element={<DoclogLayout />}>
            <Route index element={<HomeGate />} />
            <Route path="pma" element={<Navigate to={`/pma/${DOCLOG_PMA_ID}`} replace />} />
            <Route path="pma/:pmaId" element={<PmaDeskPage />} />
            <Route path="pazienti" element={<DoclogPazientiPage />} />
            <Route element={<RequireAdmin />}>
              <Route path="impostazioni" element={<ImpostazioniPage />} />
            </Route>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
