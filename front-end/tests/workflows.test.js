import { describe, expect, it } from 'vitest';

import { appReducer } from '../js/state/reducer.js';
import { createSeedData } from '../js/data/seed-data.js';

describe('shared school-management workflows', () => {
  it('starts with a populated, linked demonstration dataset', () => {
    const state = createSeedData();

    expect(state.students).toHaveLength(12);
    expect(state.classes).toHaveLength(3);
    expect(state.items).toHaveLength(8);
    expect(state.supplyRequests).toHaveLength(2);
    expect(state.consultations[0].status).toBe('open');
    expect(state.routes.find((route) => route.driverId === 'driver').status).toBe(
      'approved',
    );
  });

  it('fulfills a supply request and decreases stock as one operation', () => {
    const state = createSeedData();
    const before = state.items.find((item) => item.id === 'item-7').quantity;

    const next = appReducer(state, {
      type: 'FULFILL_SUPPLY_REQUEST',
      payload: {
        requestId: 'sreq-1',
        issuedAt: '2026-11-26',
        movementBase: { id: 'movement-test', reference: 'MV-TEST' },
      },
    });

    expect(next.supplyRequests[0].status).toBe('fulfilled');
    expect(next.items.find((item) => item.id === 'item-7').quantity).toBe(
      before - 6,
    );
    expect(next.movements.filter((movement) => movement.relatedRequestId === 'sreq-1')).toHaveLength(2);
  });

  it('does not partially fulfill when any requested item is unavailable', () => {
    const state = createSeedData();
    state.items.find((item) => item.id === 'item-1').quantity = 1;
    const beforeMovements = state.movements.length;
    const beforeGoggles = state.items.find((item) => item.id === 'item-7').quantity;

    const next = appReducer(state, {
      type: 'FULFILL_SUPPLY_REQUEST',
      payload: {
        requestId: 'sreq-1',
        issuedAt: '2026-11-26',
        movementBase: { id: 'movement-test', reference: 'MV-TEST' },
      },
    });

    expect(next.supplyRequests[0].status).toBe('pending');
    expect(next.items.find((item) => item.id === 'item-7').quantity).toBe(
      beforeGoggles,
    );
    expect(next.movements).toHaveLength(beforeMovements);
    expect(next.notifications[0].type).toBe('error');
  });

  it('updates order status and stock when ordered goods are received', () => {
    const state = createSeedData();

    const next = appReducer(state, {
      type: 'RECEIVE_ORDER',
      payload: {
        orderId: 'po-1',
        date: '2026-11-26',
        movementBase: { id: 'movement-test', reference: 'MV-TEST' },
        items: [{ itemId: 'item-1', quantity: 40 }],
      },
    });

    expect(next.purchaseOrders[0].status).toBe('partially_received');
    expect(next.items.find((item) => item.id === 'item-1').quantity).toBe(52);
    expect(next.movements.at(-1).type).toBe('delivery');
  });

  it('completes procurement from purchase approval through order delivery', () => {
    let state = createSeedData();
    state = appReducer(state, {
      type: 'DECIDE_PURCHASE_REQUEST',
      payload: { requestId: 'pr-1', status: 'approved', decidedAt: '2026-11-25' },
    });
    state = appReducer(state, {
      type: 'CREATE_CONSULTATION',
      payload: {
        id: 'consultation-test',
        reference: 'SC-TEST',
        purchaseRequestId: 'pr-1',
        supplierIds: ['supplier-2'],
        createdAt: '2026-11-25',
        deadline: '2026-12-20',
      },
    });
    state = appReducer(state, {
      type: 'AUTHORIZE_CONSULTATION',
      payload: { consultationId: 'consultation-test' },
    });
    state = appReducer(state, {
      type: 'SUBMIT_OFFER',
      payload: {
        id: 'offer-test',
        reference: 'OF-TEST',
        consultationId: 'consultation-test',
        supplierId: 'supplier-2',
        items: [{ itemId: 'item-4', quantity: 30, unitPrice: 700 }],
        deliveryDays: 5,
        submittedAt: '2026-11-26',
        validityDate: '2026-12-30',
      },
    });
    state = appReducer(state, {
      type: 'SELECT_OFFER',
      payload: { offerId: 'offer-test' },
    });
    state = appReducer(state, {
      type: 'CREATE_PURCHASE_ORDER',
      payload: {
        id: 'order-test',
        reference: 'PO-TEST',
        offerId: 'offer-test',
        expectedDeliveryDate: '2026-12-05',
        createdAt: '2026-11-26',
      },
    });

    const stockBeforeReceipt = state.items.find((item) => item.id === 'item-4').quantity;
    state = appReducer(state, {
      type: 'RECEIVE_ORDER',
      payload: {
        orderId: 'order-test',
        date: '2026-12-05',
        movementBase: { id: 'movement-procurement', reference: 'MV-PROCUREMENT' },
        items: [{ itemId: 'item-4', quantity: 30 }],
      },
    });

    expect(state.purchaseOrders[0].status).toBe('received');
    expect(state.items.find((item) => item.id === 'item-4').quantity).toBe(stockBeforeReceipt + 30);
    expect(state.offers.find((offer) => offer.id === 'offer-test').status).toBe('selected');
  });

  it('creates an approved route journey and records a driver report', () => {
    let state = { ...createSeedData(), currentActorId: 'driver' };
    const newRoute = {
      id: 'route-test',
      reference: 'RT-TEST',
      name: 'South Loop',
      vehicleId: 'vehicle-2',
      driverId: 'driver',
      stops: [{ name: 'South Gate', time: '07:30' }],
      scheduledDeparture: '07:15',
      scheduledArrival: '08:00',
      studentIds: ['ST-26009'],
    };
    state = appReducer(state, { type: 'CREATE_ROUTE', payload: newRoute });
    state = appReducer(state, {
      type: 'APPROVE_ROUTE',
      payload: { routeId: newRoute.id, journeyId: 'journey-test', date: '2026-11-27' },
    });
    state = appReducer(state, {
      type: 'START_JOURNEY',
      payload: { journeyId: 'journey-test', actualDeparture: '07:16' },
    });
    state = appReducer(state, {
      type: 'FINISH_JOURNEY',
      payload: { journeyId: 'journey-test', actualArrival: '07:58' },
    });
    state = appReducer(state, {
      type: 'REPORT_DRIVER_ISSUE',
      payload: {
        id: 'report-test',
        reference: 'DR-TEST',
        type: 'incident',
        driverId: 'driver',
        vehicleId: 'vehicle-2',
        journeyId: 'journey-test',
        date: '2026-11-27',
        description: 'Minor road obstruction reported.',
      },
    });

    expect(state.journeys.find((item) => item.id === 'journey-test').status).toBe('completed');
    expect(state.driverReports[0].status).toBe('open');
  });

  it('rejects journey completion before start', () => {
    const state = createSeedData();
    const next = appReducer(state, {
      type: 'FINISH_JOURNEY',
      payload: { journeyId: 'journey-1', actualArrival: '08:00' },
    });

    expect(next.journeys[0].status).toBe('scheduled');
    expect(next.notifications[0].type).toBe('error');
  });
});
