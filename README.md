# Mortgage CRM

Multi-tenant mortgage document CRM: extract fields from bank lending packages (PDF / Word / images), review against a workspace master schema, and auto-fill PDF legal forms.

Built for reducing manual data entry on bank instruction packages (e.g. RBC & BMO workflows), with organization/workspace tenancy, role-based access, Stripe billing, and a platform Super Admin console.

---

## What's in this repo

| Path | Purpose |
|------|---------|
| `client/` | React + TypeScript SPA (Vite) |
| `server/` | Express + MongoDB API |
| `docs/` | User manual and project status notes |

There is **no root `package.json`**. Install and run from `client/` and `server/` separately.

---

## Tech stack

### Frontend (`client/`)
- React 18, TypeScript, Vite 6
- Redux Toolkit, React Router 7
- Tailwind CSS, Axios, Recharts
- PDF viewing: `react-pdf` / `pdfjs-dist`

### Backend (`server/`)
- Node.js, Express, Mongoose (**MongoDB**)
- Auth: JWT, bcrypt, email OTP (Nodemailer + EJS)
- Files: **AWS S3**
- OCR: **Tesseract.js**, running inside the API process
- Extraction / assistant LLM: **OpenAI** (optional **AWS Bedrock** fallback, unused while `LLM_PROVIDER=openai`)
- Document helpers: pdf-lib, pdf-parse, mammoth, xlsx, sharp
- Billing: **Stripe**
- Process manager (prod option): PM2 (`ecosystem.config.js`)

API base path: `/backend/api`  
Health check: `GET /healthz`

---

## Product capabilities (what the app actually has)

### Authentication
- Login, register, email OTP verification, forgot-password reset
- Logout from the user menu

### Onboarding
- Create organization → choose plan / Stripe checkout → create first workspace

### Workspace modules (sidebar)
| Module | What it does |
|--------|----------------|
| **Dashboard** | Processing metrics, charts, recent activity |
| **Clients** | Client files with a 4-step flow: Legal name → Documents (upload + extract) → Review fields → Generate filled PDF; optional document assistant |
| **Master Fields Schema** | Configurable field dictionary used by extraction, review, and templates (add/edit, bulk upload, optional seed defaults) |
| **Templates** | Upload blank PDFs; place master fields in the designer; generate filled PDFs from client data |
| **Leads** | Capture prospects; bulk upload; move lead(s) to Clients |
| **Users** | Read-only workspace members (manage invites/roles in org settings) |

### Organization settings
- **Organization** — company profile / branding  
- **Workspaces** — list, open, create (plan limits apply)  
- **Users** — invite, org roles, workspace access  
- **Billing** — subscription, usage vs entitlements, plan changes, Stripe portal  
- **Roles** — custom org & workspace roles and permissions  

### Public
- `/pricing` — visible active plans

### Super Admin (`/super-admin`)
- Platform dashboard, users, organizations, workspaces, subscriptions, plans, profile  
- Only users with system role `superAdmin`

### Core document pipeline
1. Define **Master Fields Schema** in the workspace  
2. Design **Templates** (field placements on PDF)  
3. Create a **Client** → identity (CNIC / manual name) → upload docs → **Extract** → **Review** → **Generate**  
4. Optionally ask the **document assistant** about uploaded files  

Extraction needs a non-empty master schema. Empty schema → failed / empty extraction.

---

## Prerequisites

- **Node.js** 18+ (server Docker image uses Node 20)
- **MongoDB** reachable via `MONGO_URI`
- **AWS S3** bucket for file storage (access keys in the environment; Render has no IAM role)
- **SMTP** for verification / password emails
- **OpenAI** API key (or Bedrock) for extraction / assistant
- **Stripe** keys for billing (optional locally until you test checkout)

---

## Local setup

### 1. Server

```bash
cd server
npm install
```

Create `server/.env` (see [Environment variables](#environment-variables)).

```bash
npm run dev
# or auto-restart on src changes:
npm run dev:watch
```

Default API: `http://localhost:3000`  
Routes: `http://localhost:3000/backend/api/...`

On every successful start (after Mongo connects), the server:

1. Normalizes legacy system roles  
2. Seeds a **Super Admin** if none exists  
3. Seeds the **Standard** plan if `code: "standard"` is missing  

### 2. Client

```bash
cd client
npm install
```

Create `client/.env` (or `.env.local`):

```env
VITE_SERVER_URL=http://localhost:3000/backend/api
```

```bash
npm run dev
```

App: `http://localhost:5173`  
Set `FRONTEND_URL` on the server to include that origin (comma-separated if multiple).

### 3. Stripe webhooks (billing)

Forward events to:

```text
http://localhost:3000/backend/api/billing/webhook/stripe
```

(Use Stripe CLI or your usual local tunnel.)

---

## Default seed credentials

| Item | Default |
|------|---------|
| Super admin email | `admin@example.com` |
| Super admin password | `Password@123` |
| Plan | **Standard** (`code: standard`) with Stripe price IDs and entitlements from `server/src/seeders/plan.seeder.js` |

Overrides (optional): `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_FULL_NAME`.

In **production**, seeding a super admin requires `SUPER_ADMIN_PASSWORD` to be set (no silent default).

Master fields are **not** auto-seeded on startup. Use the UI action / API (`POST .../master-fields/seed-defaults`) when you want the starter schema.

---

## Environment variables

Configured and validated in `server/src/config/env.config.js`.

### Required (server)

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `SMTP_HOST` | SMTP host |
| `SMTP_PORT` | SMTP port |
| `EMAIL_USER` | SMTP user |
| `EMAIL_PASS` | SMTP password |
| `FRONTEND_URL` | Allowed CORS origin(s), e.g. `http://localhost:5173` |
| `AWS_REGION` | AWS region |
| `S3_BUCKET_NAME` | Document / asset bucket |

### Common optional (server)

| Variable | Notes |
|----------|--------|
| `PORT` | Default `3000` |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Required on Render for S3 |
| `S3_SIGNED_URL_EXPIRES` | Signed URL TTL (default 3600) |
| `LLM_PROVIDER` | `openai` (default) or `bedrock` |
| `LLM_FALLBACK_PROVIDER` | Optional fallback provider |
| `OPENAI_API_KEY` | Required for OpenAI extraction/assistant |
| `OPENAI_MODEL` / `OPENAI_EXTRACTION_MODEL` / `OPENAI_ASSISTANT_MODEL` / `OPENAI_EMBEDDING_MODEL` | Model overrides |
| `BEDROCK_*` | Only used when `LLM_PROVIDER=bedrock` |
| `RAG_*` | Chunking / retrieval for document assistant |
| `STRIPE_SECRET_KEY` | Stripe secret |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `STRIPE_SUCCESS_URL` / `STRIPE_CANCEL_URL` | Checkout return URLs |

### Client

| Variable | Purpose |
|----------|---------|
| `VITE_SERVER_URL` | Full API base, e.g. `http://localhost:3000/backend/api` |

---

## npm scripts

### Server (`server/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API in development |
| `npm run dev:watch` | Dev with Node `--watch` on `./src` |
| `npm start` / `npm run prod` | Production Node process |
| `npm run build` | Start via PM2 (`ecosystem.config.js`) |
| `npm run reset:fresh` | **Destructive** wipe — see below |

### Client (`client/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

### Docs (`docs/`)

| Script | Description |
|--------|-------------|
| `npm run pdf` | Build `user-manual.pdf` from `user-manual.html` (Chrome/Edge headless) |
| `npm run placeholders` | Regenerate screenshot placeholder PNGs |

---

## Fresh reset (dangerous)

`server/scripts/reset-fresh.js` drops the **MongoDB database** and empties the **entire S3 bucket**.

```bash
cd server
npm run reset:fresh
```

In production you must also set `RESET_CONFIRM=YES`.

After reset, restart the API so Super Admin + Standard plan are seeded again. Then register a normal user, complete onboarding, and set up master fields / templates in the workspace.

---

## User manual

- Source: `docs/user-manual.html`
- Screenshots: `docs/screenshots/*.png` (see `docs/screenshots/README.md`)
- PDF: `docs/user-manual.pdf`
- **Showcase / LinkedIn / resume / interview copy:** [`docs/PROJECT_PRESENTATION.md`](docs/PROJECT_PRESENTATION.md)

Regenerate PDF after updating HTML or screenshots:

```bash
cd docs
npm run pdf
```

---

## Typical first-run workflow

1. Start MongoDB, configure `server/.env`, run `npm run dev` in `server/`  
2. Start client with `VITE_SERVER_URL` pointing at the API  
3. Sign in as Super Admin (or register a user and onboard)  
4. Ensure **Standard** plan exists (auto-seeded) and complete Stripe checkout if required  
5. In the workspace: **Master Fields Schema** → **Templates** (designer) → **Clients** (legal name → docs → extract → review → generate)  
6. Invite teammates under Organization Settings → Users / Roles  

---

## Roles & access (summary)

| Layer | Examples |
|-------|----------|
| System | `superAdmin`, `user` |
| Organization | Owner / Admin / Member / Viewer (+ custom roles) |
| Workspace | Custom roles with permissions (`dashboard`, `submissions`, `masterfields`, `templates`, `leads`, `users`, etc.) |

Sidebar entries and settings pages are permission-gated. Org owners typically bypass workspace permission checks for their org.

---

## Deployment

Production runs on **Render**.

| Service | Render | Plan |
|---------|--------|------|
| API | Web Service `mortgage-crm-api` (`https://mortgage-crm-api.onrender.com`) | Node, $7/month (0.5 CPU, 512 MB) |
| Frontend | Static site `mortgage-crm` (`https://mortgage-crm-2bhy.onrender.com`) | Free |

Deploys come from GitHub. The API build is `npm install` and `npm start` in `server/`. OCR is Tesseract.js inside that Node process, so the service does not need a system Tesseract package. S3 is still required for files.

Set `VITE_SERVER_URL` for the static site to `https://mortgage-crm-api.onrender.com/backend/api`.

Before the first boot, the API environment needs Mongo, SMTP, S3 (`AWS_REGION`, `S3_BUCKET_NAME`, access keys), OpenAI, Stripe, `FRONTEND_URL`, and `SUPER_ADMIN_PASSWORD`.

`server/Dockerfile` and `client/Dockerfile` are optional local images. `server/ecosystem.config.js` is an optional PM2 start. They are not how production is hosted.

---

## Project layout (API / app)

```text
server/src/
  bin/www.js          # connect Mongo, seeders, listen
  app.js              # Express app, /backend/api, /healthz
  routes/             # HTTP routes
  controllers/
  services/           # business logic, storage, extraction, billing, …
  models/
  seeders/            # superAdmin, plan, masterFields (on-demand)
  billing/            # entitlements, Stripe helpers
  authz/              # permission checks
  config/             # env, mongo, llm, …

client/src/
  App.tsx             # routes (auth, org, workspace, super-admin)
  components/         # pages & UI by module
  service/            # API clients
  context/            # auth, permissions
  …
```

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| Config validation error on start | Missing required env vars in `server/.env` |
| CORS / API blocked from browser | `FRONTEND_URL` includes the Vite origin; `VITE_SERVER_URL` ends with `/backend/api` |
| Empty / failed extraction | Create Master Fields Schema first |
| Legal name empty | Client step 1: upload ID or enter name manually |
| Cannot create workspace / client | Plan entitlements — Organization Settings → Billing |
| Generate has no templates | Create a template and save field placements |
| Menu / button missing | Role lacks permission — ask an org admin |

---

## License

ISC (see `server/package.json`).
