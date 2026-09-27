import React, { createContext, useContext, useMemo } from 'react';
import { reservationsReducer } from '../reducers/reservationsReducer';
import { mockReservations } from '../data/reservations';
import usePersistedReducer from '../hooks/usePersistedReducer';

// Shared so the customer's booking screen and the manager dashboard see the
// same list. Persisted in AsyncStorage.
const ReservationsContext = createContext(undefined);

export function ReservationsProvider({ children }) {
  const [reservations, dispatch, isHydrated] = usePersistedReducer(
    '@restaurant/reservations',
    reservationsReducer,
    mockReservations
  );
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
