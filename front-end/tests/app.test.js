import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppProvider } from '../js/context/AppContext.jsx';
import { AppRoutes } from '../js/App.jsx';
import { createSchoolData } from '../../backend/data/schoolData.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root;
let mount;

function renderAt(path, actorId = null) {
  const schoolData = createSchoolData();
  const actor = schoolData.actors.find((item) => item.id === actorId);
  document.body.innerHTML = '<div id="app"></div>';
  mount = document.querySelector('#app');
  root = createRoot(mount);
  act(() => {
    root.render(
      createElement(
        AppProvider,
        {
          initialUser: actor ? { ...actor, actorId: actor.id } : null,
          initialSchoolData: schoolData,
        },
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
  vi.unstubAllGlobals();
});

describe('React school-management application', () => {
  it('sends the site root to the login page', () => {
    const container = renderAt('/');

    expect(container.querySelector('.login-form')).not.toBeNull();
  });

  it('sends visitors without a session to the login page', () => {
    const container = renderAt('/principal/dashboard');

    expect(container.querySelector('.login-form')).not.toBeNull();
  });

  it('checks the login session before showing application routes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: null }),
    }));
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

    expect(mount.querySelector('.login-form')).not.toBeNull();
  });

  it('logs in and opens the account dashboard', async () => {
    const container = renderAt('/login');
    const user = {
      id: 'principal',
      actorId: 'principal',
      role: 'principal',
      name: 'Amira Benali',
      title: 'Principal',
      email: 'amira.benali@example.test',
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: createSchoolData() }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await act(async () => {
      container.querySelector('.login-form').dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
    });

    expect(container.querySelector('.page-heading h1').textContent).toBe('Dashboard');
    expect(container.querySelector('.sidebar-profile strong').textContent).toBe('Amira Benali');
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
