import React, { createContext, useContext } from 'react';
import type { Session } from './sf/api';

export interface SessionValue extends Session {
  /** Logs out and shows the Salesforce login page again. */
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const s = useContext(SessionContext);
  if (!s) {
    throw new Error('useSession must be used after login');
  }
  return s;
}

export const SessionProvider = ({ value, children }: { value: SessionValue; children: React.ReactNode }) => (
  <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
);
