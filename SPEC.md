# Spec: School Management Front-End — V1

> Revision: V1 toolchain added — latest Vite, Vitest, and the newest jsdom compatible with the installed Node. Still the same header-only feature.

## Objective

Initialize a vanilla (no-framework) School Management front-end with the requested folder structure, a minimal build/test toolchain, and a single **header-only page**. No screens, navigation, or functionality have been designed yet, so V1 deliberately renders only the app header showing the application name.

**Primary user:** A school administrator opening the app in a browser. At this stage the page simply establishes the product identity and a clean base to grow from.

**Why now:** The repository is empty. We need a conventional structure, a working toolchain, and a placeholder-free starting page before any feature module is designed.

**Success looks like:** `npm run dev` serves a styled, responsive header containing the application name only; `npm test` passes; `npm run build` produces a working `dist/`; there are no console errors, no placeholder content, and no runtime CDN dependencies.

### Acceptance criteria

- The repository contains the requested structure under `front-end/`, plus a `tests/` folder and toolchain config (see Project Structure).
- `assets/icons/` is created but empty — no placeholder icons.
- `index.html` links `css/style.css` and loads `js/app.js` as a single ES module (`<script type="module" src="/js/app.js"></script>`).
- `js/app.js` imports the app name from `js/mock-data.js`; `js/mock-data.js` uses `export`.
- The page renders **only a header**: the application name. No tagline, no logo, no sidebar, no nav links, no dashboard, no cards, no forms.
- No placeholder text, dummy school names, lorem ipsum, or placeholder/specimen assets anywhere.
- The header name comes from `js/mock-data.js`; `js/app.js` populates it (no duplicated hard-coded name in the header markup).
- Build: `npm run build` completes and emits `front-end/dist/`.
- Tests: `npm test` runs Vitest in a jsdom environment and passes.
- Dev/build/preview serve over HTTP; `file://` is not a supported entry point.
- The header is usable at 360px and 1440px viewport widths (no overflow/horizontal scroll).
- No uncaught JavaScript errors in the browser console.
- Basic accessibility: semantic `<header>` landmark, a single `<h1>` with the app name, and WCAG AA text contrast.

## Tech Stack

| Concern | Choice |
|---|---|
| Markup | HTML5 |
| Styling | Plain CSS (custom properties for theming) |
| Behaviour | Vanilla JavaScript, native ES modules |
| Data | Static module in `js/mock-data.js` (exports the app name) |
| Build/dev | Vite `^8.4.0` (latest) |
| Testing | Vitest `^5.1.2` (latest) with jsdom `^29.1.1` |
| Package manager | npm (lockfile committed) |
| Framework | None (no React/Vue/etc.) |

Dev dependencies are limited to `vite`, `vitest`, and `jsdom`.

**Version policy (latest compatible, minimal):**
- Installed Node: **v22.17.0** (verified). Declared engine: `>=22.13.0`.
- Vite 8.4.0 and Vitest 5.1.2 are the latest releases and support Node 22.17.
- jsdom 31 requires Node `^22.22.2`, which this machine does **not** satisfy; therefore jsdom **29.1.1** (latest compatible, requires `^20.19 || ^22.13 || >=24`) is pinned.
- Node **26.13.1** is the latest LTS but is not installed and no version manager is present. Upgrading Node is a machine-level change and is out of scope unless explicitly requested; doing so would unlock jsdom 31.

## Commands

All commands run from `front-end/`:

```bash
# Install (creates package-lock.json)
npm install

# Dev server (http://localhost:5173/)
npm run dev

# Build to front-end/dist/
npm run build

# Preview the production build
npm run preview

# Run the test suite once (jsdom)
npm test

# Watch mode
npm run test:watch
```

Lint/format commands are not configured in V1 (see Out of Scope).

## Project Structure

```
front-end/
├── index.html          → Single page: header only
├── package.json        → Scripts + devDependencies (vite, vitest, jsdom)
├── package-lock.json   → Committed lockfile
├── .gitignore          → Ignores node_modules/ and dist/
├── css/
│   └── style.css       → All styles, design tokens as CSS custom properties
├── js/
│   ├── app.js          → ES module; exports render logic, imports the app name
│   └── mock-data.js    → ES module; exports the application name
├── tests/
│   └── app.test.js     → Vitest/jsdom tests for data + header rendering
└── assets/
    └── icons/          → Created empty; reserved for real icons later (no placeholders)
```

Conventions:
- All application files live under `front-end/`. No source files at repo root.
- Vite root is `front-end/`, so `index.html`, `/css/...`, and `/js/...` resolve from there.
- `css/` holds styles only; `js/` holds behaviour and data only; `tests/` holds tests only.
- `js/app.js` is the single module entry point; it imports from `js/mock-data.js`.
- Future screens/features add files inside the existing folders rather than inventing new top-level directories.

## Code Style

Plain, readable, dependency-free application code. `const`/`let` over `var`; small exported functions (testable); data-driven DOM updates.

```js
// js/mock-data.js
export const app = Object.freeze({
  name: 'School Management',
});
```

```js
// js/app.js
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
```

```js
// tests/app.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHeader } from '../js/app.js';
import { app } from '../js/mock-data.js';

describe('renderHeader', () => {
  beforeEach(() => {
    document.body.innerHTML = '<h1 data-slot="app-name"></h1>';
  });

  it('renders the application name', () => {
    renderHeader(document.querySelector('[data-slot="app-name"]'), app.name);
    expect(document.querySelector('[data-slot="app-name"]').textContent)
      .toBe('School Management');
  });
});
```

Naming conventions:
- CSS classes: BEM-style (`app-header`, `app-header__name`).
- JS: `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for true constants.
- Data attributes for JS hooks: `data-slot="..."` (never style by these).
- Files: lowercase, dash-separated where multi-word; tests as `*.test.js`.

## Testing Strategy

- **Framework:** Vitest with the `jsdom` environment (set via the `test` script).
- **Location:** `front-end/tests/`, named `*.test.js`.
- **Level:** focused unit/smoke tests for V1:
  - `mock-data.js` exports the expected app name.
  - `renderHeader` writes the name into the header slot.
  - `index.html` contains a semantic `<header>`, one `<h1>`, the stylesheet link, and the module script.
- **Coverage:** no numeric threshold in V1 (coverage tooling deferred); every V1 behaviour above must be covered.
- **Build verification:** `npm run build` must succeed and `npm run preview` must render the header.
- **Manual QA** at 360px, 768px, and 1440px: no console errors, no overflow, offline-capable, data-driven check, no-placeholder audit.

## Boundaries

**Always**
- Keep runtime code dependency-free and offline-capable.
- Use ES modules for application code; keep `app.js` the single entry point.
- Keep dev dependencies to `vite`, `vitest`, and `jsdom`; commit `package-lock.json`.
- Render header content from `mock-data.js`; keep `index.html` as a structural shell.
- Run `npm test` and `npm run build` plus the manual QA pass before considering a task done.
- Use semantic HTML (`<header>`, one `<h1>`).

**Ask first**
- Adding any dependency beyond `vite`, `vitest`, and `jsdom`.
- Changing scripts in `package.json` or the directory structure/file names.
- Adding a linter, formatter, coverage tool, CI, or framework.
- Adding any screen, navigation, section, logo, tagline, or interactive feature beyond the name-only header.

**Never**
- Use placeholder text, dummy school names, lorem ipsum, or placeholder/specimen assets.
- Add a backend, database, authentication, or persistence in V1.
- Commit `node_modules/`, `dist/`, secrets, credentials, or generated build artifacts.
- Remove or skip tests, or bypass QA checks, to "get it green".
- Hard-code the header name into `index.html` instead of rendering it from mock data.

## Success Criteria

1. `front-end/` contains all requested files/folders plus `package.json`, `package-lock.json`, `.gitignore`, and `tests/`; `assets/icons/` exists but is empty.
2. `npm install` succeeds and produces a committed lockfile.
3. `index.html` links `css/style.css` and loads `js/app.js` via `<script type="module">`.
4. `js/mock-data.js` exports the name and `js/app.js` imports it; editing the name changes the rendered header.
5. The page shows a single, styled header with the application name only — no logo, tagline, nav, dashboard, cards, or forms.
6. No placeholder content or placeholder assets exist anywhere.
7. `npm test` passes and covers the data export, header render, and HTML shell.
8. `npm run build` succeeds, and `npm run preview` renders the header.
9. No console errors and no external network requests for app functionality.
10. Header is usable at 360px and 1440px with no horizontal overflow.
11. Semantic `<header>` with one `<h1>`, and WCAG AA contrast.

## Out of Scope (Deferred)

- Sidebar/navigation, dashboard, and any additional screens — not designed yet.
- Logo, tagline, and icon set — no real assets provided; `assets/icons/` stays empty.
- Student, teacher, class, attendance, grade, and fee modules — need their own specs.
- CRUD forms, validation, and data persistence — no backend in V1.
- Authentication/authorization and role-based views.
- Client-side routing or multiple pages.
- Linter/formatter (ESLint/Prettier), coverage thresholds, and CI — add once behaviour stabilises.
- Additional test levels (component/e2e/browser) — not needed for a static header.
- Upgrading the machine's Node runtime to 26.x LTS (would unlock jsdom 31) — a system-level change, not project tech.
- Framework migration; `file://` support (incompatible with ES modules).

## Open Questions

- None blocking. Toolchain is deliberately minimal: Vite + Vitest + jsdom only. Lint/format/CI can be added later.
- If you want jsdom 31 (latest), the prerequisite is installing Node 26.x LTS on the machine. Say the word and I'll treat that as a separate environment task.

---

**Status:** Revised — awaiting human approval of this toolchain change before implementation.
