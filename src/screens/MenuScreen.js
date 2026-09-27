import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CATEGORIES, fetchMenu } from '../data/menu';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CART_ACTIONS } from '../reducers/cartReducer';
import MenuItemCard from '../components/MenuItemCard';

const ALL = 'All';
const SEARCH_DEBOUNCE_MS = 400;
const BACK_TO_TOP_OFFSET = 300;
const MAX_RECENT_SEARCHES = 5;

const SORT_OPTIONS = [
  { key: 'default', label: 'Popular' },
  { key: 'priceAsc', label: 'Price ↑' },
  { key: 'priceDesc', label: 'Price ↓' },
  { key: 'nameAsc', label: 'A–Z' },
];

const SORTERS = {
  default: null,
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  nameAsc: (a, b) => a.name.localeCompare(b.name),
};

export default function MenuScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const { state: cart, dispatch } = useCart();
  const canOrder = user?.role !== 'manager';

  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ALL);
  const [sortOrder, setSortOrder] = useState('default');
  const [favourites, setFavourites] = useState([]); // array of menu item ids

  // Search state: what is typed vs. what is applied after the debounce.
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Holds the in-flight request so Retry / pull to refresh can be cancelled too.
  const requestRef = useRef(null);
  const searchInputRef = useRef(null); // the TextInput element
  const listRef = useRef(null); // the FlatList element
  const debounceTimerRef = useRef(null); // id of the pending debounce timeout
  const previousQueryRef = useRef(''); // last query added to the recent list

  // Render counter. Mutating ref.current does NOT trigger a re-render: a ref
  // is a plain mutable box that React keeps between renders and never watches.
  // Calling a state setter DOES re-render, because React schedules a new render
  // whenever state changes. That is why the counter can be bumped during render
  // without causing an infinite loop, while setState during render would loop.
  const renderCount = useRef(0);
  renderCount.current += 1;

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

  // Clear any pending debounce timer when the screen unmounts.
  useEffect(() => () => clearTimeout(debounceTimerRef.current), []);

  // Derived data: the visible list is computed from state, never stored in it.
  // Keeping a separate `filteredItems` state (as in Q4) duplicates information,
  // needs an extra effect to stay in sync, costs an extra render after every
  // change and can briefly show stale results. useMemo recomputes it during
  // render, and only when one of its inputs actually changes.
  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = menuItems.filter(
      (item) =>
        (selectedCategory === ALL || item.category === selectedCategory) &&
        (!q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q))
    );
    const sorter = SORTERS[sortOrder];
    return sorter ? [...result].sort(sorter) : result;
  }, [menuItems, selectedCategory, searchQuery, sortOrder]);

  // Keep the header title in sync with the number of items shown.
  useEffect(() => {
    navigation.setOptions({ title: `Menu (${visibleItems.length} items)` });
  }, [navigation, visibleItems.length]);

  // menuItemId -> quantity already in the cart
  const quantities = useMemo(
    () => Object.fromEntries(cart.items.map((i) => [i.id, i.quantity])),
    [cart.items]
  );

  // Stable handler references so React.memo on MenuItemCard can skip renders.
  const handleAddToCart = useCallback(
    (item) => dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: item }),
    [dispatch]
  );

  const handleToggleFavourite = useCallback((id) => {
    setFavourites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <MenuItemCard
        item={item}
        quantity={quantities[item.id] ?? 0}
        isFavourite={favourites.includes(item.id)}
        canOrder={canOrder}
        onAddToCart={handleAddToCart}
        onToggleFavourite={handleToggleFavourite}
      />
    ),
    [quantities, favourites, canOrder, handleAddToCart, handleToggleFavourite]
  );

  const applySearch = (text) => {
    setSearchQuery(text);
    const trimmed = text.trim();
    // The ref remembers the previous query so the same search typed twice in
    // a row is not added to the recent list again.
    if (trimmed && trimmed.toLowerCase() !== previousQueryRef.current.toLowerCase()) {
      previousQueryRef.current = trimmed;
      setRecentSearches((prev) =>
        [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(
          0,
          MAX_RECENT_SEARCHES
        )
      );
    }
  };

  // Manual debounce: restart a 400 ms timer on every keystroke.
  const handleSearchChange = (text) => {
    setSearchText(text);
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => applySearch(text), SEARCH_DEBOUNCE_MS);
  };

  const clearSearch = () => {
    clearTimeout(debounceTimerRef.current);
    setSearchText('');
    setSearchQuery('');
    searchInputRef.current?.focus(); // keep the keyboard open
  };

  const pickRecent = (term) => {
    clearTimeout(debounceTimerRef.current);
    setSearchText(term);
    applySearch(term);
  };

  const handleScroll = (e) => {
    setShowBackToTop(e.nativeEvent.contentOffset.y > BACK_TO_TOP_OFFSET);
  };

  const scrollToTop = () => listRef.current?.scrollToOffset({ offset: 0, animated: true });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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

  const showSuggestions = isSearchFocused && !searchText && recentSearches.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Pressable onPress={() => searchInputRef.current?.focus()} hitSlop={8}>
          <Text style={styles.searchIcon}>🔍</Text>
        </Pressable>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearchChange}
          placeholder="Search dishes or ingredients"
          placeholderTextColor={colors.textMuted}
          onFocus={() => setIsSearchFocused(true)}
          // Small delay so a tap on a suggestion lands before the list hides.
          onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchText ? (
          <Pressable onPress={clearSearch} hitSlop={8}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {showSuggestions && (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>Recent searches</Text>
          <View style={styles.suggestionRow}>
            {recentSearches.map((term) => (
              <Pressable key={term} onPress={() => pickRecent(term)} style={styles.suggestionChip}>
                <Text style={styles.suggestionText}>🕘 {term}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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

      <View style={styles.sortRow}>
        <Text style={styles.debugLabel}>renders: {renderCount.current}</Text>
        <View style={styles.sortOptions}>
          {SORT_OPTIONS.map((opt) => {
            const active = opt.key === sortOrder;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setSortOrder(opt.key)}
                style={[styles.sortChip, active && styles.sortChipActive]}
              >
                <Text style={[styles.sortText, active && styles.sortTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => loadMenu(true)}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No dishes found</Text>
            <Text style={styles.muted}>
              {searchQuery
                ? `Nothing matches "${searchQuery}". Try another word or category.`
                : 'No dishes in this category right now.'}
            </Text>
          </View>
        }
      />

      {showBackToTop && (
        <Pressable style={styles.fab} onPress={scrollToTop}>
          <Text style={styles.fabText}>↑ Back to top</Text>
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: c.background },
    muted: { color: c.textMuted, marginTop: 12, textAlign: 'center' },
    errorEmoji: { fontSize: 40 },
    errorText: { color: c.danger, textAlign: 'center', marginVertical: 12 },
    retryButton: { backgroundColor: c.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: c.onPrimary, fontWeight: '700' },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 12,
      marginTop: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    searchIcon: { fontSize: 16 },
    searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 15, color: c.text },
    clearIcon: { fontSize: 16, color: c.textMuted, paddingHorizontal: 4 },
    suggestions: { marginHorizontal: 12, marginTop: 8 },
    suggestionsTitle: { fontSize: 12, color: c.textMuted, marginBottom: 6 },
    suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    suggestionChip: { backgroundColor: c.subtle, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
    suggestionText: { color: c.text, fontSize: 13 },
    chipRow: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, gap: 8 },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.card,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { color: c.text, fontWeight: '600' },
    chipTextActive: { color: c.onPrimary },
    sortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 6,
    },
    sortOptions: { flexDirection: 'row', gap: 4 },
    sortChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    sortChipActive: { backgroundColor: c.subtle },
    sortText: { color: c.textMuted, fontSize: 12, fontWeight: '600' },
    sortTextActive: { color: c.primary },
    debugLabel: { fontSize: 11, color: c.textMuted },
    list: { paddingHorizontal: 12, paddingBottom: 80 },
    empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
    emptyEmoji: { fontSize: 44 },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: c.text, marginTop: 8 },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 20,
      backgroundColor: c.fab,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 10,
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    fabText: { color: c.onFab, fontWeight: '700' },
  });
