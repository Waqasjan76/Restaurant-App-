import { ORDER_ACTIONS, canTransition, ordersReducer } from '../ordersReducer';

const order = (status, extra = {}) => ({
  id: 'ORD-1',
  status,
  statusTimes: { Pending: 0 },
  manualOverride: false,
  ...extra,
});

const update = (state, status, manual = false) =>
  ordersReducer(state, { type: ORDER_ACTIONS.UPDATE_STATUS, payload: { id: 'ORD-1', status, manual } });

describe('ordersReducer / Order state machine', () => {
  test('PLACE_ORDER puts the new order first', () => {
    const next = ordersReducer([order('Served', { id: 'old' })], {
      type: ORDER_ACTIONS.PLACE_ORDER,
      payload: order('Pending'),
    });
    expect(next.map((o) => o.id)).toEqual(['ORD-1', 'old']);
  });

  test('manual legal transition Pending -> Preparing is applied and stops auto progress', () => {
    const [next] = update([order('Pending')], 'Preparing', true);
    expect(next.status).toBe('Preparing');
    expect(next.manualOverride).toBe(true);
    expect(next.statusTimes.Preparing).toEqual(expect.any(Number));
  });

  test('manual illegal transition Pending -> Served is ignored', () => {
    const state = [order('Pending')];
    expect(update(state, 'Served', true)[0]).toBe(state[0]);
  });

  test('automatic progress may skip ahead but never goes back', () => {
    expect(update([order('Pending')], 'Ready')[0].status).toBe('Ready');
    expect(update([order('Ready')], 'Preparing')[0].status).toBe('Ready');
  });

  test('automatic progress stops after a manual change', () => {
    expect(update([order('Preparing', { manualOverride: true })], 'Ready')[0].status).toBe('Preparing');
  });

  test('Served and Cancelled are final', () => {
    expect(canTransition('Served', 'Cancelled')).toBe(false);
    expect(canTransition('Cancelled', 'Preparing')).toBe(false);
    expect(update([order('Cancelled')], 'Served')[0].status).toBe('Cancelled');
  });

  test('Ready orders cannot be cancelled', () => {
    expect(update([order('Ready')], 'Cancelled', true)[0].status).toBe('Ready');
  });
});
