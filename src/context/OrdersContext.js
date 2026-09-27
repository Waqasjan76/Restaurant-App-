import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { ORDER_ACTIONS, ordersReducer } from '../reducers/ordersReducer';
import usePersistedReducer from '../hooks/usePersistedReducer';

const OrdersContext = createContext(undefined);

export function OrdersProvider({ children }) {
  const [orders, dispatch, isHydrated] = usePersistedReducer('@restaurant/orders', ordersReducer, []);

  // Creates an order in status Pending and returns it.
  const placeOrder = useCallback(({ user, items, totals, type, tableId, pickupTime }) => {
    const timestamp = Date.now();
    const order = {
      id: `ORD-${String(timestamp).slice(-6)}`,
      userId: user.id,
      customerName: user.fullName,
      items: items.map(({ id, name, price, quantity, note, image }) => ({ id, name, price, quantity, note, image })),
      totals,
      total: totals.grandTotal,
      type, // 'dine-in' | 'takeaway'
      tableId: type === 'dine-in' ? tableId : null,
      pickupTime: type === 'takeaway' ? pickupTime : null,
      status: 'Pending',
      statusTimes: { Pending: timestamp },
      manualOverride: false,
      timestamp,
    };
    dispatch({ type: ORDER_ACTIONS.PLACE_ORDER, payload: order });
    return order;
  }, [dispatch]);

  const updateStatus = useCallback(
    (id, status, manual = false) =>
      dispatch({ type: ORDER_ACTIONS.UPDATE_STATUS, payload: { id, status, manual } }),
    [dispatch]
  );

  const value = useMemo(
    () => ({ orders, dispatch, placeOrder, updateStatus, isHydrated }),
    [orders, dispatch, placeOrder, updateStatus, isHydrated]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (ctx === undefined) {
    throw new Error('useOrders must be used inside an <OrdersProvider>.');
  }
  return ctx;
}
