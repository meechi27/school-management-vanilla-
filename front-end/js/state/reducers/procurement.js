import { createMovement, failure, findItem, success, validPositive } from '../reducer-utils.js';

export function procurementReducer(state, action) {
  const payload = action.payload ?? {};

  switch (action.type) {
    case 'CREATE_PURCHASE_REQUEST': {
      if (!payload.items?.length || !payload.justification?.trim()) {
        return failure(state, 'Add requested items and a justification.');
      }
      const total = payload.items.reduce(
        (sum, line) => sum + Number(line.quantity) * Number(line.estimatedUnitPrice),
        0,
      );
      if (payload.items.some((line) => !validPositive(line.quantity) || !Number.isFinite(Number(line.estimatedUnitPrice)) || Number(line.estimatedUnitPrice) < 0)) {
        return failure(state, 'Purchase quantities must be positive and prices must be valid.');
      }
      if (payload.items.some((line) => !findItem(state, line.itemId))) return failure(state, 'A requested inventory item could not be found.');
      return success({
        ...state,
        purchaseRequests: [{
          ...payload,
          estimatedTotal: total,
          status: 'pending_approval',
          decisionNote: '',
          decidedAt: null,
        }, ...state.purchaseRequests],
      }, `Purchase request ${payload.reference} submitted for approval.`);
    }
    case 'DECIDE_PURCHASE_REQUEST': {
      const request = state.purchaseRequests.find((record) => record.id === payload.requestId);
      if (!request || request.status !== 'pending_approval') {
        return failure(state, 'This purchase request has already been decided.');
      }
      if (payload.status === 'rejected' && !payload.decisionNote?.trim()) {
        return failure(state, 'Add a reason before rejecting this request.');
      }
      return success({
        ...state,
        purchaseRequests: state.purchaseRequests.map((record) =>
          record.id === request.id
            ? { ...record, status: payload.status, decisionNote: payload.decisionNote ?? '', decidedAt: payload.decidedAt }
            : record,
        ),
      }, `Purchase request ${payload.status}.`);
    }
    case 'CREATE_CONSULTATION': {
      const request = state.purchaseRequests.find((record) => record.id === payload.purchaseRequestId);
      if (!request || request.status !== 'approved') {
        return failure(state, 'Only approved purchase requests can be sent for consultation.');
      }
      if (!payload.supplierIds?.length) {
        return failure(state, 'Select at least one supplier.');
      }
      if (payload.supplierIds.some((supplierId) => !state.suppliers.some((supplier) => supplier.id === supplierId))) return failure(state, 'Select valid suppliers.');
      return success({
        ...state,
        consultations: [{ ...payload, status: 'pending_authorization' }, ...state.consultations],
      }, `Consultation ${payload.reference} created.`);
    }
    case 'AUTHORIZE_CONSULTATION': {
      const consultation = state.consultations.find((record) => record.id === payload.consultationId);
      if (!consultation || consultation.status !== 'pending_authorization') {
        return failure(state, 'This consultation cannot be authorized.');
      }
      return success({
        ...state,
        consultations: state.consultations.map((record) =>
          record.id === consultation.id ? { ...record, status: 'open' } : record,
        ),
      }, 'Supplier consultation authorized.');
    }
    case 'SUBMIT_OFFER': {
      const consultation = state.consultations.find((record) => record.id === payload.consultationId);
      if (!consultation || consultation.status !== 'open' || !consultation.supplierIds.includes(payload.supplierId)) {
        return failure(state, 'This consultation is not available to the selected supplier.');
      }
      if (new Date(consultation.deadline) < new Date(payload.submittedAt)) {
        return failure(state, 'The response deadline has passed.');
      }
      if (state.offers.some((offer) => offer.consultationId === consultation.id && offer.supplierId === payload.supplierId)) {
        return failure(state, 'An offer has already been submitted for this consultation.');
      }
      const requested = state.purchaseRequests.find((request) => request.id === consultation.purchaseRequestId)?.items ?? [];
      if (!payload.items?.length || payload.items.some((line) => !requested.some((item) => item.itemId === line.itemId) || !Number.isFinite(Number(line.unitPrice)) || Number(line.unitPrice) < 0)) {
        return failure(state, 'Enter a valid price for every requested item.');
      }
      if (requested.some((line) => !payload.items.some((offered) => offered.itemId === line.itemId))) return failure(state, 'An offer must include a price for every requested item.');
      return success({
        ...state,
        offers: [{ ...payload, totalAmount: payload.items.reduce((sum, line) => sum + Number(line.unitPrice) * Number(line.quantity), 0), status: 'submitted' }, ...state.offers],
      }, `Offer ${payload.reference} submitted.`);
    }
    case 'SELECT_OFFER': {
      const selected = state.offers.find((offer) => offer.id === payload.offerId);
      if (!selected) return failure(state, 'The selected offer could not be found.');
      return success({
        ...state,
        offers: state.offers.map((offer) =>
          offer.consultationId === selected.consultationId
            ? { ...offer, status: offer.id === selected.id ? 'selected' : 'not_selected' }
            : offer,
        ),
      }, 'Supplier offer selected.');
    }
    case 'CREATE_PURCHASE_ORDER': {
      const offer = state.offers.find((record) => record.id === payload.offerId && record.status === 'selected');
      if (!offer) return failure(state, 'A purchase order can only be created from a selected offer.');
      if (state.purchaseOrders.some((order) => order.offerId === offer.id)) return failure(state, 'A purchase order already exists for this offer.');
      const consultation = state.consultations.find((record) => record.id === offer.consultationId);
      const request = state.purchaseRequests.find((record) => record.id === consultation?.purchaseRequestId);
      if (!request) return failure(state, 'The purchase request for this offer was not found.');
      return success({
        ...state,
        purchaseOrders: [{
          ...payload,
          purchaseRequestId: request.id,
          supplierId: offer.supplierId,
          status: 'ordered',
          items: offer.items.map((line) => ({
            ...line,
            quantity: request.items.find((requested) => requested.itemId === line.itemId)?.quantity ?? line.quantity,
            receivedQuantity: 0,
          })),
        }, ...state.purchaseOrders],
      }, `Purchase order ${payload.reference} created.`);
    }
    case 'RECEIVE_ORDER': {
      const order = state.purchaseOrders.find((record) => record.id === payload.orderId);
      if (!order || order.status === 'received') return failure(state, 'This order is already fully received or unavailable.');
      if (!payload.items?.length || payload.items.some((line) => !Number.isFinite(Number(line.quantity)) || Number(line.quantity) < 0)) {
        return failure(state, 'Received quantities must be zero or greater.');
      }
      const receivedByItem = payload.items.reduce((totals, line) => {
        totals.set(line.itemId, (totals.get(line.itemId) ?? 0) + Number(line.quantity));
        return totals;
      }, new Map());
      const invalid = [...receivedByItem].find(([itemId, quantity]) => {
        const ordered = order.items.find((item) => item.itemId === itemId);
        return !ordered || quantity > ordered.quantity - ordered.receivedQuantity;
      });
      if (invalid) return failure(state, 'A received quantity exceeds the outstanding order quantity.');
      const movements = payload.items.filter((line) => Number(line.quantity) > 0).map((line, index) =>
        createMovement(state, {
          ...payload.movementBase,
          id: `${payload.movementBase.id}-${index}`,
          reference: `${payload.movementBase.reference}-${index + 1}`,
          itemId: line.itemId,
          type: 'delivery',
          quantity: line.quantity,
          date: payload.date,
          source: 'Purchase order delivery',
        }),
      );
      const nextOrders = order.items.map((line) => {
        const quantity = receivedByItem.get(line.itemId);
        return quantity ? { ...line, receivedQuantity: line.receivedQuantity + quantity } : line;
      });
      const fullyReceived = nextOrders.every((line) => line.receivedQuantity >= line.quantity);
      return success({
        ...state,
        items: state.items.map((item) => {
          const quantity = receivedByItem.get(item.id);
          return quantity ? { ...item, quantity: item.quantity + quantity } : item;
        }),
        movements: [...state.movements, ...movements],
        purchaseOrders: state.purchaseOrders.map((record) =>
          record.id === order.id ? { ...record, items: nextOrders, status: fullyReceived ? 'received' : 'partially_received' } : record,
        ),
      }, 'Delivery received and inventory updated.');
    }
    default:
      return undefined;
  }
}
