import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useReservation from '../hooks/useReservation';
import StatusBadge from '../components/StatusBadge';
import { mockTables } from '../data/tables';
import { formatDateLabel } from '../utils/date';
import { confirmAlert } from '../utils/alert';

const tableName = (id) => mockTables.find((t) => t.id === id)?.name ?? id;

export default function MyReservationsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { myReservations, cancelReservation } = useReservation(user);

  const askCancel = (r) =>
    confirmAlert(
      'Cancel booking',
      `Cancel your table for ${r.partySize} on ${formatDateLabel(r.date)} at ${r.time}?`,
      () => cancelReservation(r.id),
      'Cancel booking'
    );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={myReservations}
      keyExtractor={(r) => r.id}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.title}>No bookings yet</Text>
          <Text style={styles.muted}>Reserve a table and it will show up here.</Text>
        </View>
      }
      renderItem={({ item: r }) => {
        const canCancel = r.status === 'Pending' || r.status === 'Accepted';
        return (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.title}>
                {formatDateLabel(r.date)} · {r.time}
              </Text>
              <StatusBadge status={r.status} />
            </View>
            <Text style={styles.muted}>
              {r.partySize} guest(s) · {tableName(r.tableId)} · {r.phone}
            </Text>
            {canCancel && (
              <Pressable style={styles.cancelButton} onPress={() => askCancel(r)}>
                <Text style={styles.cancelText}>Cancel booking</Text>
              </Pressable>
            )}
          </View>
        );
      }}
    />
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      marginBottom: 10,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { color: c.text, fontWeight: '700', fontSize: 15 },
    muted: { color: c.textMuted, fontSize: 13 },
    cancelButton: {
      alignSelf: 'flex-start',
      marginTop: 10,
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    cancelText: { color: c.danger, fontWeight: '700', fontSize: 13 },
    empty: { alignItems: 'center', paddingTop: 60, gap: 6 },
    emptyEmoji: { fontSize: 48 },
  });
