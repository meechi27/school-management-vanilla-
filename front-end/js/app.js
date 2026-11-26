import { app } from './mock-data.js';

export function renderHeader(nameEl, name) {
  nameEl.textContent = name;
}

export function init() {
  const nameEl = document.querySelector('[data-slot="app-name"]');
  if (!nameEl) return;
  renderHeader(nameEl, app.name);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}
