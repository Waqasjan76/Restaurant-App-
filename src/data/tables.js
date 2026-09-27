// The restaurant floor plan.
export const mockTables = [
  { id: 'T1', name: 'Table 1', seats: 2, area: 'Window' },
  { id: 'T2', name: 'Table 2', seats: 2, area: 'Window' },
  { id: 'T3', name: 'Table 3', seats: 4, area: 'Main hall' },
  { id: 'T4', name: 'Table 4', seats: 4, area: 'Main hall' },
  { id: 'T5', name: 'Table 5', seats: 4, area: 'Terrace' },
  { id: 'T6', name: 'Table 6', seats: 6, area: 'Terrace' },
  { id: 'T7', name: 'Table 7', seats: 8, area: 'Family area' },
  { id: 'T8', name: 'Table 8', seats: 12, area: 'Private room' },
];

// Hourly slots from 12:00 to 22:00.
export const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => `${String(12 + i).padStart(2, '0')}:00`);

export const MIN_PARTY_SIZE = 1;
export const MAX_PARTY_SIZE = 12;
