# Spec: School Management Front-End — V1

## Objective

Establish the foundation of a vanilla (no-framework) School Management front-end and prove it works end to end by rendering a dashboard shell whose content is driven by mock data.

**Primary user:** A school administrator opening the app in a browser to get an at-a-glance overview of the school.

**Why now:** The repository is empty. We need a clear, conventional structure and a working starting point before any feature module is built.

**Success looks like:** Opening `front-end/index.html` shows a styled, responsive dashboard with a header, sidebar navigation, and summary cards populated from `js/mock-data.js` — with no console errors and no network dependencies.

### Acceptance criteria

- The repository contains exactly the requested structure under `front-end/` (see Project Structure).
- `index.html` loads `css/style.css`, `js/mock-data.js`, then `js/app.js` (correct order, scripts at end of body or deferred).
- The page renders: app header (school name + user), sidebar navigation, and a dashboard area with summary stat cards read from mock data.
- `js/mock-data.js` exposes mock school data and is the **only** source of dashboard content.
- `js/app.js` renders the UI from data (no hard-coded card values in HTML) and contains no framework dependencies.
- The app works offline (no CDN fonts/scripts/styles) and opens correctly via `file://` or a local static server.
- Layout is usable at 360px and 1440px viewport widths.
- No uncaught JavaScript errors in the browser console.
- Basic accessibility: semantic landmarks (`header`, `nav`, `main`), visible focus styles, text contrast meeting WCAG AA, and icons marked `aria-hidden` when decorative.

## Tech Stack

| Concern | Choice |
|---|---|
| Markup | HTML5 |
| Styling | Plain CSS (custom properties for theming) |
| Behaviour | Vanilla JavaScript (ES2020+, ES modules optional — see Open Questions) |
| Data | Static mock data in `js/mock-data.js` |
| Build tooling | None |
| Dependencies | None (no CDN, no npm packages) |

## Commands

No build step. Commands are for serving and sanity-checking:

```bash
# Serve locally (from repo root)
python3 -m http.server 8000
# then open http://localhost:8000/front-end/

# Syntax-check JavaScript
node --check front-end/js/mock-data.js
node --check front-end/js/app.js

# Validate HTML (optional, only if a validator is already available)
npx --yes html-validate front-end/index.html
```

Opening `front-end/index.html` directly in a browser must also work.

## Project Structure

```
front-end/
├── index.html          → Single page shell: header, sidebar nav, main dashboard
├── css/
│   └── style.css       → All styles, design tokens as CSS custom properties
├── js/
│   ├── app.js          → Bootstraps app; reads mock data and renders the UI
│   └── mock-data.js    → Mock school data (exported/attached global)
└── assets/
    └── icons/          → SVG icons (navigation and stat-card icons)
```

Conventions:
- All application files live under `front-end/`. No source files at repo root.
- `css/` holds styles only; `js/` holds behaviour and data only.
- Icons are standalone `.svg` files referenced from HTML/CSS/JS.
- Future feature modules add files inside the existing `js/` and `css/` folders rather than inventing new top-level directories.

## Code Style

Plain, readable, dependency-free code. `const`/`let` over `var`; small pure render helpers; data-driven DOM creation instead of string-concatenated HTML where practical.

```js
// js/app.js — style example
const selectors = {
  stats: '[data-slot="stats"]',
};

function renderStatCard({ label, value, icon }) {
  const card = document.createElement('article');
  card.className = 'stat-card';

  const iconEl = document.createElement('img');
  iconEl.src = `assets/icons/${icon}.svg`;
  iconEl.alt = '';
  iconEl.setAttribute('aria-hidden', 'true');

  const valueEl = document.createElement('p');
  valueEl.className = 'stat-card__value';
  valueEl.textContent = String(value);

  const labelEl = document.createElement('p');
  labelEl.className = 'stat-card__label';
  labelEl.textContent = label;

  card.append(iconEl, valueEl, labelEl);
  return card;
}

function renderDashboard() {
  const container = document.querySelector(selectors.stats);
  const cards = schoolData.stats.map(renderStatCard);
  container.replaceChildren(...cards);
}

document.addEventListener('DOMContentLoaded', renderDashboard);
```

Naming conventions:
- CSS classes: BEM-style (`stat-card`, `stat-card__value`, `sidebar--open`).
- JS: `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for true constants.
- Data attributes for JS hooks: `data-slot="..."` (never style by these).
- Files: lowercase, dash-separated where multi-word.

## Testing Strategy

No automated test framework is introduced in V1 (that is deferred). V1 verification is a documented manual pass plus syntax checks:

- **Syntax:** `node --check` on every JS file.
- **Manual browser QA** at 360px, 768px, and 1440px:
  - Page loads with no console errors.
  - All stat cards render values matching `mock-data.js`.
  - Sidebar/header/main landmarks present.
  - Keyboard focus is visible on nav links.
  - Page works with network disabled (offline).
- **Data-driven check:** temporarily change a value in `mock-data.js` and confirm the UI reflects it without touching HTML.

Automated tests (e.g., Playwright) are recorded under Out of Scope for V1.

## Boundaries

**Always**
- Keep the app dependency-free and offline-capable.
- Render dashboard content from `mock-data.js`; keep HTML as a structural shell.
- Run `node --check` on changed JS and do the manual QA pass before considering a task done.
- Use semantic HTML and keep decorative icons `aria-hidden`.

**Ask first**
- Adding any dependency, CDN link, or build tool.
- Changing the requested directory structure or file names.
- Introducing ES modules/`type="module"` (changes how the app is served).
- Adding new top-level pages/modules beyond the dashboard shell.

**Never**
- Add a backend, database, authentication, or persistence in V1.
- Commit secrets, credentials, or generated build artifacts.
- Remove or bypass the manual QA checks to "get it green".
- Hard-code dashboard values into `index.html`.

## Success Criteria

1. `front-end/` matches the specified structure with all listed files/folders present.
2. `index.html` links `css/style.css` and loads `js/mock-data.js` before `js/app.js`.
3. Dashboard stat cards are generated from `schoolData` in `js/mock-data.js`; editing that file changes the rendered output.
4. Header, sidebar navigation, and main dashboard are all visible and styled.
5. No console errors and no external network requests for app functionality.
6. Usable at 360px and 1440px; nav and content do not overlap or overflow.
7. Semantic landmarks and visible focus styles are present.
8. `node --check` passes on both JS files.

## Out of Scope (Deferred)

- Student, teacher, class, attendance, grade, and fee management modules — need their own specs.
- CRUD forms, validation, and data persistence — no backend in V1.
- Authentication/authorization and role-based views.
- Client-side routing or multiple pages.
- Automated tests (Playwright/unit) and CI — add once behaviour stabilises.
- Charts, calendar, and search/filter functionality.
- Build tooling, bundler, or framework migration.

## Open Questions

1. **Dashboard vs. scaffold only:** V1 assumes a working dashboard shell. If you only want empty scaffold files, say so and I'll cut the rendering criteria.
2. **Branding:** Assumed school name "Sunrise Academy" and a neutral indigo theme. Provide real name/colors if different.
3. **Icons:** Assumed a small set of SVG icons (students, teachers, classes, calendar). Provide a preferred icon source/style if any.
4. **Scripts as modules:** Assumed classic scripts (no `type="module"`) so the page works via `file://`. Confirm if ES modules are preferred.
5. **Language/locale:** Assumed English (US) copy.

---

**Status:** Proposed — awaiting human approval before planning.
