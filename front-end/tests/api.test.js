import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getCurrentUser,
  getSchoolData,
  logIn,
  logOut,
  sendAction,
} from '../js/api/index.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HTTP API', () => {
  it('loads school data from the backend', async () => {
    const responseBody = { data: { students: [] } };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseBody,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getSchoolData()).resolves.toEqual(responseBody);

    expect(fetchMock).toHaveBeenCalledWith('/api/school-data', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    });
  });

  it('checks, starts, and ends a login session', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ user: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await getCurrentUser();
    await logIn({ email: 'demo@example.test', password: 'demo-password' });
    await logOut();

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/session', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      method: 'POST',
      body: JSON.stringify({
        email: 'demo@example.test',
        password: 'demo-password',
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/auth/logout', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      method: 'POST',
    });
  });

  it('sends an action to the shared actions endpoint', async () => {
    const action = {
      type: 'FULFILL_SUPPLY_REQUEST',
      payload: { requestId: 'sreq-1' },
    };
    const responseBody = { message: 'Request saved.' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => responseBody,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendAction(action)).resolves.toEqual(responseBody);

    expect(fetchMock).toHaveBeenCalledWith('/api/actions', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      method: 'POST',
      body: JSON.stringify(action),
    });
  });

  it('shows the API error message when an action is rejected', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        error: { code: 'VALIDATION_ERROR', message: 'Request is invalid.' },
      }),
    }));

    await expect(sendAction({ type: 'CREATE_SUPPLY_REQUEST', payload: {} }))
      .rejects.toThrow('Request is invalid.');
  });
});
