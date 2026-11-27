import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../app.js';

let server;
let apiUrl;

async function startServer() {
  server = createApp('test-session-secret-long-enough-for-tests').listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  apiUrl = `http://127.0.0.1:${server.address().port}/api`;
}

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = null;
  }
});

describe('demo login', () => {
  it('only returns school data after login', async () => {
    await startServer();

    const response = await fetch(`${apiUrl}/school-data`);

    assert.equal(response.status, 401);
  });

  it('does not accept actions without a login session', async () => {
    await startServer();

    const response = await fetch(`${apiUrl}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'CREATE_SUPPLY_REQUEST', payload: {} }),
    });

    assert.equal(response.status, 401);
  });

  it('logs in a demo user and creates a session', async () => {
    await startServer();

    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'amira.benali@example.test',
        password: 'schooldemo123',
      }),
    });
    const loginBody = await loginResponse.json();
    const cookie = loginResponse.headers.get('set-cookie').split(';')[0];
    const dataResponse = await fetch(`${apiUrl}/school-data`, {
      headers: { Cookie: cookie },
    });
    const dataBody = await dataResponse.json();

    assert.equal(loginResponse.status, 200);
    assert.equal(loginBody.user.actorId, 'principal');
    assert.equal(dataResponse.status, 200);
    assert.equal(dataBody.data.students.length, 12);
  });

  it('rejects an incorrect password with a clear error', async () => {
    await startServer();

    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'amira.benali@example.test',
        password: 'wrong-password',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error.code, 'LOGIN_FAILED');
  });

  it('ends a session when the user logs out', async () => {
    await startServer();

    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'amira.benali@example.test',
        password: 'schooldemo123',
      }),
    });
    const cookie = loginResponse.headers.get('set-cookie').split(';')[0];
    const logoutResponse = await fetch(`${apiUrl}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    const dataResponse = await fetch(`${apiUrl}/school-data`, {
      headers: { Cookie: cookie },
    });

    assert.equal(logoutResponse.status, 200);
    assert.equal(dataResponse.status, 401);
  });
});
