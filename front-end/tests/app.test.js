import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { AppProvider } from '../js/context/AppContext.jsx';
import { routeDefinitions } from '../js/app/routes.jsx';
import { createSeedData } from '../js/data/seed-data.js';
import { STORAGE_KEY } from '../js/state/storage.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root;
let mount;

function renderAt(path, actorId = null) {
  document.body.innerHTML = '<div id="app"></div>';
  mount = document.querySelector('#app');
  if (actorId) {
    const state = createSeedData();
    state.currentActorId = actorId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  root = createRoot(mount);
  act(() => {
    root.render(
      createElement(
        AppProvider,
        null,
        createElement(
          MemoryRouter,
          { initialEntries: [path] },
          createElement(
            Routes,
            null,
            ...routeDefinitions.map(({ path: routePath, element }) =>
              createElement(Route, { element, key: routePath, path: routePath }),
            ),
          ),
        ),
      ),
    );
  });
  return mount;
}

afterEach(() => {
  if (root) act(() => root.unmount());
  root = null;
  localStorage.clear();
});

describe('React school-management application', () => {
  it('lets a user choose a role and opens that role dashboard', () => {
    const container = renderAt('/access');
    expect(container.querySelectorAll('.access-card')).toHaveLength(5);

    act(() => {
      container.querySelectorAll('.access-card button')[0].click();
    });

    expect(container.querySelector('.page-heading h1').textContent).toBe('Dashboard');
    expect(container.querySelector('.sidebar-profile strong').textContent).toBe('Amira Benali');
    expect(container.querySelector('nav a[aria-current="page"]').textContent).toContain('Dashboard');
  });

  it('redirects an actor away from another role’s screen', () => {
    const container = renderAt('/principal/school', 'teacher');

    expect(container.querySelector('.page-heading h1').textContent).toBe('Dashboard');
    expect(container.querySelector('.sidebar-profile small').textContent).toBe('Teacher / Department');
  });

  it('loads the initial dashboard from each role-specific route', () => {
    const cases = [
      ['/principal/dashboard', 'principal', 'Amira Benali'],
      ['/inventory/dashboard', 'inventory_manager', 'Yacine Haddad'],
      ['/teacher/dashboard', 'teacher', 'Nadia Karim'],
      ['/supplier/dashboard', 'supplier', 'Demo Supplier'],
      ['/driver/dashboard', 'driver', 'Samir Bensaid'],
    ];

    for (const [path, actorId, expectedName] of cases) {
      const container = renderAt(path, actorId);
      expect(container.querySelector('.sidebar-profile strong').textContent).toBe(expectedName);
      act(() => root.unmount());
      root = null;
    }
  });
});
