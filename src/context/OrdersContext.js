import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { ORDER_ACTIONS, ordersReducer } from '../reducers/ordersReducer';
import usePersistedReducer from '../hooks/usePersistedReducer';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { showAlert } from '../utils/alert';

const OrdersContext = createContext(undefined);

export function OrdersProvider({ children }) {
  const [orders, dispatch, isHydrated] = usePersistedReducer('@restaurant/orders', ordersReducer, []);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    api
      .getOrders()
      .then((serverOrders) => {
        if (active) dispatch({ type: 'REPLACE_ORDERS', payload: serverOrders });
      })
      .catch((error) => {
        if (active) showAlert('Could not sync orders', error.message);
      });
    return () => {
      active = false;
    };
  }, [user, dispatch]);

  const placeOrder = useCallback(async ({ user: customer, items, totals, type, tableId, pickupTime }) => {
    const timestamp = Date.now();
    const order = {
      id: `ORD-${timestamp}`,
      userId: customer.id,
      customerName: customer.fullName,
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
    const savedOrder = await api.createOrder(order);
    dispatch({ type: ORDER_ACTIONS.PLACE_ORDER, payload: savedOrder });
    return savedOrder;
  }, [dispatch]);

  const updateStatus = useCallback(
    async (id, status, manual = false) => {
      try {
        await api.updateOrder(id, { status, manual });
        dispatch({ type: ORDER_ACTIONS.UPDATE_STATUS, payload: { id, status, manual } });
        return true;
      } catch (error) {
        showAlert('Order update failed', error.message);
        return false;
      }
    },
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
