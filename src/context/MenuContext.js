import React, { createContext, useContext, useMemo } from 'react';
import { menu as seedMenu } from '../data/menu';
import { menuReducer } from '../reducers/menuReducer';
import usePersistedReducer from '../hooks/usePersistedReducer';

// The live menu. The manager edits it; the customer menu reads it, so price
// and availability changes show up immediately.
const MenuContext = createContext(undefined);

export function MenuProvider({ children }) {
  const [menu, dispatch, isHydrated] = usePersistedReducer('@restaurant/menu', menuReducer, seedMenu);
  const value = useMemo(() => ({ menu, dispatch, isHydrated }), [menu, dispatch, isHydrated]);
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (ctx === undefined) {
    throw new Error('useMenu must be used inside a <MenuProvider>.');
  }
  return ctx;
}
