import { addDays, toISODate } from '../utils/date';
import { mockTables } from './tables';

// Seed bookings, generated relative to today so the demo always has data:
// tomorrow 19:00 is fully booked (every slot disabled), and tomorrow 20:00 has
// only small tables left (disabled for parties larger than four).
const tomorrow = toISODate(addDays(new Date(), 1));
const inTwoDays = toISODate(addDays(new Date(), 2));

const guestNames = ['Hamza Iqbal', 'Fatima Noor', 'Usman Tariq', 'Zainab Raza', 'Ali Hassan', 'Mehwish Ali', 'Omar Farooq', 'Hina Shah'];

const fullyBooked = mockTables.map((table, i) => ({
  id: `r-seed-${table.id}-1900`,
  userId: 'guest',
  customerName: guestNames[i],
  phone: `0300-55500${10 + i}`,
  date: tomorrow,
  time: '19:00',
  partySize: Math.min(table.seats, 2 + i),
  tableId: table.id,
  status: 'Accepted',
  createdAt: Date.now() - 86400000,
}));

export const mockReservations = [
  ...fullyBooked,
  { id: 'r-seed-T6-2000', userId: 'guest', customerName: 'Saad Mirza', phone: '0312-4445566', date: tomorrow, time: '20:00', partySize: 6, tableId: 'T6', status: 'Accepted', createdAt: Date.now() - 7200000 },
  { id: 'r-seed-T7-2000', userId: 'guest', customerName: 'Ayesha Siddiqui', phone: '0345-1112233', date: tomorrow, time: '20:00', partySize: 8, tableId: 'T7', status: 'Accepted', createdAt: Date.now() - 7200000 },
  { id: 'r-seed-T8-2000', userId: 'guest', customerName: 'Corporate dinner', phone: '0301-9998877', date: tomorrow, time: '20:00', partySize: 12, tableId: 'T8', status: 'Accepted', createdAt: Date.now() - 7200000 },
  { id: 'r-seed-T3-1300', userId: 'guest', customerName: 'Bilal Chaudhry', phone: '0333-7778899', date: inTwoDays, time: '13:00', partySize: 4, tableId: 'T3', status: 'Pending', createdAt: Date.now() - 3600000 },
  { id: 'r-seed-u1-2100', userId: 'u1', customerName: 'Ayesha Khan', phone: '0300-1234567', date: inTwoDays, time: '21:00', partySize: 2, tableId: 'T1', status: 'Pending', createdAt: Date.now() - 1800000 },
];
