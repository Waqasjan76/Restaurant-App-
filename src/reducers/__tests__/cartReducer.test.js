import { CART_ACTIONS, cartReducer, initialCartState, selectItemCount } from '../cartReducer';

const burger = { id: 'm7', name: 'Beef Burger', price: 950, image: '🍔', category: 'Mains' };
const chai = { id: 'm17', name: 'Doodh Patti Chai', price: 200, image: '☕', category: 'Drinks' };

const cartWith = (...entries) => ({
  ...initialCartState,
  items: entries.map(([item, quantity, note = '']) => ({ ...item, quantity, note })),
});

// Deep-freezing the input proves the reducer never mutates previous state:
// any attempted mutation throws in strict mode.
const deepFreeze = (obj) => {
  Object.values(obj).forEach((v) => v && typeof v === 'object' && deepFreeze(v));
  return Object.freeze(obj);
};

describe('cartReducer', () => {
  test('TC1 ADD_ITEM adds a new item with quantity 1', () => {
    const next = cartReducer(deepFreeze(cartWith()), { type: CART_ACTIONS.ADD_ITEM, payload: burger });
    expect(next.items).toEqual([{ ...burger, quantity: 1, note: '' }]);
  });

  test('TC2 ADD_ITEM on an existing item increments its quantity', () => {
    const prev = deepFreeze(cartWith([burger, 1]));
    const next = cartReducer(prev, { type: CART_ACTIONS.ADD_ITEM, payload: burger });
    expect(next.items[0].quantity).toBe(2);
    expect(prev.items[0].quantity).toBe(1);
  });

  test('TC3 DECREMENT at quantity 1 removes the item', () => {
    const prev = deepFreeze(cartWith([burger, 1], [chai, 2]));
    const next = cartReducer(prev, { type: CART_ACTIONS.DECREMENT, payload: burger.id });
    expect(next.items.map((i) => i.id)).toEqual([chai.id]);
  });

  test('TC4 INCREMENT raises only the targeted item', () => {
    const prev = deepFreeze(cartWith([burger, 1], [chai, 2]));
    const next = cartReducer(prev, { type: CART_ACTIONS.INCREMENT, payload: chai.id });
    expect(next.items.find((i) => i.id === chai.id).quantity).toBe(3);
    expect(next.items.find((i) => i.id === burger.id).quantity).toBe(1);
  });

  test('TC5 UPDATE_NOTE stores special instructions', () => {
    const prev = deepFreeze(cartWith([burger, 1]));
    const next = cartReducer(prev, {
      type: CART_ACTIONS.UPDATE_NOTE,
      payload: { id: burger.id, note: 'no onions' },
    });
    expect(next.items[0].note).toBe('no onions');
  });

  test('TC6 REMOVE_ITEM deletes the item regardless of quantity', () => {
    const prev = deepFreeze(cartWith([burger, 4]));
    const next = cartReducer(prev, { type: CART_ACTIONS.REMOVE_ITEM, payload: burger.id });
    expect(next.items).toEqual([]);
  });

  test('TC7 APPLY_PROMO with a valid code sets code and percent', () => {
    const next = cartReducer(deepFreeze(cartWith([burger, 1])), {
      type: CART_ACTIONS.APPLY_PROMO,
      payload: ' feast20 ',
    });
    expect(next.promoCode).toBe('FEAST20');
    expect(next.discountPercent).toBe(20);
  });

  test('TC8 APPLY_PROMO with an invalid code returns the same state', () => {
    const prev = deepFreeze(cartWith([burger, 1]));
    const next = cartReducer(prev, { type: CART_ACTIONS.APPLY_PROMO, payload: 'FREEFOOD' });
    expect(next).toBe(prev);
  });

  test('TC9 REMOVE_PROMO resets the discount', () => {
    const prev = deepFreeze({ ...cartWith([burger, 1]), promoCode: 'WELCOME10', discountPercent: 10 });
    const next = cartReducer(prev, { type: CART_ACTIONS.REMOVE_PROMO });
    expect(next.promoCode).toBeNull();
    expect(next.discountPercent).toBe(0);
  });

  test('TC10 CLEAR_CART returns the initial state', () => {
    const prev = deepFreeze({ ...cartWith([burger, 2], [chai, 1]), promoCode: 'WELCOME10', discountPercent: 10 });
    expect(cartReducer(prev, { type: CART_ACTIONS.CLEAR_CART })).toEqual(initialCartState);
  });

  test('unknown actions return the same state', () => {
    const prev = deepFreeze(cartWith([burger, 1]));
    expect(cartReducer(prev, { type: 'UNKNOWN' })).toBe(prev);
  });

  test('selectItemCount sums quantities', () => {
    expect(selectItemCount(cartWith([burger, 2], [chai, 3]))).toBe(5);
  });
});
