import { useEffect, useState } from 'react';

// Returns `value` only after it has stopped changing for `delay` ms.
export default function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // A new keystroke (or unmount) cancels the pending update.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
