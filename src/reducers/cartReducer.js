import { lookupPromo, normalizePromo } from '../data/promoCodes';

export const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  INCREMENT: 'INCREMENT',
  DECREMENT: 'DECREMENT',
  UPDATE_NOTE: 'UPDATE_NOTE',
  CLEAR_CART: 'CLEAR_CART',
  APPLY_PROMO: 'APPLY_PROMO',
  REMOVE_PROMO: 'REMOVE_PROMO',
};

export const initialCartState = {
  items: [], // [{ id, name, price, image, category, quantity, note }]
  promoCode: null,
  discountPercent: 0,
};

const changeQuantity = (items, id, delta) =>
  items
    .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
    .filter((item) => item.quantity > 0);

// Pure reducer: it never mutates `state`; every branch returns a new object
// (or the same object when nothing changes).
export function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const menuItem = action.payload;
      const existing = state.items.find((i) => i.id === menuItem.id);
      if (existing) {
        return { ...state, items: changeQuantity(state.items, menuItem.id, 1) };
      }
      const newItem = {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        image: menuItem.image,
        category: menuItem.category,
        quantity: 1,
        note: '',
      };
      return { ...state, items: [...state.items, newItem] };
    }

    case CART_ACTIONS.REMOVE_ITEM:
      return { ...state, items: state.items.filter((i) => i.id !== action.payload) };

    case CART_ACTIONS.INCREMENT:
      return { ...state, items: changeQuantity(state.items, action.payload, 1) };

    // Removes the item once its quantity reaches zero.
    case CART_ACTIONS.DECREMENT:
      return { ...state, items: changeQuantity(state.items, action.payload, -1) };

    case CART_ACTIONS.UPDATE_NOTE: {
      const { id, note } = action.payload;
      return {
        ...state,
        items: state.items.map((i) => (i.id === id ? { ...i, note } : i)),
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      return initialCartState;

    case CART_ACTIONS.APPLY_PROMO: {
      const percent = lookupPromo(action.payload);
      // Invalid codes leave the state untouched; the UI shows the error.
      if (!percent) return state;
      return { ...state, promoCode: normalizePromo(action.payload), discountPercent: percent };
    }

    case CART_ACTIONS.REMOVE_PROMO:
      return { ...state, promoCode: null, discountPercent: 0 };

    default:
      return state;
  }
}

export const selectItemCount = (state) => state.items.reduce((sum, i) => sum + i.quantity, 0);
