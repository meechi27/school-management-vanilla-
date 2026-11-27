import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

import { appReducer } from '../state/reducer.js';
import { loadState, saveState } from '../state/storage.js';

const AppContext = createContext(null);

function initializeState() {
  return loadState();
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, undefined, initializeState);
  const lastStorageError = useRef('');

  useEffect(() => {
    const error = saveState(state);
    if (error && error.message !== lastStorageError.current) {
      lastStorageError.current = error.message;
      dispatch({ type: 'STORAGE_ERROR', payload: { message: error.message } });
    }
    if (!error) lastStorageError.current = '';
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider.');
  return value;
}
