import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { isDoclogAdmin } from '../lib/doclogUsers';

const ImpostazioniEditContext = createContext({ canEdit: false });

export function ImpostazioniEditProvider({ children }) {
  const { profile, profileLoading } = useAuth();
  const canEdit = useMemo(() => isDoclogAdmin(profile), [profile]);

  const value = useMemo(() => ({ canEdit, profileLoading }), [canEdit, profileLoading]);

  return (
    <ImpostazioniEditContext.Provider value={value}>{children}</ImpostazioniEditContext.Provider>
  );
}

export function useImpostazioniEdit() {
  return useContext(ImpostazioniEditContext);
}
