import { useEffect, useReducer, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HYDRATE = '@@persist/HYDRATE';

/**
 * useReducer whose state is saved to AsyncStorage under `storageKey`.
 * Returns [state, dispatch, isHydrated]. Until isHydrated is true the state
 * is the initial value, so callers show a loading screen instead of flashing
 * empty or seed data.
 */
export default function usePersistedReducer(storageKey, reducer, initialState) {
  const [state, dispatch] = useReducer(
    (current, action) => (action.type === HYDRATE ? action.payload : reducer(current, action)),
    initialState
  );
  const [isHydrated, setIsHydrated] = useState(false);

  // Load once when the app starts.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!cancelled && raw != null) dispatch({ type: HYDRATE, payload: JSON.parse(raw) });
      })
      .catch((e) => console.warn(`Could not load "${storageKey}" from storage`, e))
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  // Save after every change, but never before loading finished (that would
  // overwrite the stored data with the initial value).
  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(state)).catch((e) =>
      console.warn(`Could not save "${storageKey}"`, e)
    );
  }, [storageKey, state, isHydrated]);

  return [state, dispatch, isHydrated];
}

// Same idea for a plain value: setValue(next) or setValue(prev => next).
const replaceReducer = (state, next) => (typeof next === 'function' ? next(state) : next);

export function usePersistedState(storageKey, initialValue) {
  return usePersistedReducer(storageKey, replaceReducer, initialValue);
}
