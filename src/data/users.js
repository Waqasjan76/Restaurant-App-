// Mock user store. There is no backend: accounts live in this array and
// requests are simulated with a one second setTimeout.

export const NETWORK_DELAY_MS = 1000;

export const users = [
  {
    id: 'u1',
    fullName: 'Ayesha Khan',
    email: 'customer@demo.com',
    password: 'Customer123',
    role: 'customer',
    phone: '0300-1234567',
  },
  {
    id: 'u2',
    fullName: 'Bilal Ahmed',
    email: 'manager@demo.com',
    password: 'Manager123',
    role: 'manager',
    phone: '0321-7654321',
  },
  {
    id: 'u3',
    fullName: 'Sara Malik',
    email: 'sara@demo.com',
    password: 'Sara12345',
    role: 'customer',
    phone: '0333-5550101',
  },
];

// Never hand the password to the UI layer.
const toPublicUser = ({ password, ...rest }) => rest;

export function authenticate(email, password, userList = users) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const match = userList.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );
      if (match) resolve(toPublicUser(match));
      else reject(new Error('Invalid email or password. Please try again.'));
    }, NETWORK_DELAY_MS);
  });
}

export function registerUser({ fullName, email, password, role }, userList = users) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const exists = userList.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (exists) {
        reject(new Error('An account with this email already exists.'));
        return;
      }
      const newUser = {
        id: `u${Date.now()}`,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        phone: '',
      };
      resolve(newUser);
    }, NETWORK_DELAY_MS);
  });
}

export { toPublicUser };
