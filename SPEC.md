# School Management Front-End — MVP

Status: implemented as a front-end learning demo with read-only sample data.
This document describes the current product scope.

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

This is a demo experience, not authentication. Users can change roles using
the workspace switcher.

## Screens and routes

- `/`: sends visitors to `/access` to choose a demonstration role.
- `/access`: choose a demonstration role.
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

Routes are role-restricted. Entering another role's route redirects to that
role's dashboard.

## What the demo does

- Pages display fictional records returned by the mock API.
- Forms and action buttons send named requests through the API client.
- Mock mode does not save actions or simulate approvals, stock changes,
  purchases, deliveries, or journeys. It shows a message instead.
- A real backend must validate actions, apply school rules, create IDs and
  timestamps, and return updated data.

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
| Data and actions | Mock API by default; HTTP API with `VITE_API_MODE=http` |

The app starts from `front-end/index.html` and mounts through
`front-end/js/main.jsx`. Front-end code is grouped by responsibility:

- `front-end/js/app/` contains the app root and route definitions.
- `front-end/js/components/layout/` contains the shared workspace layout.
  `components/ui.jsx` is a compatibility export surface for implementations
  grouped under `components/ui/`.
- `front-end/js/features/` contains feature-owned screens, with genuinely
  shared screen helpers under `features/shared/`.
- `front-end/js/api/` selects the mock or HTTP adapter and contains the
  endpoint calls.
- `front-end/js/context/AppContext.jsx` loads school data, sends actions, and
  keeps only temporary role and notification state.
- `front-end/js/data/` contains role navigation and fictional sample records.

The mock API is read-only. “Reload School Data” requests the records again.
The HTTP adapter expects `GET /api/school-data` and `POST /api/actions`;
the backend and final contract are not included here.

## Commands

Run from `front-end/`:

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

## Boundaries

- **In scope:** responsive screens, fictional sample data, and a simple API
  boundary ready for a backend.
- **Not in scope:** business-rule execution in the browser, real
  authentication, authorization, backend implementation, persistence across
  devices, production data, or deployment infrastructure.
- Do not put credentials or real personal information in the demo data.

## Success criteria

- All five roles can reach their permitted screens and view the shared sample
  data.
- Actions go through the API client and mock mode does not change school
  records.
- Loading and API errors are visible.
- The UI works at common desktop and mobile widths without horizontal page
  overflow.
- Routes and role selection work in the browser without runtime errors; the
  focused tests, complete test suite and production build pass.
