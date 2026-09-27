import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useTheme } from '../context/ThemeContext';
import StatusBadge from '../components/StatusBadge';
import { formatPrice } from '../data/menu';
import { formatTime } from '../utils/date';

export default function MyOrdersScreen({ navigation }) {
  const { user } = useAuth();
  const { orders } = useOrders();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const myOrders = useMemo(() => orders.filter((o) => o.userId === user?.id), [orders, user?.id]);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={myOrders}
      keyExtractor={(o) => o.id}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🧾</Text>
          <Text style={styles.title}>No orders yet</Text>
          <Text style={[styles.muted, styles.center]}>Orders you place will appear here so you can track them.</Text>
        </View>
      }
      renderItem={({ item: o }) => (
        <Pressable style={styles.card} onPress={() => navigation.navigate('OrderTracking', { orderId: o.id })}>
          <View style={styles.row}>
            <Text style={styles.title}>{o.id}</Text>
            <StatusBadge status={o.status} />
          </View>
          <Text style={styles.muted}>
            {new Date(o.timestamp).toLocaleDateString('en-GB')} {formatTime(o.timestamp)} ·{' '}
            {o.type === 'dine-in' ? 'Dine-in' : 'Takeaway'} · {o.items.reduce((n, i) => n + i.quantity, 0)} item(s)
          </Text>
          <View style={styles.row}>
            <Text style={styles.total}>{formatPrice(o.total)}</Text>
            <Text style={styles.link}>Track →</Text>
          </View>
        </Pressable>
      )}
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
      gap: 4,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { color: c.text, fontWeight: '700', fontSize: 15 },
    muted: { color: c.textMuted, fontSize: 13 },
    center: { textAlign: 'center' },
    total: { color: c.text, fontWeight: '800' },
    link: { color: c.primary, fontWeight: '700' },
    empty: { alignItems: 'center', paddingTop: 60, gap: 6, paddingHorizontal: 24 },
    emptyEmoji: { fontSize: 48 },
  });
