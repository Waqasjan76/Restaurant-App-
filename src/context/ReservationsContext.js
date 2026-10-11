import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { reservationsReducer } from '../reducers/reservationsReducer';
import { mockReservations } from '../data/reservations';
import usePersistedReducer from '../hooks/usePersistedReducer';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { showAlert } from '../utils/alert';

// Shared so the customer's booking screen and the manager dashboard see the
// same list. Persisted in AsyncStorage.
const ReservationsContext = createContext(undefined);

export function ReservationsProvider({ children }) {
  const [reservations, reduceReservations, isHydrated] = usePersistedReducer(
    '@restaurant/reservations',
    reservationsReducer,
    mockReservations
  );

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    api
      .getReservations()
      .then((serverReservations) => {
        if (active) reduceReservations({ type: 'REPLACE_RESERVATIONS', payload: serverReservations });
      })
      .catch((error) => {
        if (active) showAlert('Could not sync reservations', error.message);
      });
    return () => {
      active = false;
    };
  }, [user, reduceReservations]);

  const dispatch = useCallback(async (action) => {
    try {
      if (action.type === 'ADD_RESERVATION') {
        const reservation = await api.createReservation(action.payload);
        reduceReservations({ ...action, payload: reservation });
        return true;
      }
      if (action.type === 'CANCEL_RESERVATION') {
        await api.updateReservation(action.payload, { status: 'Cancelled' });
        reduceReservations(action);
        return true;
      }
      if (action.type === 'SET_RESERVATION_STATUS') {
        const { id, status } = action.payload;
        await api.updateReservation(id, { status });
        reduceReservations(action);
        return true;
      }
      reduceReservations(action);
      return true;
    } catch (error) {
      showAlert('Reservation update failed', error.message);
      return false;
    }
  }, [reduceReservations]);

  const value = useMemo(() => ({ reservations, dispatch, isHydrated }), [reservations, dispatch, isHydrated]);
  return <ReservationsContext.Provider value={value}>{children}</ReservationsContext.Provider>;
}

export function useReservations() {
  const ctx = useContext(ReservationsContext);
  if (ctx === undefined) {
    throw new Error('useReservations must be used inside a <ReservationsProvider>.');
  }
  return ctx;
}
