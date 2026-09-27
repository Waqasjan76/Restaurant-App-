import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { cartReducer, initialCartState, selectItemCount } from '../reducers/cartReducer';

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const value = useMemo(
    () => ({ state, dispatch, itemCount: selectItemCount(state) }),
    [state]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (ctx === undefined) {
    throw new Error('useCart must be used inside a <CartProvider>.');
  }
  return ctx;
}
