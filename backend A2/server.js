require('dotenv').config();

const bcrypt = require('bcryptjs');
const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');
const seedMenu = require('./menu-seed.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

let databaseMode = 'persistent';

const publicDocument = (_document, result = _document) => {
  delete result._id;
  delete result.__v;
  delete result.password;
  return result;
};

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'manager'], default: 'customer' },
    phone: { type: String, default: '' },
  },
  { toJSON: { transform: publicDocument } }
);

const menuSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 1 },
    category: { type: String, required: true },
    image: { type: String, default: '🍽️' },
    isSpecial: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
  },
  { toJSON: { transform: publicDocument } }
);

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    items: { type: [mongoose.Schema.Types.Mixed], required: true },
    totals: { type: mongoose.Schema.Types.Mixed, required: true },
    total: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['dine-in', 'takeaway'], required: true },
    tableId: { type: String, default: null },
    pickupTime: { type: String, default: null },
    status: {
      type: String,
      enum: ['Pending', 'Preparing', 'Ready', 'Served', 'Cancelled'],
      default: 'Pending',
    },
    statusTimes: { type: mongoose.Schema.Types.Mixed, default: {} },
    manualOverride: { type: Boolean, default: false },
    timestamp: { type: Number, required: true },
  },
  { toJSON: { transform: publicDocument } }
);

const reservationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1, max: 12 },
    tableId: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Accepted', 'Declined', 'Cancelled'], default: 'Pending' },
    createdAt: { type: Number, required: true },
  },
  { toJSON: { transform: publicDocument } }
);

const User = mongoose.model('User', userSchema);
const MenuItem = mongoose.model('MenuItem', menuSchema);
const Order = mongoose.model('Order', orderSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const requireAuth = asyncRoute(async (req, _res, next) => {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  if (!token) throw new HttpError(401, 'Log in to continue.');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = { id: payload.id, role: payload.role };
    next();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'Your session is invalid or expired. Please log in again.');
  }
});

const requireManager = (req, _res, next) => {
  if (req.auth.role !== 'manager') return next(new HttpError(403, 'Manager access is required.'));
  return next();
};

app.get('/', (_req, res) => res.json({ message: 'Restaurant API is running' }));
app.get('/api/health', (_req, res) =>
  res.json({
    api: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected',
    databaseMode,
  })
);

app.post(
  '/api/auth/register',
  asyncRoute(async (req, res) => {
    const { fullName, email, password, role, managerCode } = req.body || {};
    if (typeof fullName !== 'string' || !fullName.trim() ||
      typeof email !== 'string' || !email.trim() ||
      typeof password !== 'string' || !password) {
      throw new HttpError(400, 'Full name, email, and password are required.');
    }
    if (!/^(?=.*\d).{8,}$/.test(password)) {
      throw new HttpError(400, 'Password must be at least 8 characters and contain a digit.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      throw new HttpError(400, 'Enter a valid email address.');
    }
    if (role === 'manager' &&
      (!process.env.MANAGER_SIGNUP_CODE || managerCode !== process.env.MANAGER_SIGNUP_CODE)) {
      throw new HttpError(403, 'Manager registration requires a valid invitation code.');
    }
    if (await User.exists({ email: email.trim().toLowerCase() })) {
      throw new HttpError(409, 'An account with this email already exists.');
    }

    const user = await User.create({
      id: `u${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 12),
      role: role === 'manager' ? 'manager' : 'customer',
    });
    res.status(201).json({ token: createToken(user), user: user.toJSON() });
  })
);

app.post(
  '/api/auth/login',
  asyncRoute(async (req, res) => {
    const body = req.body || {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new HttpError(401, 'Invalid email or password. Please try again.');
    }
    res.json({ token: createToken(user), user: user.toJSON() });
  })
);

app.get(
  '/api/menu',
  asyncRoute(async (_req, res) => {
    const items = await MenuItem.find().lean({ transform: publicDocument });
    items.sort((a, b) => {
      const aNumber = Number(a.id.match(/\d+$/)?.[0] || 0);
      const bNumber = Number(b.id.match(/\d+$/)?.[0] || 0);
      return aNumber - bNumber || a.id.localeCompare(b.id);
    });
    res.json(items);
  })
);

app.post(
  '/api/menu',
  requireAuth,
  requireManager,
  asyncRoute(async (req, res) => {
    const item = await MenuItem.create(req.body);
    res.status(201).json(item);
  })
);

app.patch(
  '/api/menu/:id',
  requireAuth,
  requireManager,
  asyncRoute(async (req, res) => {
    const item = await MenuItem.findOneAndUpdate({ id: req.params.id }, { $set: req.body }, {
      new: true,
      runValidators: true,
    });
    if (!item) throw new HttpError(404, 'Menu item not found.');
    res.json(item);
  })
);

app.get(
  '/api/orders',
  requireAuth,
  asyncRoute(async (req, res) => {
    const filter = req.auth.role === 'manager' ? {} : { userId: req.auth.id };
    res.json(await Order.find(filter).sort({ timestamp: -1 }).lean({ transform: publicDocument }));
  })
);

app.post(
  '/api/orders',
  requireAuth,
  asyncRoute(async (req, res) => {
    const order = await Order.create({
      ...req.body,
      userId: req.auth.id,
      customerName: req.body.customerName || 'Customer',
      status: 'Pending',
      statusTimes: { Pending: Date.now() },
      manualOverride: false,
      timestamp: Date.now(),
    });
    res.status(201).json(order);
  })
);

const orderTransitions = {
  Pending: ['Preparing', 'Cancelled'],
  Preparing: ['Ready', 'Cancelled'],
  Ready: ['Served'],
  Served: [],
  Cancelled: [],
};

app.patch(
  '/api/orders/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) throw new HttpError(404, 'Order not found.');
    if (req.auth.role !== 'manager' && order.userId !== req.auth.id) {
      throw new HttpError(403, 'You cannot update this order.');
    }
    const { status, manual = false } = req.body;
    const forwardProgress = ['Pending', 'Preparing', 'Ready', 'Served'].indexOf(status) >
      ['Pending', 'Preparing', 'Ready', 'Served'].indexOf(order.status);
    const validTransition = manual
      ? orderTransitions[order.status]?.includes(status)
      : req.auth.role === 'customer'
        ? forwardProgress
        : orderTransitions[order.status]?.includes(status);
    if (!validTransition) {
      throw new HttpError(409, `Order cannot move from ${order.status} to ${status}.`);
    }
    const autoProgressAt = { Preparing: 10000, Ready: 20000, Served: 30000 };
    if (req.auth.role !== 'manager') {
      if (manual && status !== 'Cancelled') {
        throw new HttpError(403, 'Customers may only manually cancel their own orders.');
      }
      if (!manual && (status === 'Cancelled' || order.manualOverride)) {
        throw new HttpError(403, 'This order cannot be advanced automatically.');
      }
      if (!manual && Date.now() - order.timestamp < autoProgressAt[status]) {
        throw new HttpError(409, 'This order is not ready to advance yet.');
      }
    }
    order.status = status;
    order.manualOverride = order.manualOverride || manual;
    order.statusTimes = { ...order.statusTimes, [status]: Date.now() };
    await order.save();
    res.json(order);
  })
);

app.get(
  '/api/reservations',
  requireAuth,
  asyncRoute(async (req, res) => {
    const filter = req.auth.role === 'manager' ? {} : { userId: req.auth.id };
    res.json(await Reservation.find(filter).sort({ createdAt: -1 }).lean({ transform: publicDocument }));
  })
);

app.post(
  '/api/reservations',
  requireAuth,
  asyncRoute(async (req, res) => {
    const conflictingBooking = await Reservation.exists({
      date: req.body.date,
      time: req.body.time,
      tableId: req.body.tableId,
      status: { $in: ['Pending', 'Accepted'] },
    });
    if (conflictingBooking) throw new HttpError(409, 'That table was just booked. Choose another table or time.');
    const reservation = await Reservation.create({
      ...req.body,
      userId: req.auth.id,
      status: 'Pending',
      createdAt: Date.now(),
    });
    res.status(201).json(reservation);
  })
);

app.patch(
  '/api/reservations/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const reservation = await Reservation.findOne({ id: req.params.id });
    if (!reservation) throw new HttpError(404, 'Reservation not found.');
    if (req.auth.role !== 'manager' && reservation.userId !== req.auth.id) {
      throw new HttpError(403, 'You cannot update this reservation.');
    }
    const { status } = req.body;
    const allowed = req.auth.role === 'manager'
      ? ['Accepted', 'Declined', 'Cancelled']
      : ['Cancelled'];
    if (!allowed.includes(status)) throw new HttpError(403, 'You cannot set that reservation status.');
    reservation.status = status;
    await reservation.save();
    res.json(reservation);
  })
);

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Request body must contain valid JSON.' });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: error.message });
  }
  if (error.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  const status = error.status || 500;
  if (status === 500) console.error('API error:', error);
  return res.status(status).json({ message: status === 500 ? 'An unexpected server error occurred.' : error.message });
});

async function seedDatabase() {
  if ((await MenuItem.estimatedDocumentCount()) === 0) {
    await MenuItem.insertMany(seedMenu);
    console.log(`Seeded ${seedMenu.length} menu items`);
  }

  const demoUsers = [
    { fullName: 'Ayesha Khan', email: 'customer@demo.com', password: 'Customer123', role: 'customer', phone: '0300-1234567' },
    { fullName: 'Bilal Ahmed', email: 'manager@demo.com', password: 'Manager123', role: 'manager', phone: '0321-7654321' },
    { fullName: 'Sara Malik', email: 'sara@demo.com', password: 'Sara12345', role: 'customer', phone: '0333-5550101' },
  ];
  for (const account of demoUsers) {
    if (!(await User.exists({ email: account.email }))) {
      await User.create({
        ...account,
        id: account.email.split('@')[0],
        password: await bcrypt.hash(account.password, 12),
      });
    }
  }
}

async function startServer() {
  if (process.env.USE_MEMORY_DB === 'true') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('USE_MEMORY_DB is for local demos only and cannot run in production.');
    }
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const memoryServer = await MongoMemoryServer.create({ instance: { startupTimeout: 60000 } });
    await mongoose.connect(memoryServer.getUri('restaurant_app_demo'));
    databaseMode = 'in-memory demo';
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
    }
    console.log('Using an in-memory MongoDB; demo data is discarded when the backend stops.');
  } else {
    if (!process.env.MONGODB_URI) {
      throw new Error('Set MONGODB_URI or enable USE_MEMORY_DB=true for a local demo.');
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('Set JWT_SECRET to a private random value of at least 32 characters.');
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }
  await seedDatabase();
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, '0.0.0.0', () =>
    console.log(`Restaurant API running on port ${port} (${databaseMode})`)
  );
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Startup error:', error.message);
    process.exitCode = 1;
  });
}

module.exports = app;
