# School Management Learning Project

This is a small university project for learning how a React app works. It
simulates a school office with fictional data. It is a demo, not a real school
system: choosing a role changes the demo view, but it does not sign you in or
protect real data.

## Start the app

Start the backend first. In terminal 1, run:

```bash
cd backend
npm install
npm run dev
```

In terminal 2, start the front end:

```bash
cd front-end
npm install
npm run dev
```

Open the address printed by Vite. The site root (`/`) opens the login page.
Use any demo account below. All demo accounts use the same password:
`schooldemo123`.

| Demo role | Email |
|---|---|
| School Principal | `amira.benali@example.test` |
| Inventory Manager | `yacine.haddad@example.test` |
| Teacher / Department | `nadia.karim@example.test` |
| External Supplier | `supplier@example.test` |
| Driver | `samir.bensaid@example.test` |

The front end sends `/api` requests to the Express server through Vite's
development proxy. Keep both terminals running while using the app.

## Where the data lives

All school records are hardcoded in
[`schoolData.js`](./backend/data/schoolData.js). Express returns those records
to the front end. There is no database. Restarting the backend resets the
sample records.

## Find your way around

| If you want to... | Start here |
|---|---|
| See how the app starts | [`main.jsx`](./front-end/js/main.jsx) |
| See the pages and URLs | [`routes.jsx`](./front-end/js/app/routes.jsx) |
| Change a page | `front-end/js/features/` |
| Change shared buttons, tables, or dialogs | `front-end/js/components/ui/` |
| See how pages get data and send actions | [`AppContext.jsx`](./front-end/js/context/AppContext.jsx) |
| See the API requests | [`index.js`](./front-end/js/api/index.js) |
| See the Express routes | [`app.js`](./backend/app.js) |
| Change the sample school records | [`schoolData.js`](./backend/data/schoolData.js) |
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
4. The Express route receives it at `POST /api/actions`.

The API currently returns a clear “not implemented” response for actions.
That means it does not pretend a request was saved. School rules and record
updates can be added to the backend later; they must not be added to a page.

## API routes

- `GET /api/auth/session` checks whether a user is signed in.
- `POST /api/auth/login` starts a demo login session.
- `POST /api/auth/logout` ends the current session.
- `GET /api/school-data` returns the hardcoded school records to a signed-in
  user.
- `POST /api/actions` receives a user action. It currently returns
  `501 ACTION_NOT_IMPLEMENTED`.

This login exists only to teach the request flow. Accounts and passwords are
shared demo credentials, sessions live in server memory, and every signed-in
account can read the sample dataset. Do not use this authentication setup or
fictional records as a production security model.

The backend tests run from `backend/` with `npm test`. The front-end tests run
from `front-end/` with `npm test`.

## A few words used in the code

- **Page**: one screen, such as the teacher's supply requests.
- **API**: the boundary pages use to load data and send user actions.
- **Action**: a named request for the backend to handle, such as
  `FULFILL_SUPPLY_REQUEST`.
- **Express**: the small Node.js library that receives the API requests.
- **In-memory data**: records held by the backend while it is running; there
  is no database yet.

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

5. Before sharing your work, run both test suites and make a production build:

   ```bash
   cd backend
   npm test
   cd ../front-end
   npm test
   npm run build
   ```

If you're unsure which file to start with, follow the supply-request example
above. It shows the path from a page to the API boundary.
