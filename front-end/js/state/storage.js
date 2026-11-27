import { createSeedData } from '../data/seed-data.js';

export const STORAGE_KEY = 'school-management-demo-v1';

const requiredCollections = [
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
  'notifications',
];

export function loadState(storage = window.localStorage) {
  try {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) return createSeedData();
    const parsed = JSON.parse(stored);
    const isValid =
      parsed?.version === 1 &&
      requiredCollections.every((key) => Array.isArray(parsed[key]));
    if (!isValid) throw new Error('Saved demo data has an unsupported structure.');
    return parsed;
  } catch (error) {
    const state = createSeedData();
    return {
      ...state,
      notifications: [{
        id: `storage-${Date.now()}`,
        type: 'error',
        message: `Saved demo data could not be loaded: ${error.message}. Fresh demo data was restored.`,
      }],
    };
  }
}

export function saveState(state, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return null;
  } catch (error) {
    return new Error(`Demo data could not be saved in this browser: ${error.message}`);
  }
}
