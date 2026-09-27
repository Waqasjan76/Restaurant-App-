import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatPrice } from '../data/menu';

function MenuItemCard({ item, quantity, isFavourite, canOrder, onAddToCart, onToggleFavourite }) {
  // Used for the Q8 before/after check: with React.memo and stable
  // useCallback handlers, only the card whose props changed logs here.
  console.log(`[MenuItemCard] render: ${item.name}`);

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const unavailable = !item.isAvailable;

  return (
    <View style={[styles.card, unavailable && styles.cardDisabled]}>
      <View style={[styles.imageTile, { backgroundColor: colors.tiles[item.category] ?? colors.subtle }]}>
        <Text style={styles.imageEmoji}>{item.image}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Pressable
            onPress={() => onToggleFavourite(item.id)}
            hitSlop={8}
            accessibilityLabel={isFavourite ? `Unfavourite ${item.name}` : `Favourite ${item.name}`}
          >
            <Ionicons
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavourite ? colors.danger : colors.textMuted}
            />
          </Pressable>
        </View>
        {item.isSpecial && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⭐ Daily Special</Text>
          </View>
        )}
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          {canOrder && (
            <Pressable
              disabled={unavailable}
              onPress={() => onAddToCart(item)}
              style={[styles.addButton, unavailable && styles.addButtonDisabled]}
            >
              <Text style={styles.addText}>
                {unavailable ? 'Unavailable' : quantity ? `+ Add (${quantity})` : '+ Add to Cart'}
              </Text>
            </Pressable>
          )}
          {!canOrder && unavailable && <Text style={styles.unavailableTag}>Unavailable</Text>}
        </View>
      </View>
    </View>
  );
}

// React.memo skips re-rendering when all props are shallowly equal.
export default memo(MenuItemCard);

const createStyles = (c) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: 14,
      padding: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardDisabled: { opacity: 0.45 },
    imageTile: { width: 80, height: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    imageEmoji: { fontSize: 40 },
    cardBody: { flex: 1, marginLeft: 12 },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: c.text, flexShrink: 1 },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: c.warning,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginTop: 3,
    },
    badgeText: { fontSize: 10, fontWeight: '700', color: c.onWarning },
    cardDesc: { color: c.textMuted, fontSize: 13, marginTop: 3 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    price: { fontSize: 15, fontWeight: '700', color: c.primary },
    addButton: { backgroundColor: c.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    addButtonDisabled: { backgroundColor: c.disabled },
    addText: { color: c.onPrimary, fontWeight: '700', fontSize: 13 },
    unavailableTag: { color: c.danger, fontWeight: '700', fontSize: 12 },
  });
