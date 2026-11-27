const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Could not connect to the school-management API.');
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error('The API returned an invalid response.');
  }

  if (!response.ok) {
    throw new Error(
      body?.error?.message || `The API request failed with status ${response.status}.`,
    );
  }

  return body;
}

export function getSchoolData() {
  return request('/school-data');
}

export function sendAction(action) {
  return request('/actions', {
    method: 'POST',
    body: JSON.stringify(action),
  });
}
