import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { CART_ACTIONS } from '../reducers/cartReducer';
import { lookupPromo } from '../data/promoCodes';
import { formatPrice } from '../data/menu';
import QuantityStepper from '../components/QuantityStepper';
import { confirmAlert } from '../utils/alert';

export default function CartScreen({ navigation }) {
  const { state, dispatch, itemCount } = useCart();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = (subtotal * state.discountPercent) / 100;

  const applyPromo = () => {
    if (!promoInput.trim()) {
      setPromoError('Enter a promo code first.');
      return;
    }
    if (!lookupPromo(promoInput)) {
      setPromoError(`"${promoInput.trim()}" is not a valid promo code.`);
      return;
    }
    dispatch({ type: CART_ACTIONS.APPLY_PROMO, payload: promoInput });
    setPromoError('');
    setPromoInput('');
  };

  const clearCart = () =>
    confirmAlert(
      'Clear cart',
      'Remove all items from your cart?',
      () => dispatch({ type: CART_ACTIONS.CLEAR_CART }),
      'Clear'
    );

  if (state.items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.muted}>Add a few dishes from the menu to get started.</Text>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('MenuTab')}>
          <Text style={styles.primaryText}>Browse menu</Text>
        </Pressable>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.tile, { backgroundColor: colors.tiles[item.category] ?? colors.subtle }]}>
          <Text style={styles.tileEmoji}>{item.image}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.muted}>{formatPrice(item.price)} each</Text>
        </View>
        <Pressable
          onPress={() => dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: item.id })}
          hitSlop={8}
          accessibilityLabel={`Remove ${item.name}`}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </Pressable>
      </View>
      <View style={[styles.row, styles.spaceBetween]}>
        <QuantityStepper
          quantity={item.quantity}
          onIncrement={() => dispatch({ type: CART_ACTIONS.INCREMENT, payload: item.id })}
          onDecrement={() => dispatch({ type: CART_ACTIONS.DECREMENT, payload: item.id })}
        />
        <Text style={styles.lineTotal}>{formatPrice(item.price * item.quantity)}</Text>
      </View>
      <TextInput
        style={styles.noteInput}
        value={item.note}
        onChangeText={(note) =>
          dispatch({ type: CART_ACTIONS.UPDATE_NOTE, payload: { id: item.id, note } })
        }
        placeholder="Special instructions (e.g. no onions)"
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={state.items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={[styles.row, styles.spaceBetween, styles.headerRow]}>
            <Text style={styles.muted}>{itemCount} item(s)</Text>
            <Pressable onPress={clearCart}>
              <Text style={styles.link}>Clear cart</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          <View>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Promo code</Text>
              {state.promoCode ? (
                <View style={[styles.row, styles.spaceBetween]}>
                  <Text style={styles.promoApplied}>
                    ✅ {state.promoCode} applied ({state.discountPercent}% off)
                  </Text>
                  <Pressable onPress={() => dispatch({ type: CART_ACTIONS.REMOVE_PROMO })}>
                    <Text style={styles.link}>Remove</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.promoInput, promoError && { borderColor: colors.danger }]}
                      value={promoInput}
                      onChangeText={(t) => {
                        setPromoInput(t);
                        if (promoError) setPromoError('');
                      }}
                      placeholder="e.g. WELCOME10"
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="characters"
                    />
                    <Pressable style={styles.applyButton} onPress={applyPromo}>
                      <Text style={styles.primaryText}>Apply</Text>
                    </Pressable>
                  </View>
                  {promoError ? <Text style={styles.error}>{promoError}</Text> : null}
                </>
              )}
            </View>

            <View style={styles.card}>
              <View style={[styles.row, styles.spaceBetween]}>
                <Text style={styles.muted}>Subtotal</Text>
                <Text style={styles.value}>{formatPrice(subtotal)}</Text>
              </View>
              {discount > 0 && (
                <View style={[styles.row, styles.spaceBetween]}>
                  <Text style={styles.muted}>Discount ({state.discountPercent}%)</Text>
                  <Text style={[styles.value, { color: colors.success }]}>− {formatPrice(discount)}</Text>
                </View>
              )}
            </View>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    list: { padding: 12, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' },
    flex: { flex: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    spaceBetween: { justifyContent: 'space-between', marginTop: 8 },
    headerRow: { marginTop: 0, marginBottom: 8, paddingHorizontal: 4 },
    card: {
      backgroundColor: c.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
      marginBottom: 10,
    },
    tile: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    tileEmoji: { fontSize: 26 },
    name: { color: c.text, fontWeight: '700', fontSize: 15 },
    muted: { color: c.textMuted, fontSize: 13, textAlign: 'left' },
    lineTotal: { color: c.text, fontWeight: '700', fontSize: 15 },
    noteInput: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      color: c.text,
      backgroundColor: c.input,
      fontSize: 13,
    },
    sectionTitle: { color: c.text, fontWeight: '700', marginBottom: 8 },
    promoInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 9,
      color: c.text,
      backgroundColor: c.input,
    },
    applyButton: { backgroundColor: c.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
    promoApplied: { color: c.success, fontWeight: '600', flexShrink: 1 },
    error: { color: c.danger, fontSize: 12, marginTop: 6 },
    value: { color: c.text, fontWeight: '600' },
    link: { color: c.primary, fontWeight: '700' },
    primaryButton: {
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingHorizontal: 24,
      paddingVertical: 12,
      marginTop: 16,
    },
    primaryText: { color: c.onPrimary, fontWeight: '700' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: c.background },
    emptyEmoji: { fontSize: 52 },
    emptyTitle: { color: c.text, fontSize: 18, fontWeight: '700', marginVertical: 6 },
  });
