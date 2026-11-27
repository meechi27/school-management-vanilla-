import { createMovement, failure, findItem, success, validPositive } from '../reducer-utils.js';

export function inventorySupplyReducer(state, action) {
  const payload = action.payload ?? {};

  switch (action.type) {
    case 'ADD_ITEM': {
      if (!payload.code?.trim() || !payload.name?.trim()) {
        return failure(state, 'Item code and name are required.');
      }
      if (state.items.some((item) => item.code.toLowerCase() === payload.code.toLowerCase())) {
        return failure(state, 'That item code is already in use.');
      }
      if (Number(payload.quantity) < 0 || Number(payload.minimumStock) < 0 || Number(payload.purchasePrice) < 0) {
        return failure(state, 'Stock and price values cannot be negative.');
      }
      return success({
        ...state,
        items: [...state.items, {
          ...payload,
          quantity: Number(payload.quantity),
          minimumStock: Number(payload.minimumStock),
          purchasePrice: Number(payload.purchasePrice),
        }],
      }, 'Inventory item added.');
    }
    case 'UPDATE_ITEM': {
      if (!payload.code?.trim() || !payload.name?.trim()) return failure(state, 'Item code and name are required.');
      if (state.items.some((item) => item.id !== payload.id && item.code.toLowerCase() === payload.code.toLowerCase())) {
        return failure(state, 'That item code is already in use.');
      }
      if (Number(payload.quantity) < 0 || Number(payload.minimumStock) < 0 || Number(payload.purchasePrice) < 0) {
        return failure(state, 'Stock and price values cannot be negative.');
      }
      return success({
        ...state,
        items: state.items.map((item) =>
          item.id === payload.id
            ? { ...item, ...payload, quantity: Number(payload.quantity), minimumStock: Number(payload.minimumStock), purchasePrice: Number(payload.purchasePrice) }
            : item,
        ),
      }, 'Inventory item updated.');
    }
    case 'RECORD_STOCK_MOVEMENT': {
      const item = findItem(state, payload.itemId);
      if (!item || !validPositive(payload.quantity)) {
        return failure(state, 'Select an item and enter a quantity greater than zero.');
      }
      if (['issue', 'transfer'].includes(payload.type) && item.quantity < Number(payload.quantity)) {
        return failure(state, `${item.name} has only ${item.quantity} ${item.unit} available.`);
      }
      const quantityDelta = payload.type === 'issue' ? -Number(payload.quantity)
        : ['delivery', 'return'].includes(payload.type) ? Number(payload.quantity) : 0;
      const movement = createMovement(state, payload);
      return success({
        ...state,
        items: state.items.map((record) =>
          record.id === item.id ? { ...record, quantity: record.quantity + quantityDelta } : record,
        ),
        movements: [...state.movements, movement],
      }, 'Stock movement recorded.');
    }
    case 'CREATE_SUPPLY_REQUEST': {
      if (!payload.items?.length || !payload.reason?.trim()) {
        return failure(state, 'Add at least one item and a justification.');
      }
      if (payload.items.some((line) => !validPositive(line.quantity) || !findItem(state, line.itemId))) {
        return failure(state, 'Every requested item must exist and have a positive quantity.');
      }
      return success({
        ...state,
        supplyRequests: [{ ...payload, status: 'pending', issuedAt: null }, ...state.supplyRequests],
      }, `Supply request ${payload.reference} submitted.`);
    }
    case 'FULFILL_SUPPLY_REQUEST': {
      const request = state.supplyRequests.find((record) => record.id === payload.requestId);
      if (!request || request.status !== 'pending') {
        return failure(state, 'This supply request is no longer pending.');
      }
      const requestedByItem = request.items.reduce((totals, line) => {
        totals.set(line.itemId, (totals.get(line.itemId) ?? 0) + Number(line.quantity));
        return totals;
      }, new Map());
      const unavailable = [...requestedByItem].find(([itemId, quantity]) => {
        const item = findItem(state, itemId);
        return !item || item.quantity < quantity;
      });
      if (unavailable) {
        const item = findItem(state, unavailable[0]);
        return failure(state, `Insufficient stock for ${item?.name ?? 'a requested item'}. No stock was changed.`);
      }
      const movements = request.items.map((line, index) => {
        const item = findItem(state, line.itemId);
        return createMovement(state, {
          ...payload.movementBase,
          id: `${payload.movementBase.id}-${index}`,
          reference: `${payload.movementBase.reference}-${index + 1}`,
          itemId: line.itemId,
          type: 'issue',
          quantity: line.quantity,
          date: payload.issuedAt,
          recipient: request.department,
          relatedRequestId: request.id,
        });
      });
      return success({
        ...state,
        items: state.items.map((item) => {
          const quantity = requestedByItem.get(item.id);
          return quantity ? { ...item, quantity: item.quantity - quantity } : item;
        }),
        movements: [...state.movements, ...movements],
        supplyRequests: state.supplyRequests.map((record) =>
          record.id === request.id
            ? { ...record, status: 'fulfilled', issuedAt: payload.issuedAt }
            : record,
        ),
      }, `Materials issued for ${request.reference}.`);
    }
    default:
      return undefined;
  }
}
