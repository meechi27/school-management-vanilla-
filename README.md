# School Management Learning Project

This is a small university project for learning how a React app works. It
simulates a school office with fictional data. It is a demo, not a real school
system: choosing a role changes the demo view, but it does not sign you in or
protect real data.

## Start the app

Open a terminal in `front-end/`, then run:

```bash
npm install
npm run dev
```

Open the address printed by Vite. The site root (`/`) takes you to the role
chooser at `/access`. Pick one of the five demo roles to open its dashboard.

## Choose the data source

The app uses fictional sample data by default. Forms send requests, but the
mock API does not save them or change the sample records.

To connect a backend that follows the API contract, set these Vite variables:

```text
VITE_API_MODE=http
VITE_API_BASE_URL=http://localhost:3000/api
```

The base URL defaults to `/api`, so it can be left out when the backend shares
the app's origin.

## Find your way around

| If you want to... | Start here |
|---|---|
| See how the app starts | [`main.jsx`](./front-end/js/main.jsx) |
| See the pages and URLs | [`routes.jsx`](./front-end/js/app/routes.jsx) |
| Change a page | `front-end/js/features/` |
| Change shared buttons, tables, or dialogs | `front-end/js/components/ui/` |
| See how pages get data and send actions | [`AppContext.jsx`](./front-end/js/context/AppContext.jsx) |
| See the API requests | [`index.js`](./front-end/js/api/index.js) |
| See the temporary sample-data response | [`mockApi.js`](./front-end/js/api/mockApi.js) and [`seed-data.js`](./front-end/js/data/seed-data.js) |
| Check API and page behavior | `front-end/tests/` |

You do not need to understand every folder before making a small change. Start
with the page that shows the feature you want to change, then follow the API
call it makes.

## Follow one example: sending a supply request

1. A teacher opens `/teacher/requests`. The page is
   [`SupplyRequestsPage.jsx`](./front-end/js/features/supply/SupplyRequestsPage.jsx).
2. The page sends the entered fields as a `CREATE_SUPPLY_REQUEST` action.
3. [`AppContext.jsx`](./front-end/js/context/AppContext.jsx) sends that action
   through [`index.js`](./front-end/js/api/index.js).
4. Mock mode explains that it cannot save the request. HTTP mode sends the
   request to `POST /api/actions`.

The browser displays school data; it does not approve requests, change stock,
or create records. Those rules belong on the backend. Mock data is read-only,
so a page refresh always shows the original examples.

## A few words used in the code

- **Page**: one screen, such as the teacher's supply requests.
- **API**: the boundary pages use to load data and send user actions.
- **Action**: a named request for the backend to handle, such as
  `FULFILL_SUPPLY_REQUEST`.
- **Mock data**: example records returned by the local mock API.
- **HTTP mode**: sends requests to a backend instead of the mock API.

## Make a first small change

1. Find the page in `front-end/js/features/` that displays the text or control
   you want to change.
2. Change that page, keeping the change small.
3. If you change behavior or data, find the related test in
   `front-end/tests/` and add or update an example for the expected result.
4. From `front-end/`, run the focused test file, for example:

   ```bash
   npm test -- tests/api.test.js
   ```

5. Before sharing your work, run all tests and make a production build:

   ```bash
   npm test
   npm run build
   ```

If you're unsure which file to start with, follow the supply-request example
above. It shows the path from a page to the API boundary.
