const pad = (n) => String(n).padStart(2, '0');

// Local calendar date as YYYY-MM-DD (not UTC, so "today" is the user's today).
export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const addDays = (d, days) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
};

export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function parseISODate(str) {
  if (!ISO_DATE_REGEX.test(str)) return null;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // Rejects impossible dates such as 2026-02-31.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

// "2026-10-02" + "19:00" -> Date
export function combineDateTime(dateStr, time) {
  const date = parseISODate(dateStr);
  if (!date || !time) return null;
  const [h, min] = time.split(':').map(Number);
  date.setHours(h, min, 0, 0);
  return date;
}

export function formatDateLabel(dateStr) {
  const date = parseISODate(dateStr);
  if (!date) return dateStr;
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatTime(ts, withSeconds = false) {
  return new Date(ts).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds && { second: '2-digit' }),
  });
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${pad(m)}:${pad(s)}`;
}
