import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../app.js';

let server;
let apiUrl;
let sessionCookie;

async function startServer() {
  server = createApp('test-session-secret-with-at-least-32-characters').listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  apiUrl = `http://127.0.0.1:${server.address().port}/api`;
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'amira.benali@example.test',
      password: 'schooldemo123',
    }),
  });
  sessionCookie = response.headers.get('set-cookie').split(';')[0];
}

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = null;
    sessionCookie = null;
  }
});

describe('school management API', () => {
  it('returns the hardcoded school records', async () => {
    await startServer();

    const response = await fetch(`${apiUrl}/school-data`, {
      headers: { Cookie: sessionCookie },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.actors.length, 5);
    assert.equal(body.data.students.length, 12);
    assert.equal(body.data.items.length, 8);
  });

  it('does not pretend unimplemented actions were saved', async () => {
    await startServer();

    const response = await fetch(`${apiUrl}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ type: 'CREATE_SUPPLY_REQUEST', payload: {} }),
    });
    const body = await response.json();

    assert.equal(response.status, 501);
    assert.equal(body.error.code, 'ACTION_NOT_IMPLEMENTED');
  });

  it('rejects actions without an object payload', async () => {
    await startServer();

    const response = await fetch(`${apiUrl}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ type: 'CREATE_SUPPLY_REQUEST' }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'INVALID_ACTION');
  });

  it('returns a clear error for invalid JSON', async () => {
    await startServer();

    const response = await fetch(`${apiUrl}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid',
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, 'INVALID_JSON');
  });
});
