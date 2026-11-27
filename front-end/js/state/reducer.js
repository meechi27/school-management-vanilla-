import { createSeedData } from '../data/seed-data.js';

const notify = (state, type, message) => ({
  ...state,
  notifications: [
    { id: `${Date.now()}-${Math.random()}`, type, message },
    ...state.notifications,
  ].slice(0, 5),
});

const failure = (state, message) => notify(state, 'error', message);
const success = (state, message) => notify(state, 'success', message);
const validPositive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
const findItem = (state, itemId) => state.items.find((item) => item.id === itemId);

function createMovement(state, { itemId, type, quantity, date, ...details }) {
  return {
    id: details.id,
    reference: details.reference,
    itemId,
    type,
    quantity: Number(quantity),
    date,
    ...details,
  };
}

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
    case 'ADD_STUDENT': {
      if (!payload.id || !payload.firstName?.trim() || !payload.lastName?.trim()) {
        return failure(state, 'Student ID, first name, and last name are required.');
      }
      if (state.students.some((student) => student.id === payload.id)) {
        return failure(state, 'That student ID is already registered.');
      }
      return success({ ...state, students: [...state.students, payload] }, 'Student registered.');
    }
    case 'UPDATE_STUDENT': {
      if (!payload.id || !payload.firstName?.trim() || !payload.lastName?.trim() || !state.classes.some((item) => item.id === payload.classId)) {
        return failure(state, 'Student identity and a valid class are required.');
      }
      if (state.students.some((student) => student.id === payload.id && student.id !== payload.originalId)) {
        return failure(state, 'That student ID is already registered.');
      }
      return success({
        ...state,
        students: state.students.map((student) =>
          student.id === payload.originalId ? payload : student,
        ),
        routes: state.routes.map((route) => ({
          ...route,
          studentIds: route.studentIds.map((id) =>
            id === payload.originalId ? payload.id : id,
          ),
        })),
      }, 'Student details updated.');
    }
    case 'CHANGE_STUDENT_CLASS':
      if (!state.students.some((student) => student.id === payload.studentId) || !state.classes.some((item) => item.id === payload.classId)) {
        return failure(state, 'Select an existing student and class.');
      }
      return success({
        ...state,
        students: state.students.map((student) =>
          student.id === payload.studentId
            ? { ...student, classId: payload.classId }
            : student,
        ),
      }, 'Student class changed.');
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
    case 'ADD_VEHICLE':
      if (!payload.registration?.trim() || Number(payload.capacity) <= 0) return failure(state, 'Enter a registration and passenger capacity.');
      if (state.vehicles.some((vehicle) => vehicle.registration.toLowerCase() === payload.registration.toLowerCase())) return failure(state, 'That vehicle registration is already in use.');
      return success({ ...state, vehicles: [...state.vehicles, payload] }, 'Vehicle added.');
    case 'UPDATE_VEHICLE':
      return success({ ...state, vehicles: state.vehicles.map((vehicle) => vehicle.id === payload.id ? { ...vehicle, ...payload } : vehicle) }, 'Vehicle updated.');
    case 'CREATE_ROUTE': {
      const vehicle = state.vehicles.find((record) => record.id === payload.vehicleId);
      if (!vehicle || !payload.name?.trim()) return failure(state, 'Select a vehicle and enter a route name.');
      if (payload.studentIds.length > vehicle.capacity) return failure(state, `This route exceeds vehicle capacity (${vehicle.capacity}).`);
      return success({ ...state, routes: [{ ...payload, status: 'draft' }, ...state.routes] }, 'Route created as a draft.');
    }
    case 'UPDATE_ROUTE': {
      const vehicle = state.vehicles.find((record) => record.id === payload.vehicleId);
      if (vehicle && payload.studentIds.length > vehicle.capacity) return failure(state, `This route exceeds vehicle capacity (${vehicle.capacity}).`);
      return success({ ...state, routes: state.routes.map((route) => route.id === payload.id ? { ...route, ...payload } : route) }, 'Route updated.');
    }
    case 'APPROVE_ROUTE': {
      const route = state.routes.find((record) => record.id === payload.routeId);
      if (!route) return failure(state, 'The route could not be found.');
      const journeys = state.journeys.some((journey) => journey.routeId === route.id)
        ? state.journeys
        : [...state.journeys, {
          id: payload.journeyId,
          routeId: route.id,
          vehicleId: route.vehicleId,
          driverId: route.driverId,
          date: payload.date,
          scheduledDeparture: route.scheduledDeparture,
          scheduledArrival: route.scheduledArrival,
          actualDeparture: null,
          actualArrival: null,
          status: 'scheduled',
        }];
      return success({
        ...state,
        routes: state.routes.map((record) => record.id === route.id ? { ...record, status: 'approved' } : record),
        journeys,
      }, 'Route approved and assigned.');
    }
    case 'DECIDE_TRANSPORT_REQUEST':
      if (!state.transportRequests.some((request) => request.id === payload.requestId && request.status === 'pending') || !['approved', 'rejected'].includes(payload.status)) {
        return failure(state, 'This transportation request has already been decided or is invalid.');
      }
      return success({ ...state, transportRequests: state.transportRequests.map((request) => request.id === payload.requestId ? { ...request, status: payload.status } : request) }, `Transport request ${payload.status}.`);
    case 'START_JOURNEY': {
      const journey = state.journeys.find((record) => record.id === payload.journeyId);
      if (!journey || journey.status !== 'scheduled' || journey.driverId !== state.currentActorId) return failure(state, 'Only your scheduled journey can be started.');
      const route = state.routes.find((record) => record.id === journey.routeId && record.status === 'approved' && record.driverId === state.currentActorId);
      if (!route) return failure(state, 'You are not assigned to this approved route.');
      return success({ ...state, journeys: state.journeys.map((record) => record.id === journey.id ? { ...record, status: 'in_progress', actualDeparture: payload.actualDeparture } : record) }, 'Journey started.');
    }
    case 'FINISH_JOURNEY': {
      const journey = state.journeys.find((record) => record.id === payload.journeyId);
      if (!journey || journey.status !== 'in_progress' || journey.driverId !== state.currentActorId) return failure(state, 'Only your in-progress journey can be finished.');
      return success({ ...state, journeys: state.journeys.map((record) => record.id === journey.id ? { ...record, status: 'completed', actualArrival: payload.actualArrival } : record) }, 'Journey completed.');
    }
    case 'REPORT_DRIVER_ISSUE':
      if (!payload.description?.trim()) return failure(state, 'Add a description before submitting the report.');
      if (payload.driverId !== state.currentActorId || !state.routes.some((route) => route.driverId === payload.driverId && route.vehicleId === payload.vehicleId && route.status === 'approved')) return failure(state, 'You can only report an issue for your assigned approved route.');
      return success({ ...state, driverReports: [{ ...payload, status: 'open', administrativeNote: '' }, ...state.driverReports] }, `${payload.type === 'incident' ? 'Incident' : 'Maintenance'} report submitted.`);
    case 'UPDATE_DRIVER_REPORT':
      return success({ ...state, driverReports: state.driverReports.map((report) => report.id === payload.reportId ? { ...report, status: payload.status, administrativeNote: payload.administrativeNote ?? report.administrativeNote } : report) }, 'Driver report updated.');
    default:
      return state;
  }
}
