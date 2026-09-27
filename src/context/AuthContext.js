import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { users as seedUsers } from '../data/users';
import { usePersistedState } from '../hooks/usePersistedReducer';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Registered accounts (mock). Signup appends here instead of a server, and
  // the list is kept in AsyncStorage so new accounts survive a restart.
  const [accounts, setAccounts, isHydrated] = usePersistedState('@restaurant/accounts', seedUsers);

  const login = useCallback((loggedInUser) => setUser(loggedInUser), []);
  const logout = useCallback(() => setUser(null), []);
  const register = useCallback((account) => setAccounts((prev) => [...prev, account]), [setAccounts]);

  const value = useMemo(
    () => ({ user, accounts, login, logout, register, isHydrated }),
    [user, accounts, login, logout, register, isHydrated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used inside an <AuthProvider>. Wrap your app in AuthProvider.');
  }
  return ctx;
}
