# React Migration Record

Status: complete. The current product specification is [SPEC.md](./SPEC.md).

## Context

The original front end used vanilla JavaScript and hash-based navigation.
It was replaced with a React single-page application as the foundation for
the school-management MVP. The implementation then expanded beyond a
framework-only migration to include the workflows described in `SPEC.md`.

## Result

- React 19 renders all active screens.
- React Router DOM 7 provides path-based navigation and role-restricted
  routes.
- Context and `useReducer` share demo state across roles and workflows.
- Browser `localStorage` persists the fictional demo records and supports
  recovery/reset.
- Feature screens, shared components, reducer workflows and tests are
  organized under `front-end/js/` and `front-end/tests/`.

This file is retained as a short migration record; it is not the source of
current requirements. Follow [SPEC.md](./SPEC.md) for screen scope, behavior,
commands and boundaries.
