import { createSeedData } from '../data/seed-data.js';
import { notify } from './reducer-utils.js';
import { inventorySupplyReducer } from './reducers/inventory-supply.js';
import { procurementReducer } from './reducers/procurement.js';
import { schoolReducer } from './reducers/school.js';
import { transportationReducer } from './reducers/transportation.js';

export function appReducer(state, action) {
  const payload = action.payload ?? {};

  switch (action.type) {
    case 'SET_ACTOR':
      return { ...state, currentActorId: payload.actorId };
    case 'SET_SUPPLIER':
      return { ...state, currentSupplierId: payload.supplierId };
    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== payload.id,
        ),
      };
    case 'STORAGE_ERROR':
      return notify(state, 'error', payload.message);
    case 'RESET_DEMO': {
      const fresh = createSeedData();
      return {
        ...fresh,
        currentActorId: state.currentActorId,
        currentSupplierId: fresh.currentSupplierId,
      };
    }

    default: {
      const schoolState = schoolReducer(state, action);
      if (schoolState !== undefined) return schoolState;

      const inventoryState = inventorySupplyReducer(state, action);
      if (inventoryState !== undefined) return inventoryState;

      const procurementState = procurementReducer(state, action);
      if (procurementState !== undefined) return procurementState;

      const transportationState = transportationReducer(state, action);
      if (transportationState !== undefined) return transportationState;

      return state;
    }
  }
}
