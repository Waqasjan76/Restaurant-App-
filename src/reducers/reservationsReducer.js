export const RESERVATION_ACTIONS = {
  ADD: 'ADD_RESERVATION',
  CANCEL: 'CANCEL_RESERVATION',
  SET_STATUS: 'SET_RESERVATION_STATUS',
};

// Statuses that occupy a table in a slot.
export const ACTIVE_STATUSES = ['Pending', 'Accepted'];

export function reservationsReducer(state, action) {
  switch (action.type) {
    case RESERVATION_ACTIONS.ADD:
      return [action.payload, ...state];
    case RESERVATION_ACTIONS.CANCEL:
      return state.map((r) => (r.id === action.payload ? { ...r, status: 'Cancelled' } : r));
    case RESERVATION_ACTIONS.SET_STATUS: {
      const { id, status } = action.payload;
      return state.map((r) => (r.id === id ? { ...r, status } : r));
    }
    default:
      return state;
  }
}
