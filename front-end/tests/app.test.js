import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { AppProvider } from '../js/context/AppContext.jsx';
import { AppRoutes } from '../js/app/App.jsx';
import { createSeedData } from '../js/data/seed-data.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root;
let mount;

function renderAt(path, actorId = null) {
  document.body.innerHTML = '<div id="app"></div>';
  mount = document.querySelector('#app');
  root = createRoot(mount);
  act(() => {
    root.render(
      createElement(
        AppProvider,
        { initialActorId: actorId, initialSchoolData: createSeedData() },
        createElement(
          MemoryRouter,
          { initialEntries: [path] },
          createElement(AppRoutes),
        ),
      ),
    );
  });
  return mount;
}

afterEach(() => {
  if (root) act(() => root.unmount());
  root = null;
});

describe('React school-management application', () => {
  it('sends the site root to the role chooser', () => {
    const container = renderAt('/');

    expect(container.querySelectorAll('.access-card')).toHaveLength(5);
  });

  it('loads mock school data before showing application routes', async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount = document.querySelector('#app');
    root = createRoot(mount);

    act(() => {
      root.render(
        createElement(
          AppProvider,
          null,
          createElement(
            MemoryRouter,
            { initialEntries: ['/'] },
            createElement(AppRoutes),
          ),
        ),
      );
    });

    expect(mount.textContent).toContain('Loading school data');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mount.querySelectorAll('.access-card')).toHaveLength(5);
  });

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
