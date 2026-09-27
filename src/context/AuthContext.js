import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { users as seedUsers } from '../data/users';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Registered accounts (mock). Signup appends here instead of a server.
  const [accounts, setAccounts] = useState(seedUsers);

  const login = useCallback((loggedInUser) => setUser(loggedInUser), []);
  const logout = useCallback(() => setUser(null), []);
  const register = useCallback((account) => setAccounts((prev) => [...prev, account]), []);

  const value = useMemo(
    () => ({ user, accounts, login, logout, register }),
    [user, accounts, login, logout, register]
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
