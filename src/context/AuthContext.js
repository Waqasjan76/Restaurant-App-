import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = useCallback(async (email, password) => {
    const authenticatedUser = await api.login({ email, password });
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  const register = useCallback(async (account) => {
    const createdUser = await api.register(account);
    setUser(createdUser);
    return createdUser;
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, register, isHydrated: true }),
    [user, login, logout, register]
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
