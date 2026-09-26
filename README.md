# HireFlow — ATS (Node.js + Express + SQLite + Hardcoded-Login)

An applicant-tracking system with two portals — **HR** and **Candidate** —
backed by **SQLite** and a simple **hardcoded username/password login**
(no Firebase, no OAuth, no cloud database). `npm install` in both folders and
it just works.

---

## Demo Login Credentials (hardcoded)

There is **no signup screen**. Two fixed accounts are seeded into the
database the moment the backend starts, using the values in `backend/.env`:

| Portal     | Username    | Password        |
|------------|-------------|-----------------|
| HR         | `hr`        | `hr123`         |
| Candidate  | `candidate` | `candidate123`  |

These are the defaults from `backend/.env.example`. The login screen also has
**"HR demo"** and **"Candidate demo"** buttons that auto-fill them, so you can
sign in with two clicks.

> To change them, edit `HR_USERNAME` / `HR_PASSWORD` / `CANDIDATE_USERNAME` /
> `CANDIDATE_PASSWORD` in `backend/.env` and restart the backend.

---

## Requirements

- **Node.js 18+** and npm (Node 20 LTS recommended)
- No database server, no Docker, no cloud account needed — SQLite is a local file

> **Windows note:** `better-sqlite3` ships prebuilt binaries for common Node
> versions, so `npm install` normally needs no compiler. If it does try to
> build from source, install the free **Visual Studio Build Tools** ("Desktop
> development with C++").

---

## How to Start

### Option A — one command from the project root (recommended)

Runs the backend and frontend together with `concurrently`:

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** and sign in with one of the demo accounts
above.

You can also run them individually:

```bash
npm run dev:backend     # only the API  (http://localhost:4000)
npm run dev:frontend    # only the web  (http://localhost:5173)
```

### Option B — run the two apps in separate terminals

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

Expected output:

```
SQLite database ready at .../backend/data/hireflow.sqlite
HireFlow API listening on port 4000
```

**2. Frontend** (in a second terminal)

```bash
cd frontend/hireflow-web
npm install
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm run dev
```

Open **http://localhost:5173**, click **"HR demo"** or **"Candidate demo"**,
then **Sign in**.

### Production build (frontend)

```bash
cd frontend/hireflow-web
npm run build      # outputs to frontend/hireflow-web/dist
npm run preview    # serve the built app locally
```

The backend has no build step — run it with `npm start` (`node server.js`).

---

## First-Run Walkthrough

1. **HR:** sign in → create a vacancy (`Create vacancy` / `POST /api/jobs`),
   defining a JD plus required/optional skills.
2. **Candidate:** open a separate browser/incognito tab → sign in → build a
   profile → see matching open roles → apply.
3. **HR:** the ranked candidate appears in `CandidateRankTable` /
   `PipelineBoard`. Move them through stages (✓/✕).
4. **Candidate:** the tracker immediately reflects the updated status.

---

## Environment Variables

Both `.env` files are already created in this repo. Copy them from the
`.env.example` files if they are missing.

### `backend/.env`

| Variable             | Default                        | Purpose                                      |
|----------------------|--------------------------------|----------------------------------------------|
| `SQLITE_DB_PATH`     | `./data/hireflow.sqlite`       | SQLite file path (auto-created, relative to `backend/`) |
| `PORT`               | `4000`                         | Express server port                          |
| `FRONTEND_URL`       | `http://localhost:5173`        | Allowed CORS origin                          |
| `HR_USERNAME`        | `hr`                           | HR login username                            |
| `HR_PASSWORD`        | `hr123`                        | HR login password                            |
| `CANDIDATE_USERNAME` | `candidate`                    | Candidate login username                     |
| `CANDIDATE_PASSWORD` | `candidate123`                 | Candidate login password                     |
| `JWT_SECRET`         | `change-this-to-a-long-random-string` | Signs login session tokens            |

### `frontend/hireflow-web/.env`

| Variable       | Default                       | Purpose              |
|----------------|-------------------------------|----------------------|
| `VITE_API_URL` | `http://localhost:4000/api`   | Backend API base URL |

> If you change `PORT`, update `VITE_API_URL` and `FRONTEND_URL` to match.

---

## The Database

The SQLite file is created automatically on first run at
`backend/data/hireflow.sqlite`. To reset everything during development:

1. Stop the backend.
2. Delete `backend/data/hireflow.sqlite` (and any `-wal` / `-shm` files).
3. Run `npm run dev` again — a fresh DB with the two seeded accounts is created.

To browse it visually, use [DB Browser for SQLite](https://sqlitebrowser.org/).

---

## How the Login Works

- `POST /api/auth/login` checks the submitted username/password against the
  two env-configured pairs (`backend/src/config/auth.js`).
- On success it signs a **JWT** (`JWT_SECRET`, 7-day expiry) encoding the
  user's id and role, and returns it.
- The frontend stores the JWT in `localStorage` and sends it as
  `Authorization: Bearer <token>` on every request
  (`frontend/hireflow-web/src/api/client.js`).
- Each account has one **fixed role** — `hr` is always HR, `candidate` is
  always Candidate. There is no signup and no role picker.
- Downstream routes only ever see `req.user = { id, username, role }`.

**Local/dev only:** passwords are compared as plain strings against `.env`
values, not hashed. If you deploy this for real, replace
`backend/src/config/auth.js` with hashed credentials or a real identity
provider — nothing downstream of `req.user` needs to change.

---

## Project Layout

```
HireFlow/
├─ package.json                 root scripts (runs both apps with concurrently)
├─ backend/
│  ├─ server.js                 Express app + route wiring
│  ├─ .env / .env.example
│  └─ src/
│     ├─ config/db.js           SQLite connection, schema, migrations, seeds the 2 users
│     ├─ config/auth.js         hardcoded credential check + JWT sign/verify
│     ├─ middleware/auth.js     verifies the JWT, loads the User row
│     ├─ models/                User, Candidate, JobRequisition, JobApplication,
│     │                         HiringManager, Referral (plain SQL, no ORM)
│     ├─ services/              matchingService, resumeKeywordService, resumeTextExtractor
│     ├─ controllers/           request handlers
│     └─ routes/                URL → controller wiring
└─ frontend/hireflow-web/
   ├─ .env / .env.example
   └─ src/
      ├─ api/client.js          attaches the JWT from localStorage to every request
      ├─ store/                 auth, job, candidate, pipeline, manager, referral, toast
      ├─ router/index.js        role-guarded routes
      ├─ views/                 LoginView + HR/Candidate views
      └─ components/            CreateVacancy, CandidateRankTable, PipelineBoard, KpiDashboard, ...
```

---

## API Endpoints (all under `/api`)

| Area         | Routes                                                        |
|--------------|---------------------------------------------------------------|
| Auth         | `POST /auth/login`, `GET /auth/me`                            |
| Jobs         | `/jobs` (vacancies)                                           |
| Candidates   | `/candidates` (profile, resume upload/parse)                  |
| Applications | `/applications` (apply, list, `PUT /applications/:id/stage`)  |
| Managers     | `/managers` (hiring managers)                                 |
| Referrals    | `/referrals`                                                  |
| Health       | `GET /health` → `{ "status": "ok" }`                          |

---

## How Matching & the HR Pipeline Work

- **`matchingService.computeScore`** — required skills weigh 2×, optional
  skills 1×, returning a 0–100 score. Computed once when a candidate applies
  and stored on the `job_applications` row, which is what `CandidateRankTable`
  and `PipelineBoard` read.
- **HR's "Create vacancy"** (`CreateVacancy.vue` → `POST /api/jobs`) defines
  the JD plus required/optional weighted skills that scoring compares against.
- **`PipelineBoard`** groups ranked candidates by stage (kanban);
  **`CandidateRankTable`**'s ✓/✕ buttons call
  `PUT /api/applications/:id/stage`. Both reload after a stage change so they
  never go stale.
- **KPIs** (`KpiDashboard`) are computed live from `job_applications`: open
  roles, candidates in pipeline (not hired/rejected), average days
  applied → hired, and offers this calendar month.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `HR_PASSWORD is not set` / startup error | `backend/.env` is missing — copy `backend/.env.example` to `backend/.env`. |
| CORS error / requests fail in browser | Make sure `FRONTEND_URL` (`backend/.env`) and the URL you open the frontend at match. |
| `EADDRINUSE` on port 4000 | Another process uses the port — change `PORT` in `backend/.env` and update `VITE_API_URL`. |
| `better-sqlite3` install build error | Install Visual Studio Build Tools (C++) or use a Node LTS version with a prebuilt binary. |
| Login always fails | Confirm the credentials match `HR_*` / `CANDIDATE_*` in `backend/.env` and that you restarted the backend after editing. |
| Want a clean slate | Stop the backend and delete `backend/data/hireflow.sqlite`. |
