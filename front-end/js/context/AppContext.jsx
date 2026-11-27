import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getCurrentUser,
  getSchoolData,
  logIn as logInApi,
  logOut as logOutApi,
  sendAction as sendApiAction,
} from '../api/index.js';

const AppContext = createContext(null);

const schoolDataLists = [
  'actors',
  'suppliers',
  'classes',
  'students',
  'items',
  'supplyRequests',
  'movements',
  'purchaseRequests',
  'consultations',
  'offers',
  'purchaseOrders',
  'vehicles',
  'transportRequests',
  'routes',
  'journeys',
  'driverReports',
];

function getSchoolDataFromResponse(response) {
  const data = response?.data;
  const hasAllLists = schoolDataLists.every((listName) =>
    Array.isArray(data?.[listName]),
  );

  if (!hasAllLists) {
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
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(!initialSchoolData);
  const [loadError, setLoadError] = useState('');

  const addNotification = useCallback((type, message) => {
    setNotifications((currentNotifications) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        type,
        message,
      },
      ...currentNotifications,
    ].slice(0, 5));
  }, []);

  const refreshSchoolData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await getSchoolData();
      const data = getSchoolDataFromResponse(response);
      setSchoolData(data);
      setCurrentSupplierId((selectedSupplierId) =>
        data.suppliers.some((supplier) => supplier.id === selectedSupplierId)
          ? selectedSupplierId
          : data.suppliers[0]?.id ?? null,
      );
      return true;
    } catch (error) {
      setLoadError(getErrorMessage(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkSession = useCallback(async () => {
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
  }, [refreshSchoolData]);

  useEffect(() => {
    if (!initialSchoolData) checkSession();
  }, [checkSession, initialSchoolData]);

  const logIn = useCallback(async (credentials) => {
    const response = await logInApi(credentials);
    setUser(response.user);
    await refreshSchoolData();
    return response.user;
  }, [refreshSchoolData]);

  const logOut = useCallback(async () => {
    try {
      await logOutApi();
      setUser(null);
      setSchoolData(null);
      setLoadError('');
      return true;
    } catch (error) {
      addNotification('error', getErrorMessage(error));
      return false;
    }
  }, [addNotification]);

  const sendAction = useCallback(async (action) => {
    try {
      const response = await sendApiAction(action);
      if (response.data) {
        setSchoolData(getSchoolDataFromResponse(response));
      }
      if (response.message) {
        addNotification('success', response.message);
      }
      return true;
    } catch (error) {
      addNotification('error', getErrorMessage(error));
      return false;
    }
  }, [addNotification]);

  const dismissNotification = useCallback((notificationId) => {
    setNotifications((currentNotifications) =>
      currentNotifications.filter(
        (notification) => notification.id !== notificationId,
      ),
    );
  }, []);

  const state = schoolData && {
    ...schoolData,
    currentActorId: user?.actorId ?? null,
    currentSupplierId,
    notifications,
  };

  const value = {
    state,
    user,
    isLoading,
    loadError,
    checkSession,
    refreshSchoolData,
    setCurrentSupplierId,
    logIn,
    logOut,
    sendAction,
    dismissNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used inside AppProvider.');
  }
  return value;
}
