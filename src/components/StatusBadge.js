import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const colorKey = {
  Pending: 'warning',
  Preparing: 'info',
  Ready: 'success',
  Served: 'textMuted',
  Accepted: 'success',
  Declined: 'danger',
  Cancelled: 'danger',
};

export default function StatusBadge({ status }) {
  const { colors } = useTheme();
  const color = colors[colorKey[status] ?? 'textMuted'];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '700' },
});
