import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { reservationsReducer } from '../reducers/reservationsReducer';
import { mockReservations } from '../data/reservations';

// Shared so the customer's booking screen and the manager dashboard see the
// same list.
const ReservationsContext = createContext(undefined);

export function ReservationsProvider({ children }) {
  const [reservations, dispatch] = useReducer(reservationsReducer, mockReservations);
  const value = useMemo(() => ({ reservations, dispatch }), [reservations]);
  return <ReservationsContext.Provider value={value}>{children}</ReservationsContext.Provider>;
}

export function useReservations() {
  const ctx = useContext(ReservationsContext);
  if (ctx === undefined) {
    throw new Error('useReservations must be used inside a <ReservationsProvider>.');
  }
  return ctx;
}
