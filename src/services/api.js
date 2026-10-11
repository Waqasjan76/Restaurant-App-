const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

let authToken = null;

async function request(path, options = {}) {
  const headers = { Accept: 'application/json', ...options.headers };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Cannot reach the restaurant API at ${API_URL}. Check the backend and API URL.`);
    }
    throw error;
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `Restaurant API request failed (${response.status}).`);
  }
  return body;
}

async function authenticate(path, credentials) {
  const result = await request(path, { method: 'POST', body: credentials });
  authToken = result.token;
  return result.user;
}

export const api = {
  getHealth: () => request('/health'),
  login: (credentials) => authenticate('/auth/login', credentials),
  register: (account) => authenticate('/auth/register', account),
  logout: () => {
    authToken = null;
  },
  getMenu: (signal) => request('/menu', { signal }),
  addMenuItem: (item) => request('/menu', { method: 'POST', body: item }),
  updateMenuItem: (id, changes) =>
    request(`/menu/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes }),
  getOrders: () => request('/orders'),
  createOrder: (order) => request('/orders', { method: 'POST', body: order }),
  updateOrder: (id, changes) =>
    request(`/orders/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes }),
  getReservations: () => request('/reservations'),
  createReservation: (reservation) => request('/reservations', { method: 'POST', body: reservation }),
  updateReservation: (id, changes) =>
    request(`/reservations/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes }),
};
