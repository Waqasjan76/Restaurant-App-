import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function QuantityStepper({ quantity, onIncrement, onDecrement }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <Pressable onPress={onDecrement} style={styles.btn} hitSlop={6} accessibilityLabel="Decrease quantity">
        <Text style={[styles.symbol, { color: colors.primary }]}>−</Text>
      </Pressable>
      <Text style={[styles.qty, { color: colors.text }]}>{quantity}</Text>
      <Pressable onPress={onIncrement} style={styles.btn} hitSlop={6} accessibilityLabel="Increase quantity">
        <Text style={[styles.symbol, { color: colors.primary }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8 },
  btn: { paddingHorizontal: 10, paddingVertical: 4 },
  symbol: { fontSize: 18, fontWeight: '700' },
  qty: { minWidth: 22, textAlign: 'center', fontWeight: '700', fontSize: 15 },
});
