import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useReservations } from '../../context/ReservationsContext';
import { RESERVATION_ACTIONS } from '../../reducers/reservationsReducer';
import StatusBadge from '../StatusBadge';
import { mockTables } from '../../data/tables';
import { formatDateLabel, toISODate } from '../../utils/date';

export default function ReservationsPanel({ styles }) {
  const { reservations, dispatch } = useReservations();

  // Upcoming bookings, pending ones first so they get a decision quickly.
  const sorted = useMemo(() => {
    const today = toISODate(new Date());
    return reservations
      .filter((r) => r.date >= today)
      .sort((a, b) => {
        if ((a.status === 'Pending') !== (b.status === 'Pending')) return a.status === 'Pending' ? -1 : 1;
        return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      });
  }, [reservations]);

  const setStatus = (id, status) =>
    dispatch({ type: RESERVATION_ACTIONS.SET_STATUS, payload: { id, status } });

  if (sorted.length === 0) return <Text style={styles.empty}>No upcoming reservations.</Text>;

  return sorted.map((r) => (
    <View key={r.id} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>
          {formatDateLabel(r.date)} · {r.time}
        </Text>
        <StatusBadge status={r.status} />
      </View>
      <Text style={styles.text}>
        {r.customerName} · {r.partySize} guest(s)
      </Text>
      <Text style={styles.muted}>
        {mockTables.find((t) => t.id === r.tableId)?.name ?? r.tableId} · {r.phone}
      </Text>
      {r.status === 'Pending' && (
        <View style={styles.actions}>
          <Pressable style={[styles.actionButton, styles.successButton]} onPress={() => setStatus(r.id, 'Accepted')}>
            <Text style={styles.actionText}>Accept</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={() => setStatus(r.id, 'Declined')}>
            <Text style={styles.outlineText}>Decline</Text>
          </Pressable>
        </View>
      )}
    </View>
  ));
}
