import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { routeDefinitions } from '../js/app/routes.jsx';
import { FormDialog } from '../js/components/ui.jsx';
import { AppProvider } from '../js/context/AppContext.jsx';
import { createSeedData } from '../js/data/seed-data.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root;
let container;

function openRoute(path, actorId, configure = () => {}) {
  const state = createSeedData();
  configure(state);
  document.body.innerHTML = '<div id="app"></div>';
  container = document.querySelector('#app');
  root = createRoot(container);
  act(() => {
    root.render(createElement(AppProvider, {
      initialActorId: actorId,
      initialSchoolData: state,
    }, createElement(
      MemoryRouter,
      { initialEntries: [path] },
      createElement(Routes, null, ...routeDefinitions.map(({ path: routePath, element }) =>
        createElement(Route, { element, key: routePath, path: routePath }),
      )),
    )));
  });
  return container;
}

afterEach(() => {
  if (root) act(() => root.unmount());
  root = null;
  vi.restoreAllMocks();
});

describe('MVP screens', () => {
  const screens = [
    ['/principal/dashboard', 'principal', 'Dashboard'],
    ['/inventory/dashboard', 'inventory_manager', 'Dashboard'],
    ['/teacher/dashboard', 'teacher', 'Dashboard'],
    ['/supplier/dashboard', 'supplier', 'Dashboard'],
    ['/driver/dashboard', 'driver', 'Dashboard'],
    ['/principal/school', 'principal', 'School Records'],
    ['/inventory/stock', 'inventory_manager', 'Inventory & Stock'],
    ['/teacher/requests', 'teacher', 'Supply Requests'],
    ['/inventory/procurement', 'inventory_manager', 'Procurement Management'],
    ['/principal/procurement', 'principal', 'Procurement Approval'],
    ['/supplier/quotations', 'supplier', 'Supplier Quotations'],
    ['/principal/transportation', 'principal', 'Transportation Management'],
    ['/driver/route', 'driver', 'My Route'],
  ];

  it.each(screens)('renders %s for the assigned actor', (path, actorId, title) => {
    const app = openRoute(path, actorId);
    expect(app.querySelector('.page-heading h1').textContent).toBe(title);
    expect(app.querySelector('main')).not.toBeNull();
  });

  it('switches screen tabs without losing the route', () => {
    const app = openRoute('/inventory/stock', 'inventory_manager');
    act(() => app.querySelector('[role="tab"][aria-selected="false"]').click());
    expect(app.querySelector('[aria-selected="true"]').textContent).toBe('Stock Movements');
    expect(app.querySelector('table')).not.toBeNull();
  });

  it('initializes multi-select fields without a React value warning', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    document.body.innerHTML = '<div id="app"></div>';
    container = document.querySelector('#app');
    root = createRoot(container);

    act(() => root.render(createElement(FormDialog, {
      fields: [{ name: 'supplierIds', label: 'Suppliers', type: 'multi-select', options: [{ value: 'supplier-1', label: 'Atlas School Supplies' }] }],
      onClose: () => {},
      onSubmit: () => {},
      title: 'Create Consultation',
    })));

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('opens a reason form when the principal rejects a purchase request', () => {
    const app = openRoute('/principal/procurement', 'principal');
    const rejectButton = [...app.querySelectorAll('button')].find((button) => button.textContent === 'Reject');

    act(() => rejectButton.click());

    expect(app.querySelector('[role="dialog"] h2').textContent).toMatch(/^Reject /);
    expect(app.querySelector('[role="dialog"] textarea')).not.toBeNull();
  });

  it('keeps route action clicks from opening row details', () => {
    const app = openRoute('/principal/transportation', 'principal');
    act(() => [...app.querySelectorAll('[role="tab"]')].find((tab) => tab.textContent === 'Routes').click());
    const draftRoute = [...app.querySelectorAll('tbody tr')].find((row) => row.textContent.includes('RT-2026-002'));

    act(() => draftRoute.querySelector('button').click());

    expect(app.querySelector('.overlay--drawer')).toBeNull();
    expect(app.querySelector('[role="dialog"] h2').textContent).toBe('Confirm action');
  });

  it('does not change sample journey data when the mock API cannot process actions', async () => {
    const app = openRoute('/driver/route', 'driver', (state) => {
      state.routes[0].driverId = null;
      state.routes.push({
        id: 'route-3', reference: 'RT-2026-003', name: 'Demo Route',
        vehicleId: 'vehicle-2', driverId: 'driver', stops: [],
        scheduledDeparture: '07:15', scheduledArrival: '08:00',
        studentIds: [], status: 'approved',
      });
      state.journeys.push({
        id: 'journey-2', routeId: 'route-3', vehicleId: 'vehicle-2',
        driverId: 'driver', date: '2026-11-26', scheduledDeparture: '07:15',
        scheduledArrival: '08:00', actualDeparture: null, actualArrival: null,
        status: 'scheduled',
      });
    });

    act(() => app.querySelector('.journey-controls button').click());
    await act(async () => {
      app.querySelector('[role="dialog"] button.button--primary').click();
      await Promise.resolve();
    });

    expect(app.querySelector('.journey-controls').textContent).toContain('Start Journey');
    expect(app.querySelector('[role="alert"]').textContent).toContain(
      'Mock mode does not apply business actions.',
    );
  });

  it('renders duplicate journey summaries without React key warnings', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    openRoute('/driver/dashboard', 'driver', (state) => {
      state.journeys.push({ ...state.journeys[0], id: 'journey-2' });
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
