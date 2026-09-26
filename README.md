# HireFlow — Node.js + SQLite + Hardcoded-Login edition

This version replaces MongoDB Atlas with **SQLite** and replaces **Firebase
Auth** with a simple hardcoded username/password login for each portal. No
cloud database account, no Firebase project, no service account JSON, no
external auth provider of any kind. `npm install` in both folders and it
just works.

## What's different from the Firebase version

| | Firebase version | This version |
|---|---|---|
| Database | SQLite (already local) | SQLite (unchanged) |
| Login | Google sign-in / phone OTP via Firebase | **Fixed username + password for HR, fixed username + password for Candidate** — set in `backend/.env` |
| Session | Firebase ID token, verified via Firebase Admin SDK | Plain **JWT**, signed and verified with a local secret (`JWT_SECRET`) |
| Roles | Chosen once at signup, stored per Firebase account, conflict screen if reused | **Fixed per account** — the `hr` account is always HR, the `candidate` account is always Candidate |
| Setup | Needed a Firebase project + web app config + service account JSON | Needed: nothing external. Two `.env` files with plain values |

## The database

Unchanged. The SQLite file is created automatically the first time you run
the backend, at `backend/data/hireflow.sqlite`. To reset the whole database
during development, stop the server and delete that file; a fresh empty one
(with the two seeded accounts) is recreated on the next `npm run dev`.

If you want to look inside it directly, the
[DB Browser for SQLite](https://sqlitebrowser.org/) app lets you open the
`.sqlite` file and browse tables visually.

## The login flow, now hardcoded

There is no signup screen and no external identity provider. Two accounts
are seeded straight into the `users` table the moment the backend starts:

- **HR account** — username/password from `HR_USERNAME` / `HR_PASSWORD` in `backend/.env` (default: `hr` / `hr123`)
- **Candidate account** — username/password from `CANDIDATE_USERNAME` / `CANDIDATE_PASSWORD` in `backend/.env` (default: `candidate` / `candidate123`)

`POST /api/auth/login` checks the submitted username/password against those
two env-configured pairs. If it matches, the backend signs a JWT (using
`JWT_SECRET`) that encodes the user's id and role, and hands it back. The
frontend stores that JWT in `localStorage` and attaches it as
`Authorization: Bearer <token>` on every subsequent API call — every route
downstream (jobs, candidates, applications) only ever sees
`req.user = { id, username, role }` and doesn't know or care how that user
authenticated.

The login screen (`LoginView.vue`) is a plain username/password form, plus
two "demo" buttons that auto-fill the default credentials above so you don't
have to remember them while testing. Each account maps to exactly one fixed
role permanently — that's still the real-world ATS boundary from before, it's
just no longer something a user chooses at signup, since there is no signup.

**To change the credentials:** edit `HR_USERNAME` / `HR_PASSWORD` /
`CANDIDATE_USERNAME` / `CANDIDATE_PASSWORD` in `backend/.env` and restart the
backend. If you also change the username, that account's row is upserted
under the new username on next startup (its role stays what you set it to).

**This is a local/dev auth setup, not production-grade.** Passwords are
compared as plain strings against `.env` values rather than hashed and
stored — that's a deliberate simplification since there are only ever two
fixed accounts and no signup flow. If you ever deploy this somewhere real,
swap `backend/src/config/auth.js` for proper hashed credentials or a real
identity provider; nothing downstream of `req.user` needs to change.

## Project layout

```
hireflow-node/
├─ backend/
│  ├─ server.js
│  ├─ src/
│  │  ├─ config/db.js            SQLite connection + schema creation + seeds the 2 fixed users
│  │  ├─ config/auth.js          hardcoded credential check + JWT sign/verify
│  │  ├─ middleware/auth.js      verifies the JWT, loads the User row
│  │  ├─ models/                 User, Candidate, JobRequisition, JobApplication
│  │  │                           - plain functions wrapping SQL, no ORM
│  │  ├─ services/                matchingService, resumeKeywordService, resumeTextExtractor
│  │  ├─ controllers/            request handlers (authController now has login + getMe)
│  │  └─ routes/                  URL → controller wiring
│  └─ .env.example
└─ frontend/hireflow-web/
   └─ src/
      ├─ api/client.js            attaches the JWT from localStorage to every request
      ├─ store/auth.js             logged-in user + login()/logout()/init()
      ├─ views/LoginView.vue       username/password form + demo-fill buttons
      └─ ...                        (ProfileCard, CreateVacancy, CandidateRankTable, etc. — unchanged)
```

## Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
```
The defaults in `.env.example` already work out of the box
(`hr`/`hr123` and `candidate`/`candidate123`) — change them if you want
different credentials. Leave `SQLITE_DB_PATH` as-is unless you want the
database file somewhere else.

```bash
npm run dev
```
You should see `SQLite database ready at .../backend/data/hireflow.sqlite`
and `HireFlow API listening on port 4000`.

### 2. Frontend
```bash
cd frontend/hireflow-web
npm install
cp .env.example .env
```
The default `VITE_API_URL=http://localhost:4000/api` matches the backend
above — no other values needed.

```bash
npm run dev
```

Open the app, and on the login screen click **"HR demo"** or
**"Candidate demo"** to auto-fill the matching credentials, then **Sign in**.

### Or run both together from the root
```bash
npm install
npm run dev
```

## How the matching engine and HR pipeline work

Unchanged from before — none of this logic ever depended on auth or which
database was underneath it:

- **`matchingService.computeScore`** — required skills count 2x weight,
  optional skills count 1x, returns a 0–100 score. Computed once, at the
  moment a candidate applies, and stored on the `job_applications` row —
  that stored value is what both `CandidateRankTable` and `PipelineBoard`
  read from.
- **HR's "Create vacancy"** (`CreateVacancy.vue` → `POST /api/jobs`) defines
  a JD plus a list of skill requirements, each marked required/optional with
  a weight — that list is what the scoring above compares candidates against.
- **`PipelineBoard`** groups the same ranked-candidates data by stage into a
  kanban view; **`CandidateRankTable`**'s ✓/✕ buttons call
  `PUT /api/applications/:id/stage` to move a candidate forward or reject
  them, and both components reload after any stage change so they never go
  stale relative to each other.
- **KPIs** (`KpiDashboard`) are computed live from the same
  `job_applications` table: open roles, candidates currently in the pipeline
  (not yet hired or rejected), average days from applied → hired, and offers
  extended this calendar month.

## Verified working end-to-end

The full loop was tested directly against the running backend: bad login is
rejected → HR logs in → HR creates a vacancy → candidate logs in (separate
account, separate browser session/tab) → candidate builds a profile → gets
matched and ranked against open roles → applies → HR sees the ranked
candidate in `CandidateRankTable`/`PipelineBoard` → HR advances the stage →
candidate immediately sees the updated status in their tracker → KPIs
reflect the change. The frontend also builds cleanly with `vite build`.
