# School Management Front-End — MVP

Status: implemented as a React front end and small Express API. School records
are hardcoded in the backend; there is no database.

## Objective

Provide a responsive front end for common secondary-school administration
screens. Students can explore five demonstration roles and learn how the UI
loads data and sends actions to an API.

## Demonstration roles

| Role | Main capabilities |
|---|---|
| School Principal | View dashboards and school records; review procurement, authorize supplier consultations, compare offers, and manage transportation |
| Inventory Manager | Manage inventory and stock movements; fulfill department requests; prepare purchase requests, consultations and orders |
| Teacher / Department | Submit supply requests and review issued materials |
| External Supplier | Review authorized consultations and submit quotations as one of three demo suppliers |
| Driver | View assigned routes and students; start or finish journeys; report incidents or maintenance |

The login is a learning demo with shared sample accounts. It is not production
authentication. Users sign in with one of the demo emails and reach the
workspace for that account.

## Screens and routes

- `/`: sends visitors to `/login`.
- `/login`: signs in with a demo email and password.
- `/access`: redirects to `/login` for older links.
- `/principal/dashboard`, `/inventory/dashboard`, `/teacher/dashboard`,
  `/supplier/dashboard`, `/driver/dashboard`: role-specific summaries and
  shortcuts.
- `/principal/school`: student, class and school-record views.
- `/inventory/stock`: inventory items, stock movements and department
  requests.
- `/teacher/requests`: create supply requests and review received materials.
- `/inventory/procurement`: prepare purchase requests, supplier
  consultations, purchase orders and deliveries.
- `/principal/procurement`: approve or reject purchases, authorize
  consultations, select offers and review budget summaries.
- `/supplier/quotations`: review authorized requests and submit offers.
- `/principal/transportation`: review transport requests and manage vehicles,
  routes and driver reports.
- `/driver/route`: see the assigned route, authorized students, journey
  history and driver reports.

The front end sends users to their own role's workspace. The demo API checks
that a user is signed in, but does not hide records based on role. Do not use
this demo setup to protect real data.

## What the demo does

- Pages display fictional records returned by the Express API.
- Login uses an httpOnly session cookie; the server keeps demo sessions in
  memory.
- Forms and action buttons send named requests through the API client.
- `POST /api/actions` currently returns `501 ACTION_NOT_IMPLEMENTED`. It does
  not claim that actions have been saved or that school records have changed.
- The backend keeps sample records in memory. Restarting it restores the
  hardcoded examples.

## Runtime and data

| Concern | Choice |
|---|---|
| UI | React 19 and React DOM 19 |
| Language | JavaScript ES modules and JSX |
| Routing | React Router DOM 7 |
| Shared state | React Context for API data and temporary UI state |
| Styling | Plain CSS |
| Build/dev | Vite |
| Testing | Vitest and jsdom |
| Backend | Express on Node.js |
| School data | Hardcoded in the backend; no database |

The app starts from `front-end/index.html` and mounts through
`front-end/js/main.jsx`. Front-end code is grouped by responsibility:

- `front-end/js/app/` contains the app root and route definitions.
- `front-end/js/components/layout/` contains the shared workspace layout.
  `components/ui.jsx` is a compatibility export surface for implementations
  grouped under `components/ui/`.
- `front-end/js/features/` contains feature-owned screens, with genuinely
  shared screen helpers under `features/shared/`.
- `front-end/js/api/` contains the HTTP endpoint calls.
- `front-end/js/context/AppContext.jsx` checks the login session, loads school
  data, sends actions, and keeps temporary screen state.
- `front-end/js/features/access/LoginPage.jsx` contains the simple demo login.
- `backend/app.js` defines the Express API routes.
- `backend/data/schoolData.js` is the only source of hardcoded school records.

The front end reaches the backend through a Vite development proxy.
“Reload School Data” requests the records again. The backend handles demo
login/logout, serves `GET /api/school-data`, and returns a clear,
not-yet-implemented response for `POST /api/actions`.

## Commands

Start the backend from `backend/`:

```bash
npm install
npm run dev
npm test
```

In another terminal, run from `front-end/`:

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

## Boundaries

- **In scope:** responsive screens, a small Express API, hardcoded fictional
  data and API calls from the front end.
- **Not in scope:** business-rule execution in the browser, production
  authentication or authorization, implementing school actions, a database,
  persistence across restarts, production data, or deployment infrastructure.
- Do not put credentials or real personal information in the demo data.

## Success criteria

- All five roles can reach their permitted screens and view the shared sample
  data.
- The backend is the only application source of school data.
- Actions go through the API client; unfinished actions return a clear error.
- Loading and API errors are visible.
- The UI works at common desktop and mobile widths without horizontal page
  overflow.
- Login and role-specific routes work in the browser without runtime errors; the
  focused tests, complete test suite and production build pass.
