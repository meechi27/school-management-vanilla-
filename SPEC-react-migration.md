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
- Context loads school data through the API client and holds temporary UI
  state.
- Feature screens send actions through the API client to Express.
- The Express backend owns all hardcoded school records. It has no database,
  and school actions return an explicit not-implemented response.
- The browser no longer uses school-workflow reducers or saves school records
  to `localStorage`.

This file is retained as a short migration record; it is not the source of
current requirements. Follow [SPEC.md](./SPEC.md) and
[SPEC-frontend-api-boundary.md](./SPEC-frontend-api-boundary.md) for screen
scope, API behavior, commands and boundaries.
