# Historical Plan: School Management Front-End MVP

Source specification: [SPEC.md](../SPEC.md)
Task checklist: [tasks/todo.md](./todo.md)

## Overview

This plan records the earlier browser-only MVP implementation. Its original
workflow and persistence decisions have since been replaced by the API
boundary described in [SPEC-frontend-api-boundary.md](../SPEC-frontend-api-boundary.md).
The current screens display fictional sample data and send actions to the
selected API adapter.

## Architecture

- React 19 renders the application; React Router DOM 7 owns path-based
  navigation and role guards.
- Context loads school data through the API client and holds temporary UI
  state.
- The mock adapter returns read-only sample data. It does not simulate school
  business rules or save actions.
- The HTTP adapter sends requests to `GET /api/school-data` and
  `POST /api/actions`.
- Seed records, screens, layout and reusable controls remain in separate
  modules under `front-end/js/`.
- Vitest/jsdom tests cover API requests, route behavior and rendered screens.

## Completed delivery phases

### 1. Application foundation

- [x] Replace vanilla rendering with a React entry point and component tree.
- [x] Add path routes, role-specific navigation, access selection and guards.
- [x] Add seeded demo actors and shared Context/reducer state.
- [x] Persist and recover demo state through browser storage.

### 2. School, inventory and supply workflows

- [x] Add school-record views and dashboards for the five demonstration
  roles.
- [x] Add inventory items, stock movements and department requests.
- [x] Add teacher request submission and receipt review.
- [x] Validate and atomically fulfill requests against available stock.

### 3. Procurement workflows

- [x] Add purchase requests, principal decisions and consultation
  authorization.
- [x] Add supplier offer submission and principal offer selection.
- [x] Add purchase orders and delivery recording that updates stock.

### 4. Transportation workflows

- [x] Add transport-request review, vehicle and route management, and
  capacity-aware route approval.
- [x] Add driver route, journey and report workflows.
- [x] Add principal review and resolution of driver reports.

### 5. Verification and documentation

- [x] Add focused tests for routes, persistence, workflows, multi-select
  forms, row actions and driver-to-route journey association.
- [x] Exercise supply, procurement and transportation scenarios in a browser.
- [x] Align the project specification and task checklist with the delivered
  MVP.
- [x] Run the test suite, production build and diff whitespace check.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| A role can view another role's route | Guard routes and verify direct navigation behavior |
| Shared records become inconsistent across workflows | Centralize transitions in the reducer and test cross-feature outcomes |
| Invalid browser storage prevents the app from opening | Recover to seeded data and surface a notification |
| UI controls overlap or fail at smaller widths | Use responsive CSS and verify in the browser |
| Form or table interactions behave differently at runtime | Exercise critical flows in a browser in addition to jsdom tests |

## Completion

The original MVP plan is retained as history. Current scope and behavior are
defined in [SPEC.md](../SPEC.md); the API boundary is described in
[SPEC-frontend-api-boundary.md](../SPEC-frontend-api-boundary.md).
