import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useReservation from '../hooks/useReservation';
import QuantityStepper from '../components/QuantityStepper';
import { formatDateLabel } from '../utils/date';
import { showAlert } from '../utils/alert';

// Presentation only: every rule (availability, validation, saving) lives in
// useReservation. This component just renders its state and forwards taps.
export default function ReservationScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const booking = useReservation(user);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('MyReservations')} hitSlop={8}>
          <Text style={styles.headerLink}>My bookings</Text>
        </Pressable>
      ),
    });
  }, [navigation, styles]);

  const openConfirm = () => {
    if (booking.validate()) setConfirmVisible(true);
  };

  const confirm = async () => {
    setIsSaving(true);
    try {
      const created = await booking.createReservation();
      if (created) {
        setConfirmVisible(false);
        showAlert('Table requested', `Your booking for ${created.time} is pending manager approval.`);
        navigation.navigate('MyReservations');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const { errors } = booking;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {booking.dateOptions.map((d, i) => {
            const active = d === booking.date;
            return (
              <Pressable
                key={d}
                onPress={() => booking.changeDate(d)}
                style={[styles.dateChip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : formatDateLabel(d)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <TextInput
          style={[styles.input, errors.date && styles.inputError]}
          value={booking.date}
          onChangeText={booking.changeDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
        {errors.date ? <Text style={styles.error}>{errors.date}</Text> : null}

        <View style={styles.partyRow}>
          <View>
            <Text style={styles.label}>Party size</Text>
            <Text style={styles.muted}>1 to 12 guests</Text>
          </View>
          <QuantityStepper
            quantity={booking.partySize}
            onIncrement={() => booking.changePartySize(1)}
            onDecrement={() => booking.changePartySize(-1)}
          />
        </View>
        {errors.partySize ? <Text style={styles.error}>{errors.partySize}</Text> : null}

        <Text style={styles.label}>Time</Text>
        <View style={styles.slotGrid}>
          {booking.slots.map((slot) => {
            const active = slot.time === booking.time;
            return (
              <Pressable
                key={slot.time}
                disabled={slot.disabled}
                onPress={() => booking.selectTime(slot.time)}
                style={[styles.slot, active && styles.chipActive, slot.disabled && styles.slotDisabled]}
              >
                <Text
                  style={[
                    styles.slotText,
                    active && styles.chipTextActive,
                    slot.disabled && styles.slotTextDisabled,
                  ]}
                >
                  {slot.time}
                </Text>
                <Text style={[styles.slotSub, active && styles.chipTextActive]}>
                  {slot.disabled ? 'Full' : `${slot.freeTables.length} free`}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.time ? <Text style={styles.error}>{errors.time}</Text> : null}

        {booking.availableTables.length > 0 && (
          <>
            <Text style={styles.label}>Table</Text>
            <View style={styles.slotGrid}>
              {booking.availableTables.map((t) => {
                const active = booking.selectedTable?.id === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => booking.selectTable(t.id)}
                    style={[styles.tableChip, active && styles.chipActive]}
                  >
                    <Text style={[styles.slotText, active && styles.chipTextActive]}>{t.name}</Text>
                    <Text style={[styles.slotSub, active && styles.chipTextActive]}>
                      {t.seats} seats · {t.area}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={booking.contact.name}
          onChangeText={booking.updateContact('name')}
          placeholder="Name for the booking"
          placeholderTextColor={colors.textMuted}
        />
        {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

        <Text style={styles.label}>Mobile number</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          value={booking.contact.phone}
          onChangeText={booking.updateContact('phone')}
          placeholder="03XX-XXXXXXX"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
        />
        {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={openConfirm}>
          <Text style={styles.primaryText}>Review booking</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Confirm your booking</Text>
            {booking.draft && (
              <>
                <SummaryRow label="Date" value={formatDateLabel(booking.draft.date)} styles={styles} />
                <SummaryRow label="Time" value={booking.draft.time} styles={styles} />
                <SummaryRow label="Guests" value={String(booking.draft.partySize)} styles={styles} />
                <SummaryRow
                  label="Table"
                  value={`${booking.draft.table.name} (${booking.draft.table.seats} seats, ${booking.draft.table.area})`}
                  styles={styles}
                />
                <SummaryRow label="Name" value={booking.draft.name} styles={styles} />
                <SummaryRow label="Phone" value={booking.draft.phone} styles={styles} />
              </>
            )}
            <View style={styles.modalButtons}>
              <Pressable style={styles.secondaryButton} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.secondaryText}>Edit</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, styles.modalConfirm]}
                onPress={confirm}
                disabled={isSaving}
              >
                <Text style={styles.primaryText}>{isSaving ? 'Saving…' : 'Confirm'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryRow({ label, value, styles }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' },
    headerLink: { color: c.primary, fontWeight: '700', marginRight: 8 },
    label: { color: c.text, fontWeight: '700', fontSize: 15, marginTop: 16, marginBottom: 8 },
    muted: { color: c.textMuted, fontSize: 12 },
    chipRow: { gap: 8, paddingBottom: 8 },
    dateChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { color: c.text, fontWeight: '600', fontSize: 13 },
    chipTextActive: { color: c.onPrimary },
    input: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: c.input,
      color: c.text,
      fontSize: 15,
    },
    inputError: { borderColor: c.danger },
    error: { color: c.danger, fontSize: 12, marginTop: 4 },
    partyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    slot: {
      width: '30%',
      flexGrow: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    slotDisabled: { backgroundColor: c.subtle, borderStyle: 'dashed', opacity: 0.55 },
    slotText: { color: c.text, fontWeight: '700' },
    slotTextDisabled: { textDecorationLine: 'line-through', color: c.textMuted },
    slotSub: { color: c.textMuted, fontSize: 11, marginTop: 2 },
    tableChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    primaryButton: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 24,
    },
    primaryText: { color: c.onPrimary, fontWeight: '800', fontSize: 16 },
    overlay: { flex: 1, backgroundColor: c.overlay, justifyContent: 'center', padding: 24 },
    modal: {
      backgroundColor: c.card,
      borderRadius: 16,
      padding: 20,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
    },
    modalTitle: { color: c.text, fontSize: 18, fontWeight: '800', marginBottom: 12 },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: 12,
    },
    summaryValue: { color: c.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
    modalButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
    secondaryButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 24,
    },
    secondaryText: { color: c.text, fontWeight: '700', fontSize: 16 },
    modalConfirm: { flex: 1 },
  });
