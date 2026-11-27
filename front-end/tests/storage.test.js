import { describe, expect, it } from 'vitest';

import { createSeedData } from '../js/data/seed-data.js';
import { loadState, saveState, STORAGE_KEY } from '../js/state/storage.js';

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); },
  };
}

describe('demo state persistence', () => {
  it('saves and restores the shared application state', () => {
    const storage = createMemoryStorage();
    const state = createSeedData();
    state.students[0].firstName = 'Updated';

    expect(saveState(state, storage)).toBeNull();
    expect(loadState(storage).students[0].firstName).toBe('Updated');
  });

  it('recovers from invalid stored JSON with a visible error notification', () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: '{not valid json' });
    const state = loadState(storage);

    expect(state.students).toHaveLength(12);
    expect(state.notifications[0].type).toBe('error');
    expect(state.notifications[0].message).toContain('could not be loaded');
  });

  it('restores seed data when the saved structure is incomplete', () => {
    const storage = createMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 1, students: [] }),
    });

    expect(loadState(storage).items).toHaveLength(8);
  });
});
