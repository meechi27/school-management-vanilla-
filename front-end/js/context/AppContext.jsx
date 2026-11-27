import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  getCurrentUser,
  getSchoolData,
  logIn as logInApi,
  logOut as logOutApi,
  sendAction as sendApiAction,
} from '../api.js';

const AppContext = createContext(null);

function extractSchoolData(response) {
  const data = response?.data;
  if (!data || !Array.isArray(data.actors) || !Array.isArray(data.suppliers)) {
    throw new Error('The API returned school data in an unexpected format.');
  }
  return data;
}

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : 'The API request could not be completed.';
}

export function AppProvider({
  children,
  initialUser = null,
  initialSchoolData = null,
}) {
  const [schoolData, setSchoolData] = useState(initialSchoolData);
  const [user, setUser] = useState(initialUser);
  const [currentSupplierId, setCurrentSupplierId] = useState(
    initialSchoolData?.suppliers?.[0]?.id ?? null,
  );
  const [isLoading, setIsLoading] = useState(!initialSchoolData);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  async function refreshSchoolData() {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await getSchoolData();
      const data = extractSchoolData(response);
      setSchoolData(data);
      setCurrentSupplierId((selected) =>
        data.suppliers.some((supplier) => supplier.id === selected)
          ? selected
          : data.suppliers[0]?.id ?? null,
      );
      return true;
    } catch (error) {
      setLoadError(getErrorMessage(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  async function checkSession() {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await getCurrentUser();
      setUser(response.user);

      if (response.user) {
        await refreshSchoolData();
      } else {
        setSchoolData(null);
      }
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!initialSchoolData) checkSession();
  }, []);

  async function logIn(credentials) {
    const response = await logInApi(credentials);
    setUser(response.user);
    setActionError('');
    await refreshSchoolData();
    return response.user;
  }

  async function logOut() {
    setActionError('');
    try {
      await logOutApi();
      setUser(null);
      setSchoolData(null);
      setLoadError('');
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      setActionError(message);
      toast.error(message);
      return false;
    }
  }

  async function sendAction(action) {
    setActionError('');
    try {
      const response = await sendApiAction(action);
      if (response.data) {
        setSchoolData(extractSchoolData(response));
      }
      if (response.message) {
        toast.success(response.message);
      }
      return true;
    } catch (error) {
      const message = getErrorMessage(error);
      setActionError(message);
      toast.error(message);
      return false;
    }
  }

  const state = schoolData && {
    ...schoolData,
    currentActorId: user?.actorId ?? null,
    currentSupplierId,
  };

  return (
    <AppContext.Provider
      value={{
        state,
        user,
        isLoading,
        loadError,
        actionError,
        clearActionError: () => setActionError(''),
        checkSession,
        refreshSchoolData,
        setCurrentSupplierId,
        logIn,
        logOut,
        sendAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used inside AppProvider.');
  }
  return value;
}
