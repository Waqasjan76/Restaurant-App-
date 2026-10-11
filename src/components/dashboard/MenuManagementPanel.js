import React, { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useMenu } from '../../context/MenuContext';
import { useTheme } from '../../context/ThemeContext';
import { MENU_ACTIONS } from '../../reducers/menuReducer';
import { CATEGORIES, formatPrice } from '../../data/menu';
import useForm from '../../hooks/useForm';
import { showAlert } from '../../utils/alert';

const EMPTY_ITEM = { name: '', description: '', price: '', category: 'Mains', image: '🍽️', isSpecial: false };

const parsePrice = (value) => Number(String(value).trim());
const isValidPrice = (value) => {
  const n = parsePrice(value);
  return String(value).trim() !== '' && Number.isFinite(n) && n > 0 && n <= 100000;
};

function validateItem(v) {
  const errors = {};
  if (!v.name.trim()) errors.name = 'Name is required.';
  if (!v.description.trim()) errors.description = 'Add a short description.';
  if (!isValidPrice(v.price)) errors.price = 'Enter a price greater than 0.';
  if (!v.image.trim()) errors.image = 'Pick an emoji for the image.';
  return errors;
}

// One editable row: local draft price, saved on "Save".
function MenuRow({ item, styles, colors, dispatch }) {
  const [draftPrice, setDraftPrice] = useState(String(item.price));
  const dirty = draftPrice !== String(item.price);

  const save = async () => {
    if (!isValidPrice(draftPrice)) {
      showAlert('Invalid price', 'Enter a price greater than 0.');
      return;
    }
    await dispatch({
      type: MENU_ACTIONS.UPDATE_PRICE,
      payload: { id: item.id, price: parsePrice(draftPrice) },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.title}>
          {item.image} {item.name}
        </Text>
        <View style={[styles.row, { gap: 4 }]}>
          <Text style={styles.muted}>{item.isAvailable ? 'Available' : 'Hidden'}</Text>
          <Switch
            value={item.isAvailable}
            onValueChange={() => dispatch({ type: MENU_ACTIONS.TOGGLE_AVAILABILITY, payload: item.id })}
            trackColor={{ false: colors.disabled, true: colors.success }}
            thumbColor={colors.card}
          />
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.muted}>
          {item.category} · now {formatPrice(item.price)}
        </Text>
        <View style={[styles.row, { gap: 6 }]}>
          <TextInput
            style={[styles.input, { width: 90 }]}
            value={draftPrice}
            onChangeText={setDraftPrice}
            keyboardType="numeric"
            accessibilityLabel={`Price of ${item.name}`}
          />
          <Pressable
            disabled={!dirty}
            onPress={save}
            style={[styles.actionButton, !dirty && { backgroundColor: colors.disabled }]}
          >
            <Text style={styles.actionText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function MenuManagementPanel({ styles }) {
  const { menu, dispatch } = useMenu();
  const { colors } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const { values, errors, handleChange, handleSubmit, reset } = useForm(EMPTY_ITEM, validateItem);

  const addItem = handleSubmit(async (v) => {
    const saved = await dispatch({
      type: MENU_ACTIONS.ADD_ITEM,
      payload: {
        id: `m${Date.now()}`,
        name: v.name.trim(),
        description: v.description.trim(),
        price: parsePrice(v.price),
        category: v.category,
        image: v.image.trim(),
        isSpecial: v.isSpecial,
        isAvailable: true,
      },
    });
    if (!saved) return;
    reset();
    setShowForm(false);
    showAlert('Item added', `${v.name.trim()} is now on the customer menu.`);
  });

  const field = (name, label, props = {}) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[name] && styles.inputError]}
        value={values[name]}
        onChangeText={handleChange(name)}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {errors[name] ? <Text style={styles.error}>{errors[name]}</Text> : null}
    </>
  );

  return (
    <View>
      {showForm ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>New menu item</Text>
          {field('name', 'Name', { placeholder: 'e.g. Chapli Kebab' })}
          {field('description', 'Description', { placeholder: 'Short description', multiline: true })}
          {field('price', 'Price (Rs.)', { placeholder: 'e.g. 650', keyboardType: 'numeric' })}
          {field('image', 'Emoji image', { placeholder: '🍢' })}
          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => {
              const active = values.category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => handleChange('category')(cat)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            <Text style={styles.label}>Daily special</Text>
            <Switch
              value={values.isSpecial}
              onValueChange={handleChange('isSpecial')}
              trackColor={{ false: colors.disabled, true: colors.warning }}
              thumbColor={colors.card}
            />
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={addItem}>
              <Text style={styles.actionText}>Add to menu</Text>
            </Pressable>
            <Pressable
              style={styles.outlineButton}
              onPress={() => {
                reset();
                setShowForm(false);
              }}
            >
              <Text style={styles.outlineText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={[styles.actionButton, { alignItems: 'center', marginBottom: 10, paddingVertical: 11 }]} onPress={() => setShowForm(true)}>
          <Text style={styles.actionText}>+ Add menu item</Text>
        </Pressable>
      )}

      {menu.map((item) => (
        // Keyed on price too, so the draft input resets after an external change.
        <MenuRow key={`${item.id}-${item.price}`} item={item} styles={styles} colors={colors} dispatch={dispatch} />
      ))}
    </View>
  );
}
