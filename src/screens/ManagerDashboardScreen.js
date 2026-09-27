import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useOrders } from '../context/OrdersContext';
import { useReservations } from '../context/ReservationsContext';
import { useTheme } from '../context/ThemeContext';
import OrdersPanel from '../components/dashboard/OrdersPanel';
import ReservationsPanel from '../components/dashboard/ReservationsPanel';
import MenuManagementPanel from '../components/dashboard/MenuManagementPanel';
import { createDashboardStyles } from '../components/dashboard/dashboardStyles';
import { formatPrice } from '../data/menu';
import { FINAL_STATUSES } from '../reducers/ordersReducer';
import { toISODate } from '../utils/date';

const TABS = [
  { key: 'orders', label: 'Incoming Orders' },
  { key: 'reservations', label: 'Reservations' },
  { key: 'menu', label: 'Menu' },
];

export default function ManagerDashboardScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const panelStyles = useMemo(() => createDashboardStyles(colors), [colors]);
  const { orders } = useOrders();
  const { reservations } = useReservations();
  const [activeTab, setActiveTab] = useState('orders');

  const stats = useMemo(() => {
    const today = toISODate(new Date());
    return {
      activeOrders: orders.filter((o) => !FINAL_STATUSES.includes(o.status)).length,
      revenueToday: orders
        .filter((o) => o.status !== 'Cancelled' && toISODate(new Date(o.timestamp)) === today)
        .reduce((sum, o) => sum + o.total, 0),
      pendingBookings: reservations.filter((r) => r.status === 'Pending' && r.date >= today).length,
    };
  }, [orders, reservations]);

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <Stat label="Active orders" value={stats.activeOrders} styles={styles} />
        <Stat label="Today's sales" value={formatPrice(stats.revenueToday)} styles={styles} />
        <Stat label="Pending bookings" value={stats.pendingBookings} styles={styles} />
      </View>

      <View style={styles.segment}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.segmentItem, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {activeTab === 'orders' && <OrdersPanel styles={panelStyles} />}
        {activeTab === 'reservations' && <ReservationsPanel styles={panelStyles} />}
        {activeTab === 'menu' && <MenuManagementPanel styles={panelStyles} />}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, styles }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 12, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' },
    statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 12 },
    stat: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 10,
      alignItems: 'center',
    },
    statValue: { color: c.primary, fontWeight: '800', fontSize: 17 },
    statLabel: { color: c.textMuted, fontSize: 11, marginTop: 2, textAlign: 'center' },
    segment: {
      flexDirection: 'row',
      margin: 12,
      marginBottom: 0,
      backgroundColor: c.subtle,
      borderRadius: 10,
      padding: 3,
    },
    segmentItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
    segmentActive: { backgroundColor: c.card },
    segmentText: { color: c.textMuted, fontWeight: '600', fontSize: 13 },
    segmentTextActive: { color: c.primary },
  });
