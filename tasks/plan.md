# Implementation Plan: School Management Front-End — V1

Source spec: `SPEC.md`

## Overview

Build a dependency-free-at-runtime, header-only starting page for the School Management front-end, with a minimal Vite build/dev setup and Vitest + jsdom tests. The page loads a single ES module entry point (`js/app.js`), which imports the application name from `js/mock-data.js` and renders it into a semantic `<header>`. Styling is plain CSS with custom properties. No framework, no placeholder content, no placeholder assets.

## Architecture Decisions

- **Vite 8.4.0 (latest) as the only build/dev tool.** Root is `front-end/`; `index.html` is the entry. Defaults are sufficient, so no `vite.config.js` is needed. Dev server, build, and preview all come from one dependency.
- **Vitest 5.1.2 (latest) + jsdom 29.1.1 (latest compatible with Node 22.17).** jsdom 31 needs Node `^22.22.2`, which the machine does not have. The `test` script passes `--environment jsdom`, avoiding a config file. Tests live in `front-end/tests/`, not inside `js/`.
- **Pin engine `>=22.13.0`.** Installed Node v22.17.0 satisfies it; Node 26 LTS is not installed and upgrading is a separate system task.
- **Testable module design.** `app.js` exports `renderHeader(nameEl, name)` and `init()`, and only auto-bootstraps in a browser. This lets tests call the render function directly without depending on load timing.
- **Native ES modules, no bundler-specific syntax.** Vite handles dev and build; source stays portable (`import`/`export`, no Vite-only imports).
- **Single vertical slice for the feature.** Task 3 delivers the complete working header (markup + styles + data + wiring) after Task 2 writes the failing tests, so the page is never split across half-broken implementation tasks.
- **Toolchain as its own foundation slice.** Task 1 sets up `package.json`, lockfile, and `.gitignore` before feature code, so dependency failures surface early.
- **CSS custom properties for theming.** Colors/spacing are tokens on `:root` so the indigo/light theme changes in one place.
- **No config file sprawl.** Only `package.json`, `package-lock.json`, and `.gitignore` are added beyond the requested structure; no `vite.config.js`, no ESLint/Prettier.
- **Empty `assets/icons/`.** Created as requested but intentionally left empty. No `.gitkeep` is added by default, to honor the "no placeholders" boundary; see Risks.

## Task List

Tasks are tracked in `tasks/todo.md`. Ordered index:

### Phase 1: Foundation

- [ ] Task 1: Initialize the toolchain (`package.json`, `npm install`, `.gitignore`)

### Checkpoint: Toolchain

- [ ] `npm install` succeeds and `package-lock.json` exists
- [ ] `npm run build` / `npm test` scripts are registered (may fail until files exist)
- [ ] Review with human before feature work

### Phase 2: Tests first (TDD red)

- [ ] Task 2: Write failing Vitest/jsdom tests for data export, header render, and HTML shell

### Checkpoint: Red

- [ ] `npm test` fails for the expected missing-implementation reasons (not config errors)
- [ ] Review with human before implementation

### Phase 3: Feature (TDD green)

- [ ] Task 3: Implement the header-only page end-to-end until the tests pass (`index.html`, `css/style.css`, `js/mock-data.js`, `js/app.js`, empty `assets/icons/`)

### Checkpoint: Green

- [ ] `npm test` passes
- [ ] `npm run dev` serves the styled header with the name from mock data
- [ ] No console errors, no horizontal overflow at 360px/1440px
- [ ] Review with human before build/QA

### Phase 4: Build and QA

- [ ] Task 4: Build + preview + manual QA matrix + refactor if needed

### Checkpoint: Complete

- [ ] `npm test` passes
- [ ] `npm run build` succeeds and `npm run preview` renders the header
- [ ] All spec success criteria met
- [ ] No placeholder content or assets
- [ ] Ready for human review / commit

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Windows Node installed outside WSL; npm scripts may hit path quirks | Medium | Verified `node.exe v22.17.0` + npm 10.9.2 work; run npm from `front-end/`; keep scripts plain and cross-platform. |
| Vite 8 engine requirement (Node >=22.12) | Medium | Local Node is 22.17; `engines` set to `>=22.13.0` (also satisfies jsdom 29). |
| jsdom 31 incompatible with Node 22.17 | Medium | Pin jsdom 29.1.1 (latest compatible). Upgrading to Node 26 LTS is deferred and would unlock jsdom 31. |
| `npm install` network/registry failure | Medium | Retry and use the committed lockfile; no exotic packages. |
| Vitest/jsdom version clash | Low | Versions verified from the registry (vitest 5.1.2, jsdom 29.1.1); if they clash, pin compatible ranges. |
| ES modules fail to load when opened via `file://` | Medium | Document and use `npm run dev` / `npm run preview`; verification explicitly uses HTTP. |
| Auto-run bootstrap breaks unit tests | Medium | `init()` no-ops when the slot is absent; tests call `renderHeader` directly. |
| Empty `assets/icons/` is not tracked by git | Low | Leave empty per "no placeholders"; add `.gitkeep` later only if the user wants the empty folder committed. |
| "Placeholder" creep (dummy names, lorem ipsum, sample icons) | Medium | No-placeholder audit is an explicit acceptance criterion in Task 4. |
| Header looks broken at narrow widths | Low | QA at 360px, 768px, and 1440px; fluid sizing and wrapping rules. |

## Parallelization Opportunities

Limited. Task 1 (toolchain) must complete before Task 2. Task 3 (implementation) depends on the failing tests from Task 2. Task 4 depends on all previous. Work is sequential.

## Open Questions

- None blocking. The toolchain is intentionally minimal; lint/format/CI are deferred.

---

**Status:** Revised — awaiting human approval before implementation (Phase 4).
