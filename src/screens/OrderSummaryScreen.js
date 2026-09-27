import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { CART_ACTIONS } from '../reducers/cartReducer';
import { mockTables } from '../data/tables';
import { useTheme } from '../context/ThemeContext';
import { formatPrice } from '../data/menu';
import { SALES_TAX_RATE, SERVICE_CHARGE_RATE, calculateTotals } from '../utils/pricing';

export default function OrderSummaryScreen({ navigation, route }) {
  const { orderType = 'dine-in', tableId = null, pickupTime = null } = route.params ?? {};
  const { state, dispatch } = useCart();
  const { user } = useAuth();
  const { placeOrder } = useOrders();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { items, discountPercent, promoCode } = state;

  // Recomputed only when the cart items or the discount change, not on
  // unrelated re-renders (theme toggle, navigation param changes, ...).
  const totals = useMemo(() => calculateTotals(items, discountPercent), [items, discountPercent]);

  const table = mockTables.find((t) => t.id === tableId);

  const handlePlaceOrder = () => {
    const order = placeOrder({ user, items, totals, type: orderType, tableId, pickupTime });
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
    navigation.popToTop();
    // Open tracking inside the Orders tab, with My Orders underneath it.
    navigation.navigate('OrdersTab', {
      screen: 'OrderTracking',
      params: { orderId: order.id },
      initial: false,
    });
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.lineLabel}>Your cart is empty.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Order type</Text>
        <Text style={styles.itemName}>
          {orderType === 'dine-in'
            ? `🍽️ Dine-in at ${table ? `${table.name} (${table.area})` : 'your table'}`
            : `🥡 Takeaway, pickup at ${pickupTime}`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Items</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}×</Text>
            <View style={styles.flex}>
              <Text style={styles.itemName}>
                {item.image} {item.name}
              </Text>
              {item.note ? <Text style={styles.note}>“{item.note}”</Text> : null}
            </View>
            <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bill</Text>
        <Line label="Subtotal" value={formatPrice(totals.subtotal)} styles={styles} />
        {totals.discount > 0 && (
          <Line
            label={`Promo ${promoCode} (−${discountPercent}%)`}
            value={`− ${formatPrice(totals.discount)}`}
            styles={styles}
            valueStyle={{ color: colors.success }}
          />
        )}
        <Line
          label={`Service charge (${SERVICE_CHARGE_RATE * 100}%)`}
          value={formatPrice(totals.serviceCharge)}
          styles={styles}
        />
        <Line label={`Sales tax (${SALES_TAX_RATE * 100}%)`} value={formatPrice(totals.salesTax)} styles={styles} />
        <View style={styles.divider} />
        <Line label="Grand total" value={formatPrice(totals.grandTotal)} styles={styles} bold />
      </View>

      <Text style={styles.payNote}>Payment is made at the counter. No card details are needed.</Text>
      <Pressable style={styles.placeButton} onPress={handlePlaceOrder}>
        <Text style={styles.placeText}>Place order · {formatPrice(totals.grandTotal)}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Line({ label, value, styles, bold, valueStyle }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.lineValue, bold && styles.bold, valueStyle]}>{value}</Text>
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    content: { padding: 12, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' },
    flex: { flex: 1 },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      marginBottom: 12,
    },
    sectionTitle: { color: c.text, fontWeight: '700', fontSize: 16, marginBottom: 8 },
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, gap: 8 },
    itemQty: { color: c.primary, fontWeight: '700', width: 28 },
    itemName: { color: c.text, fontWeight: '600' },
    note: { color: c.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 2 },
    itemPrice: { color: c.text, fontWeight: '600' },
    line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    lineLabel: { color: c.textMuted },
    lineValue: { color: c.text, fontWeight: '600' },
    bold: { color: c.text, fontWeight: '800', fontSize: 17 },
    divider: { height: 1, backgroundColor: c.border, marginVertical: 6 },
    center: { alignItems: 'center', justifyContent: 'center' },
    payNote: { color: c.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 10 },
    placeButton: { backgroundColor: c.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    placeText: { color: c.onPrimary, fontWeight: '800', fontSize: 16 },
  });
