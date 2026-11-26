# Task List: School Management Front-End — V1

Source spec: `SPEC.md`
Plan: `tasks/plan.md`

---

## Task 1: Initialize the toolchain

**Description:** Create `front-end/package.json` with the minimal dev dependencies (`vite@^8.4.0`, `vitest@^5.1.2`, `jsdom@^29.1.1`) and scripts (`dev`, `build`, `preview`, `test`, `test:watch`), declare `"engines": { "node": ">=22.13.0" }`, add `front-end/.gitignore` for `node_modules/` and `dist/`, and run `npm install` from `front-end/` to produce a committed `package-lock.json`. No application code yet.

**Acceptance criteria:**
- [ ] `front-end/package.json` exists with `"type": "module"`, the five scripts, the `>=22.13.0` engine, and only the three dev dependencies at the pinned latest-compatible versions.
- [ ] `front-end/.gitignore` ignores `node_modules/` and `dist/`.
- [ ] `npm install` succeeds from `front-end/` on Node 22.17.0 and creates `package-lock.json`.
- [ ] No runtime dependencies are added.
- [ ] jsdom is `29.1.1` (not 31.x), because Node 22.17 does not satisfy jsdom 31's engine range.

**Verification:**
- [ ] `cd front-end && npm install` exits 0.
- [ ] `npm ls --depth=0` lists only `vite`, `vitest`, and `jsdom` at the top level.
- [ ] `package-lock.json` is present and consistent with `package.json`.

**Dependencies:** None

**Files likely touched:**
- `front-end/package.json`
- `front-end/package-lock.json` (generated)
- `front-end/.gitignore`

**Estimated scope:** Small (3 files)

---

## Checkpoint: After Task 1

- [ ] `npm install` succeeds and the lockfile exists
- [ ] Scripts are registered in `package.json`
- [ ] Review with human before feature work

---

## Task 2: Write failing Vitest/jsdom tests (TDD red)

**Description:** Create `front-end/tests/app.test.js` covering the mock data export, `renderHeader`, and the `index.html` shell (semantic header, single `<h1>`, stylesheet link, module script). Do **not** create the application files yet. Run `npm test` and confirm it fails only because the implementation is missing.

**Acceptance criteria:**
- [ ] `front-end/tests/app.test.js` exists and targets the `jsdom` environment.
- [ ] Tests cover: app name export, header render, and index.html shell structure.
- [ ] No placeholder or trivial `expect(true)` assertions.
- [ ] `npm test` runs (no config/environment errors) and fails red for the expected missing-implementation reasons.

**Verification:**
- [ ] `cd front-end && npm test` runs and reports failures caused by missing modules/markup, not by broken Vitest/jsdom config.
- [ ] Confirm each planned assertion is present in the output or failure trace.

**Dependencies:** Task 1

**Files likely touched:**
- `front-end/tests/app.test.js`

**Estimated scope:** Small (1 file)

---

## Checkpoint: After Task 2 (Red)

- [ ] `npm test` executes under jsdom without configuration errors
- [ ] Failures are the expected "implementation missing" failures
- [ ] Review with human before implementation

---

## Task 3: Implement the header-only page end-to-end (TDD green)

**Description:** Create the `front-end/` application files: an `index.html` shell with a semantic `<header>` and `<h1 data-slot="app-name">`, styles in `css/style.css`, the application name exported from `js/mock-data.js`, and `js/app.js` importing that module and rendering the name. Create `assets/icons/` empty. Iterate until Task 2's tests pass. No placeholder content or assets.

**Acceptance criteria:**
- [ ] `index.html` links `css/style.css` and loads `js/app.js` via `<script type="module" src="/js/app.js"></script>`.
- [ ] `js/mock-data.js` exports the name `"School Management"`; `js/app.js` imports it and exports `renderHeader`/`init`.
- [ ] The page renders only a header with the name — no logo, tagline, nav, dashboard, cards, or forms.
- [ ] No placeholder text, dummy school names, lorem ipsum, or specimen assets exist.
- [ ] Header is responsive with no horizontal overflow at 360px and 1440px, and text contrast meets WCAG AA.
- [ ] `assets/icons/` exists and is empty.
- [ ] `npm test` passes (green).

**Verification:**
- [ ] `cd front-end && npm test` exits 0.
- [ ] `cd front-end && npm run dev`, open the printed URL, and confirm the header shows `School Management`.
- [ ] Browser console shows no uncaught errors and no failed requests.
- [ ] Manual check: editing the name in `mock-data.js` updates the header on reload.
- [ ] Manual check: no horizontal scrollbar at 360px and 1440px.

**Dependencies:** Task 2

**Files likely touched:**
- `front-end/index.html`
- `front-end/css/style.css`
- `front-end/js/mock-data.js`
- `front-end/js/app.js`
- `front-end/assets/icons/` (directory only)

**Estimated scope:** Medium (4 files + 1 directory)

---

## Checkpoint: After Task 3 (Green)

- [ ] `npm test` passes
- [ ] `npm run dev` serves the styled header with the name from mock data
- [ ] No console errors
- [ ] No horizontal overflow at 360px/1440px
- [ ] Review with human before build/QA

---

## Task 4: Build, preview, and manual QA

**Description:** Run the production build and preview, then execute the manual QA matrix at 360px, 768px, and 1440px, the data-driven check, the offline check, and the no-placeholder audit. Apply only minimal fixes required by the spec.

**Acceptance criteria:**
- [ ] `npm run build` succeeds and emits `front-end/dist/`.
- [ ] `npm run preview` serves a page that renders the header name.
- [ ] QA matrix passed at 360px, 768px, and 1440px (no overflow, header readable).
- [ ] Data-driven check passed (editing the name updates the header).
- [ ] Offline check passed (no runtime network requests for app functionality).
- [ ] No-placeholder audit passed (source and rendered page).
- [ ] No uncaught console errors.

**Verification:**
- [ ] `cd front-end && npm run build` exits 0.
- [ ] `cd front-end && npm run preview` and exercise the page at each viewport.
- [ ] Inspect DevTools: semantic `<header>`, one `<h1>`, no external requests.
- [ ] Manual check: contrast and readability acceptable.

**Dependencies:** Tasks 2, 3

**Files likely touched:**
- `front-end/css/style.css` (only if a fix is required)
- `front-end/js/app.js` (only if a fix is required)
- `front-end/js/mock-data.js` (restored after the data-driven check)

**Estimated scope:** Small (0–2 files)

---

## Checkpoint: Complete

- [ ] `npm test` passes
- [ ] `npm run build` succeeds and `npm run preview` renders the header
- [ ] Every spec success criterion is met
- [ ] No placeholder content or assets
- [ ] Ready for human review and commit
