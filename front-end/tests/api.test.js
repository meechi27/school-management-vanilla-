import { afterEach, describe, expect, it, vi } from 'vitest';

import { getSchoolData, sendAction } from '../js/api/index.js';
import { sendAction as sendHttpAction } from '../js/api/httpApi.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mock API', () => {
  it('loads the sample records for display', async () => {
    const response = await getSchoolData();

    expect(response.data.actors).toHaveLength(5);
    expect(response.data.items).toHaveLength(8);
    expect(response.data.supplyRequests).toHaveLength(2);
  });

  it('does not simulate a business action in the browser', async () => {
    await expect(
      sendAction({
        type: 'FULFILL_SUPPLY_REQUEST',
        payload: { requestId: 'sreq-1' },
      }),
    ).rejects.toThrow('Mock mode does not apply business actions');
  });
});

describe('HTTP API', () => {
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

    await expect(sendHttpAction(action)).resolves.toEqual(responseBody);

    expect(fetchMock).toHaveBeenCalledWith('/api/actions', {
      headers: { 'Content-Type': 'application/json' },
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

    await expect(sendHttpAction({ type: 'CREATE_SUPPLY_REQUEST', payload: {} }))
      .rejects.toThrow('Request is invalid.');
  });
});
