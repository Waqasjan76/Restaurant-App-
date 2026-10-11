export const ORDER_ACTIONS = {
  PLACE_ORDER: 'PLACE_ORDER',
  UPDATE_STATUS: 'UPDATE_ORDER_STATUS',
};

// Main path of the Order state machine. Cancelled is reachable from Pending
// and Preparing only.
export const ORDER_FLOW = ['Pending', 'Preparing', 'Ready', 'Served'];
export const FINAL_STATUSES = ['Served', 'Cancelled'];

export const ALLOWED_TRANSITIONS = {
  Pending: ['Preparing', 'Cancelled'],
  Preparing: ['Ready', 'Cancelled'],
  Ready: ['Served'],
  Served: [],
  Cancelled: [],
};

// Demo timings for automatic progress on the tracking screen.
export const AUTO_PROGRESS_MS = { Preparing: 10000, Ready: 20000, Served: 30000 };

export const canTransition = (from, to) => ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;

export function ordersReducer(state, action) {
  switch (action.type) {
    case 'REPLACE_ORDERS':
      return action.payload;
    case ORDER_ACTIONS.PLACE_ORDER:
      return [action.payload, ...state];

    case ORDER_ACTIONS.UPDATE_STATUS: {
      const { id, status, manual = false } = action.payload;
      return state.map((order) => {
        if (order.id !== id) return order;
        // Guard the state machine. Manual changes must be a legal transition.
        // Automatic progress may only move forward along ORDER_FLOW (it can
        // skip a step if the app was closed) and stops after a manual change.
        if (!manual && order.manualOverride) return order;
        const forward =
          !FINAL_STATUSES.includes(order.status) &&
          ORDER_FLOW.indexOf(status) > ORDER_FLOW.indexOf(order.status);
        const allowed = manual ? canTransition(order.status, status) : forward;
        if (!allowed) return order;
        return {
          ...order,
          status,
          // Once a manager changes the status, stop the automatic demo timer.
          manualOverride: order.manualOverride || manual,
          statusTimes: { ...order.statusTimes, [status]: Date.now() },
        };
      });
    }

    default:
      return state;
  }
}
