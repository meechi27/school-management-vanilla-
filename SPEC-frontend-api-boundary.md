# Express API and Front-End Boundary

Status: implemented

## Purpose

Keep school records in one place: the Express backend. The React front end
loads and displays those records and sends user actions to the API. There is
no database yet.

## API routes

- `GET /api/auth/session` returns the signed-in user or `null`.
- `POST /api/auth/login` checks a demo email and password and starts a session.
- `POST /api/auth/logout` ends the current session.
- `GET /api/school-data` returns `{ "data": <school data> }`.
- `POST /api/actions` accepts `{ "type": "<action name>", "payload": {} }`.
  The endpoint currently returns `501 ACTION_NOT_IMPLEMENTED`. No school
  action is reported as successful until its backend behavior is written.
- Errors use `{ "error": { "code": "...", "message": "..." } }`.

## Source of truth

- All hardcoded school records live in `backend/data/schoolData.js`.
- The Express app serves those records from `GET /api/school-data`.
- Login sessions are stored in the Express session cookie; the browser does
  not store the session in local storage.
- The front end does not include a second data fixture or store school
  records in browser storage.
- Restarting the backend resets its in-memory data to the hardcoded examples.

## Local development

1. Start the API from `backend/` with `npm run dev`.
2. Start the Vite app from `front-end/` with `npm run dev`.
3. Vite forwards `/api` requests to the local Express server.

## Boundaries

- Front-end pages may format and display data, keep temporary screen state,
  and send API requests.
- School rules, validation, identifiers, timestamps and record changes belong
  in the backend.
- Demo authentication uses shared sample credentials and in-memory sessions.
  It is for learning only and does not provide production role-based access.
- No database or deployment setup is included.

## Verification

- Backend tests cover login sessions, the protected data route, unfinished
  actions and invalid JSON.
- Front-end tests cover API requests, loading, routes and screen rendering.
- Both apps build/run independently; the local Vite proxy connects them.
