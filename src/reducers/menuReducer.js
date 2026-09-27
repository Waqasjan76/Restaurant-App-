export const MENU_ACTIONS = {
  ADD_ITEM: 'ADD_MENU_ITEM',
  UPDATE_PRICE: 'UPDATE_MENU_PRICE',
  TOGGLE_AVAILABILITY: 'TOGGLE_MENU_AVAILABILITY',
};

export function menuReducer(state, action) {
  switch (action.type) {
    case MENU_ACTIONS.ADD_ITEM:
      return [...state, action.payload];
    case MENU_ACTIONS.UPDATE_PRICE: {
      const { id, price } = action.payload;
      return state.map((item) => (item.id === id ? { ...item, price } : item));
    }
    case MENU_ACTIONS.TOGGLE_AVAILABILITY:
      return state.map((item) =>
        item.id === action.payload ? { ...item, isAvailable: !item.isAvailable } : item
      );
    default:
      return state;
  }
}
