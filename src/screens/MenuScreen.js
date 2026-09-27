import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { CATEGORIES, fetchMenu, formatPrice } from '../data/menu';
import { useTheme } from '../context/ThemeContext';

const ALL = 'All';
const SEARCH_DEBOUNCE_MS = 400;
const BACK_TO_TOP_OFFSET = 300;
const MAX_RECENT_SEARCHES = 5;

export default function MenuScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ALL);
  const [filteredItems, setFilteredItems] = useState([]);

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

  // Re-filter whenever the category, the loaded items or the applied search change.
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    setFilteredItems(
      menuItems.filter(
        (item) =>
          (selectedCategory === ALL || item.category === selectedCategory) &&
          (!q ||
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q))
      )
    );
  }, [selectedCategory, menuItems, searchQuery]);

  // Keep the header title in sync with the number of items shown.
  useEffect(() => {
    navigation.setOptions({ title: `Menu (${filteredItems.length} items)` });
  }, [navigation, filteredItems.length]);

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

  const renderItem = ({ item }) => {
    const unavailable = !item.isAvailable;
    return (
      <View style={[styles.card, unavailable && styles.cardDisabled]}>
        <View style={[styles.imageTile, { backgroundColor: colors.tiles[item.category] }]}>
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

      <Text style={styles.debugLabel}>renders: {renderCount.current}</Text>

      <FlatList
        ref={listRef}
        data={filteredItems}
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
              Nothing matches "{searchQuery}". Try another word or category.
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
    chipRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
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
    debugLabel: { fontSize: 11, color: c.textMuted, marginHorizontal: 14, marginBottom: 4 },
    list: { paddingHorizontal: 12, paddingBottom: 80 },
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
    imageTile: { width: 76, height: 76, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    imageEmoji: { fontSize: 38 },
    cardBody: { flex: 1, marginLeft: 12 },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: c.text, flexShrink: 1 },
    badge: { backgroundColor: c.warning, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    badgeText: { fontSize: 10, fontWeight: '700', color: c.onWarning },
    cardDesc: { color: c.textMuted, fontSize: 13, marginTop: 2 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    price: { fontSize: 15, fontWeight: '700', color: c.primary },
    addButton: { backgroundColor: c.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
    addButtonDisabled: { backgroundColor: c.disabled },
    addText: { color: c.onPrimary, fontWeight: '700', fontSize: 13 },
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
