import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useOrders } from '../../context/OrdersContext';
import StatusBadge from '../StatusBadge';
import { ALLOWED_TRANSITIONS } from '../../reducers/ordersReducer';
import { formatPrice } from '../../data/menu';
import { mockTables } from '../../data/tables';
import { formatTime } from '../../utils/date';
import { confirmAlert } from '../../utils/alert';

const ACTION_LABELS = {
  Preparing: 'Start preparing',
  Ready: 'Mark ready',
  Served: 'Mark served',
  Cancelled: 'Cancel',
};

export default function OrdersPanel({ styles }) {
  const { orders, updateStatus } = useOrders();

  if (orders.length === 0) {
    return <Text style={styles.empty}>No orders yet. New customer orders appear here instantly.</Text>;
  }

  const change = (order, status) => {
    if (status === 'Cancelled') {
      confirmAlert(
        'Cancel order',
        `Cancel ${order.id} for ${order.customerName}?`,
        () => updateStatus(order.id, status, true),
        'Cancel order'
      );
    } else {
      updateStatus(order.id, status, true);
    }
  };

  return orders.map((order) => {
    const table = mockTables.find((t) => t.id === order.tableId);
    return (
      <View key={order.id} style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title}>
            {order.id} · {order.customerName}
          </Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.muted}>
          {formatTime(order.timestamp)} ·{' '}
          {order.type === 'dine-in' ? `Dine-in, ${table?.name ?? order.tableId}` : `Takeaway, pickup ${order.pickupTime}`} ·{' '}
          {formatPrice(order.total)}
        </Text>
        {order.items.map((item) => (
          <Text key={item.id} style={styles.text}>
            {item.quantity}× {item.name}
            {item.note ? <Text style={styles.muted}>{`\n     “${item.note}”`}</Text> : null}
          </Text>
        ))}
        {ALLOWED_TRANSITIONS[order.status].length > 0 && (
          <View style={styles.actions}>
            {ALLOWED_TRANSITIONS[order.status].map((next) => (
              <Pressable
                key={next}
                onPress={() => change(order, next)}
                style={next === 'Cancelled' ? styles.outlineButton : styles.actionButton}
              >
                <Text style={next === 'Cancelled' ? styles.outlineText : styles.actionText}>
                  {ACTION_LABELS[next]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  });
}
