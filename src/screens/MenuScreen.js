import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CATEGORIES, CATEGORY_COLORS, fetchMenu, formatPrice } from '../data/menu';

const ALL = 'All';

export default function MenuScreen({ navigation }) {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ALL);
  const [filteredItems, setFilteredItems] = useState([]);

  // Holds the in-flight request so Retry / pull to refresh can be cancelled too.
  const requestRef = useRef(null);

  const loadMenu = (isRefresh = false) => {
    requestRef.current?.cancel();
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);
    setError(null);

    const request = fetchMenu();
    requestRef.current = request;
    request.promise
      .then((items) => setMenuItems(items))
      .catch((e) => setError(e.message))
      .finally(() => {
        setIsLoading(false);
        setRefreshing(false);
      });
  };

  // "Fetch" the menu once when the screen mounts. The cleanup clears the
  // pending timer so no state update happens after the screen unmounts.
  useEffect(() => {
    loadMenu();
    return () => requestRef.current?.cancel();
  }, []);

  // Re-filter whenever the selected category or the loaded items change.
  useEffect(() => {
    setFilteredItems(
      selectedCategory === ALL
        ? menuItems
        : menuItems.filter((item) => item.category === selectedCategory)
    );
  }, [selectedCategory, menuItems]);

  // Keep the header title in sync with the number of items shown.
  useEffect(() => {
    navigation.setOptions({ title: `Menu (${filteredItems.length} items)` });
  }, [navigation, filteredItems.length]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e4572e" />
        <Text style={styles.muted}>Loading today's menu…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => loadMenu()}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const unavailable = !item.isAvailable;
    return (
      <View style={[styles.card, unavailable && styles.cardDisabled]}>
        <View style={[styles.imageTile, { backgroundColor: CATEGORY_COLORS[item.category] }]}>
          <Text style={styles.imageEmoji}>{item.image}</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            {item.isSpecial && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Daily Special</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            <Pressable
              disabled={unavailable}
              style={[styles.addButton, unavailable && styles.addButtonDisabled]}
            >
              <Text style={styles.addText}>{unavailable ? 'Unavailable' : '+ Add'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {[ALL, ...CATEGORIES].map((cat) => {
            const active = cat === selectedCategory;
            return (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => loadMenu(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fffaf5' },
  muted: { color: '#777', marginTop: 12 },
  errorEmoji: { fontSize: 40 },
  errorText: { color: '#d93025', textAlign: 'center', marginVertical: 12 },
  retryButton: { backgroundColor: '#e4572e', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  chipRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0d6cc',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#e4572e', borderColor: '#e4572e' },
  chipText: { color: '#444', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0e6dc',
  },
  cardDisabled: { opacity: 0.45 },
  imageTile: { width: 76, height: 76, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  imageEmoji: { fontSize: 38 },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#222', flexShrink: 1 },
  badge: { backgroundColor: '#ffb400', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#3a2a00' },
  cardDesc: { color: '#666', fontSize: 13, marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { fontSize: 15, fontWeight: '700', color: '#e4572e' },
  addButton: { backgroundColor: '#e4572e', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  addButtonDisabled: { backgroundColor: '#aaa' },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
