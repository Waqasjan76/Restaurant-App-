import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { menu as seedMenu } from '../data/menu';
import { menuReducer } from '../reducers/menuReducer';
import usePersistedReducer from '../hooks/usePersistedReducer';
import { api } from '../services/api';
import { showAlert } from '../utils/alert';

// The live menu. The manager edits it; the customer menu reads it, so price
// and availability changes show up immediately.
const MenuContext = createContext(undefined);

export function MenuProvider({ children }) {
  const [menu, reduceMenu, storageHydrated] = usePersistedReducer(
    '@restaurant/menu',
    menuReducer,
    seedMenu
  );
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    if (!storageHydrated) return undefined;
    let active = true;
    api
      .getMenu()
      .then((items) => {
        if (active) reduceMenu({ type: 'REPLACE_MENU', payload: items });
      })
      .catch((error) => {
        if (active) showAlert('Could not sync menu', error.message);
      })
      .finally(() => {
        if (active) setServerReady(true);
      });
    return () => {
      active = false;
    };
  }, [storageHydrated, reduceMenu]);

  const dispatch = useCallback(async (action) => {
    try {
      if (action.type === 'ADD_MENU_ITEM') {
        const item = await api.addMenuItem(action.payload);
        reduceMenu({ ...action, payload: item });
        return true;
      }
      if (action.type === 'UPDATE_MENU_PRICE') {
        const item = await api.updateMenuItem(action.payload.id, { price: action.payload.price });
        reduceMenu({ ...action, payload: { id: item.id, price: item.price } });
        return true;
      }
      if (action.type === 'TOGGLE_MENU_AVAILABILITY') {
        const currentItem = menu.find((item) => item.id === action.payload);
        if (!currentItem) throw new Error('Menu item not found. Refresh the menu and try again.');
        const item = await api.updateMenuItem(action.payload, {
          isAvailable: !currentItem.isAvailable,
        });
        reduceMenu({
          type: 'SET_MENU_AVAILABILITY',
          payload: { id: item.id, isAvailable: item.isAvailable },
        });
        return true;
      }
      reduceMenu(action);
      return true;
    } catch (error) {
      showAlert('Menu update failed', error.message);
      return false;
    }
  }, [menu, reduceMenu]);

  const value = useMemo(
    () => ({ menu, dispatch, isHydrated: storageHydrated && serverReady }),
    [menu, dispatch, storageHydrated, serverReady]
  );
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (ctx === undefined) {
    throw new Error('useMenu must be used inside a <MenuProvider>.');
  }
  return ctx;
}
