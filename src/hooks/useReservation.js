import { useCallback, useMemo, useState } from 'react';
import { useReservations } from '../context/ReservationsContext';
import { ACTIVE_STATUSES, RESERVATION_ACTIONS } from '../reducers/reservationsReducer';
import { MAX_PARTY_SIZE, MIN_PARTY_SIZE, TIME_SLOTS, mockTables } from '../data/tables';
import { addDays, combineDateTime, parseISODate, toISODate } from '../utils/date';
import { PK_PHONE_REGEX } from '../utils/validation';

const MIN_LEAD_TIME_MS = 60 * 60 * 1000; // bookings must be at least 1 hour ahead
const DATE_OPTION_COUNT = 7;

/**
 * All booking logic for the Reservation screens: form state, availability
 * against mockTables + existing reservations, validation, create and cancel.
 * The screen only renders what this hook returns.
 */
export default function useReservation(user) {
  const { reservations, dispatch } = useReservations();

  const [date, setDate] = useState(() => toISODate(addDays(new Date(), 1)));
  const [time, setTime] = useState(null);
  const [partySize, setPartySize] = useState(2);
  const [tableId, setTableId] = useState(null);
  const [contact, setContact] = useState({ name: user?.fullName ?? '', phone: user?.phone ?? '' });
  const [errors, setErrors] = useState({});

  const clearError = (field) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  // Tables already taken in a given date + slot.
  const bookedTableIds = useCallback(
    (slot) =>
      new Set(
        reservations
          .filter((r) => r.date === date && r.time === slot && ACTIVE_STATUSES.includes(r.status))
          .map((r) => r.tableId)
      ),
    [reservations, date]
  );

  // For every slot: which tables are free and big enough for the party.
  const slots = useMemo(
    () =>
      TIME_SLOTS.map((slot) => {
        const booked = bookedTableIds(slot);
        const freeTables = mockTables.filter((t) => t.seats >= partySize && !booked.has(t.id));
        return { time: slot, freeTables, disabled: freeTables.length === 0 };
      }),
    [bookedTableIds, partySize]
  );

  // Derived selections: if a change of date or party size makes the chosen
  // slot or table unavailable, fall back instead of keeping stale state.
  const selectedSlot = slots.find((s) => s.time === time && !s.disabled) ?? null;
  const availableTables = selectedSlot ? selectedSlot.freeTables : [];
  const selectedTable =
    availableTables.find((t) => t.id === tableId) ??
    // smallest table that fits
    availableTables.reduce((best, t) => (!best || t.seats < best.seats ? t : best), null);

  const dateOptions = useMemo(
    () => Array.from({ length: DATE_OPTION_COUNT }, (_, i) => toISODate(addDays(new Date(), i))),
    []
  );

  const changeDate = (value) => {
    setDate(value);
    clearError('date');
  };

  const selectTime = (slot) => {
    setTime(slot);
    clearError('time');
  };

  const changePartySize = (delta) => {
    setPartySize((n) => Math.min(MAX_PARTY_SIZE, Math.max(MIN_PARTY_SIZE, n + delta)));
    clearError('partySize');
  };

  const selectTable = (id) => setTableId(id);

  const updateContact = (field) => (value) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const validate = () => {
    const next = {};
    const day = parseISODate(date);
    const today = parseISODate(toISODate(new Date()));
    if (!day) next.date = 'Enter a valid date as YYYY-MM-DD.';
    else if (day < today) next.date = 'The date cannot be in the past.';

    if (!Number.isInteger(partySize) || partySize < MIN_PARTY_SIZE || partySize > MAX_PARTY_SIZE) {
      next.partySize = `Party size must be between ${MIN_PARTY_SIZE} and ${MAX_PARTY_SIZE}.`;
    }

    if (!selectedSlot) {
      next.time = 'Pick an available time slot.';
    } else if (day) {
      const start = combineDateTime(date, selectedSlot.time);
      if (start.getTime() - Date.now() < MIN_LEAD_TIME_MS) {
        next.time = 'Bookings must be made at least one hour in advance.';
      }
    }

    if (!contact.name.trim()) next.name = 'Enter the name for the booking.';
    if (!PK_PHONE_REGEX.test(contact.phone.trim())) {
      next.phone = 'Use the Pakistani mobile format 03XX-XXXXXXX.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Snapshot shown in the confirmation modal.
  const draft = selectedSlot && selectedTable
    ? { date, time: selectedSlot.time, partySize, table: selectedTable, ...contact }
    : null;

  const createReservation = () => {
    if (!validate() || !draft) return null;
    const reservation = {
      id: `r${Date.now()}`,
      userId: user?.id ?? 'guest',
      customerName: contact.name.trim(),
      phone: contact.phone.trim(),
      date,
      time: draft.time,
      partySize,
      tableId: draft.table.id,
      status: 'Pending',
      createdAt: Date.now(),
    };
    return dispatch({ type: RESERVATION_ACTIONS.ADD, payload: reservation }).then((saved) => {
      if (!saved) return null;
      setTime(null);
      setTableId(null);
      return reservation;
    });
  };

  const cancelReservation = (id) => dispatch({ type: RESERVATION_ACTIONS.CANCEL, payload: id });

  const myReservations = useMemo(
    () =>
      reservations
        .filter((r) => r.userId === user?.id)
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [reservations, user?.id]
  );

  return {
    date,
    dateOptions,
    changeDate,
    slots,
    time: selectedSlot?.time ?? null,
    selectTime,
    partySize,
    changePartySize,
    availableTables,
    selectedTable,
    selectTable,
    contact,
    updateContact,
    errors,
    validate,
    draft,
    createReservation,
    cancelReservation,
    myReservations,
  };
}
