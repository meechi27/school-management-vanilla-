# Spec Delta: Front-End API Boundary

Status: implemented in the front end; backend contract remains to be confirmed

## Objective

Prepare the React front end to display school data and send user actions to a
future backend. The browser must not decide school business rules or apply
business-data updates. Keep the existing screens and static mock records so
students can explore the interface before a backend exists.

## Current behavior before this change

- `AppContext` loaded and saved application data using `localStorage`.
- React `useReducer` and four domain reducers applied school workflows in the
  browser.
- No backend implementation or endpoint contract existed in this repository.

## Proposed contract

Use one read endpoint and one command endpoint as a small, easy-to-follow
starting contract:

- `GET /api/school-data` returns `{ "data": <school data> }`.
- `POST /api/actions` accepts `{ "type": "<action name>", "payload": {} }`.
  The backend validates and applies the action, then returns updated school
  data in the same `{ "data": ... }` shape.
- Errors use `{ "error": { "code": "...", "message": "..." } }`.

The action names and payloads can initially reuse the current action names,
but their implementation and validation move to the backend. The endpoint
paths live in one API client module so they can be changed when a real backend
contract is agreed.

## Mock mode

- Static sample records remain available through a mock API adapter.
- The mock adapter returns the same data shape as the API contract.
- Mock mutation calls are acknowledged as mock-only and do not change records
  or simulate business rules. The UI shows the error and keeps its current
  sample records.
- The mock adapter is the default until a real backend is available; switching
  to HTTP uses `VITE_API_MODE=http` and must not require changing feature
  screens.

## Scope and boundaries

- Keep the current role-based screens and display formatting.
- Keep local role selection and temporary UI state; these are presentation
  concerns, not school business rules.
- Do not create IDs, references, timestamps, or updated school records in the
  browser. The backend owns those decisions.
- Keep school-business validation and workflow rules on the backend. The UI
  may keep basic input controls and presentation formatting.
- The backend is out of scope for this change.
- Do not add a dependency or invent authentication, database, or deployment
  behavior.

## Success criteria

- Feature screens read records through the API boundary and send actions
  through it; they do not update school records directly.
- The browser contains no school-workflow reducer or school-record
  `localStorage` persistence path.
- Mock records remain visible on reload; mock mutation calls do not apply
  frontend business rules or change records.
- Loading and API errors are visible and consistently handled.
- Tests cover mock data loading, action submission, error responses, and key
  page rendering; the build passes.

## Deferred

- Implementing the real backend and deciding its internal architecture.
- Replacing the temporary command endpoint with resource-specific endpoints.
- Authentication, database persistence, and deployment.

## Open decision

This proposal uses the minimal `GET /api/school-data` and `POST /api/actions`
contract. It is intentionally a small transition interface, not a claim that
the future backend must use this shape permanently.
