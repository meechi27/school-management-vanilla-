# School Management Front-End — MVP

Status: implemented as a local, browser-based React demonstration. This
document describes the current product scope and supersedes the earlier
header-only prototype specification.

## Objective

Provide a responsive front end for common secondary-school administration
workflows. Five demonstration roles use shared fictional records to manage
school information, supplies, procurement, transportation and driver reports.

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

## Core workflows

### Supply request and issue

1. A teacher submits a request with a department, justification and one or
   more items.
2. The inventory manager reviews pending requests and issues materials.
3. Issuance checks stock before changing any record, creates stock movements
   and fulfills the request as one operation.
4. The teacher can review the issued items and quantities.

### Procurement

1. The inventory manager submits an estimated purchase request.
2. The principal approves or rejects it.
3. The manager creates a supplier consultation for approved requests; the
   principal authorizes it before suppliers can respond.
4. Invited suppliers submit priced offers. The principal selects an offer.
5. The manager creates a purchase order and records full or partial
   deliveries. Received quantities update inventory and stock movements.

### Transportation

1. The principal reviews transport requests and manages vehicles and routes.
2. Routes include stops, schedules, a vehicle, an optional driver and
   authorized students. Student count cannot exceed vehicle capacity.
3. The principal approves a route; the assigned driver can start and finish
   its journey and submit an incident or maintenance report.
4. The principal can review and resolve driver reports.

## Runtime and data

| Concern | Choice |
|---|---|
| UI | React 19 and React DOM 19 |
| Language | JavaScript ES modules and JSX |
| Routing | React Router DOM 7 |
| Shared state | React Context and `useReducer` |
| Styling | Plain CSS |
| Build/dev | Vite |
| Testing | Vitest and jsdom |
| Persistence | Browser `localStorage` |

The app starts from `front-end/index.html` and mounts through
`front-end/js/main.jsx`. Seed records and role definitions live in
`front-end/js/data/`; route definitions, screens, shared components and
state/reducer code are separated under `front-end/js/`.

The browser stores fictional demo state under
`school-management-demo-v1`. Incompatible or invalid saved data falls back to
seed records and surfaces a notification. “Reset Demo Data” restores the
seeded demonstration state after confirmation. No API, database or external
runtime service is required.

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

- **In scope:** responsive screens and cross-role workflows backed by local
  demonstration data.
- **Not in scope:** real authentication, authorization, server APIs,
  persistence across devices, production data, or deployment infrastructure.
- Do not put credentials or real personal information in the demo data.

## Success criteria

- All five roles can reach their permitted screens and use the shared demo
  data.
- Supply, procurement and transportation workflows enforce their stock,
  approval, supplier, delivery and route-capacity rules.
- Saved state survives reload; invalid saved state can recover to seed data;
  reset restores the seed state.
- The UI works at common desktop and mobile widths without horizontal page
  overflow.
- Focused tests, the complete test suite and the production build pass; key
  workflows are verified in a browser without runtime errors.
