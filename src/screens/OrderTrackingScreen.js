import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useOrders } from '../context/OrdersContext';
import { useTheme } from '../context/ThemeContext';
import StatusBadge from '../components/StatusBadge';
import { AUTO_PROGRESS_MS, FINAL_STATUSES, ORDER_FLOW } from '../reducers/ordersReducer';
import { formatPrice } from '../data/menu';
import { mockTables } from '../data/tables';
import { formatDuration, formatTime } from '../utils/date';
import { confirmAlert } from '../utils/alert';

const STEP_ICONS = { Pending: '🧾', Preparing: '👨‍🍳', Ready: '🛎️', Served: '✅' };

// Which status an order should have reached after `elapsed` ms (demo timings).
function statusForElapsed(elapsed) {
  if (elapsed >= AUTO_PROGRESS_MS.Served) return 'Served';
  if (elapsed >= AUTO_PROGRESS_MS.Ready) return 'Ready';
  if (elapsed >= AUTO_PROGRESS_MS.Preparing) return 'Preparing';
  return 'Pending';
}

export default function OrderTrackingScreen({ route }) {
  const { orderId } = route.params;
  const { orders, updateStatus } = useOrders();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const order = orders.find((o) => o.id === orderId);

  const [now, setNow] = useState(Date.now());
  const isFinal = order ? FINAL_STATUSES.includes(order.status) : true;

  // Running clock for the elapsed-time counter, ticking every second.
  useEffect(() => {
    if (isFinal) return undefined;
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, [isFinal]);

  // Automatic status progress: Pending -> Preparing (10 s) -> Ready (20 s)
  // -> Served (30 s). Stops once a manager has changed the status by hand.
  useEffect(() => {
    if (!order || isFinal || order.manualOverride) return undefined;
    const progress = setInterval(() => {
      const target = statusForElapsed(Date.now() - order.timestamp);
      if (ORDER_FLOW.indexOf(target) > ORDER_FLOW.indexOf(order.status)) {
        updateStatus(order.id, target);
      }
    }, 1000);
    return () => clearInterval(progress);
  }, [order?.id, order?.status, order?.timestamp, order?.manualOverride, isFinal, updateStatus]);

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Order not found.</Text>
      </View>
    );
  }

  const cancelled = order.status === 'Cancelled';
  const currentIndex = ORDER_FLOW.indexOf(order.status);
  const endTime = isFinal ? order.statusTimes?.[order.status] ?? now : now;
  const elapsed = endTime - order.timestamp;
  const table = mockTables.find((t) => t.id === order.tableId);

  const askCancel = () =>
    confirmAlert('Cancel order', `Cancel order ${order.id}?`, () => updateStatus(order.id, 'Cancelled', true), 'Cancel order');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.orderId}>{order.id}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.muted}>
          Placed at {formatTime(order.timestamp)} ·{' '}
          {order.type === 'dine-in' ? `Dine-in, ${table?.name ?? order.tableId}` : `Takeaway, pickup ${order.pickupTime}`}
        </Text>
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>{isFinal ? 'Total time' : 'Elapsed'}</Text>
          <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
        </View>
        {order.manualOverride && !isFinal && (
          <Text style={styles.note}>The kitchen is updating this order manually.</Text>
        )}
      </View>

      {cancelled ? (
        <View style={[styles.card, styles.cancelledCard]}>
          <Text style={styles.cancelledText}>❌ This order was cancelled.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {ORDER_FLOW.map((step, i) => {
            const done = i <= currentIndex;
            const active = i === currentIndex;
            return (
              <View key={step} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  <View style={[styles.dot, done && styles.dotDone, active && styles.dotActive]}>
                    <Text style={styles.dotIcon}>{STEP_ICONS[step]}</Text>
                  </View>
                  {i < ORDER_FLOW.length - 1 && <View style={[styles.line, i < currentIndex && styles.lineDone]} />}
                </View>
                <View style={styles.stepText}>
                  <Text style={[styles.stepTitle, !done && styles.mutedTitle]}>{step}</Text>
                  <Text style={styles.muted}>
                    {order.statusTimes?.[step]
                      ? formatTime(order.statusTimes[step], true)
                      : active
                        ? 'In progress'
                        : 'Waiting'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.rowBetween}>
            <View style={styles.flex}>
              <Text style={styles.itemText}>
                {item.quantity}× {item.image} {item.name}
              </Text>
              {item.note ? <Text style={styles.noteText}>“{item.note}”</Text> : null}
            </View>
            <Text style={styles.itemText}>{formatPrice(item.price * item.quantity)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.rowBetween}>
          <Text style={styles.totalText}>Total paid at counter</Text>
          <Text style={styles.totalText}>{formatPrice(order.total)}</Text>
        </View>
      </View>

      {order.status === 'Pending' && (
        <Pressable style={styles.cancelButton} onPress={askCancel}>
          <Text style={styles.cancelButtonText}>Cancel order</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 12, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      marginBottom: 12,
    },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3, gap: 8 },
    orderId: { color: c.text, fontSize: 18, fontWeight: '800' },
    muted: { color: c.textMuted, fontSize: 13 },
    note: { color: c.info, fontSize: 12, marginTop: 8 },
    timerBox: { alignItems: 'center', marginTop: 12 },
    timerLabel: { color: c.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
    timer: { color: c.primary, fontSize: 36, fontWeight: '800', fontVariant: ['tabular-nums'] },
    stepRow: { flexDirection: 'row' },
    stepRail: { alignItems: 'center', width: 44 },
    dot: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.subtle,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.5,
    },
    dotDone: { opacity: 1, backgroundColor: c.subtle, borderWidth: 2, borderColor: c.success },
    dotActive: { borderColor: c.primary, borderWidth: 3 },
    dotIcon: { fontSize: 16 },
    line: { width: 3, flex: 1, minHeight: 22, backgroundColor: c.border },
    lineDone: { backgroundColor: c.success },
    stepText: { flex: 1, paddingLeft: 10, paddingBottom: 18, paddingTop: 6 },
    stepTitle: { color: c.text, fontWeight: '700', fontSize: 15 },
    mutedTitle: { color: c.textMuted },
    cancelledCard: { borderColor: c.danger },
    cancelledText: { color: c.danger, fontWeight: '700', textAlign: 'center' },
    sectionTitle: { color: c.text, fontWeight: '700', fontSize: 16, marginBottom: 6 },
    itemText: { color: c.text, flexShrink: 1 },
    flex: { flex: 1 },
    noteText: { color: c.textMuted, fontSize: 12, fontStyle: 'italic' },
    divider: { height: 1, backgroundColor: c.border, marginVertical: 8 },
    totalText: { color: c.text, fontWeight: '800' },
    cancelButton: {
      borderWidth: 1,
      borderColor: c.danger,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
    },
    cancelButtonText: { color: c.danger, fontWeight: '700' },
  });
