# HeimDall

> A role-based company workspace where employees, managers, HR and executives manage tasks, projects, leave and contracts with an assistant grounded in their own data.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://heimdall-hazel.vercel.app/)
[![Repo](https://img.shields.io/badge/GitHub-Repo-black?style=for-the-badge&logo=github)](https://github.com/Sumit10Sinha/HeimDall)

---

## Preview

| Desktop | Mobile |
|---|---|
| <img src="assets/Laptop%20Light%20Mode.png" width="420" alt="Desktop"> | <img src="assets/Phone%20Light%20Mode.jpeg" width="200" alt="Mobile"> |

---

## What It Does

Teams lose time chasing status across chats, sheets and documents. HeimDall puts tasks, projects, leave requests and company risk in one signed-in workspace. Each person sees only what their role allows: employees manage their own work, managers see the whole team, HR runs people operations, and executives see company-wide risk and revenue.

## Features

- **Sign in with Google or GitHub**, with sessions that persist across refreshes.
- **Role-based dashboards** for Employee, Manager, HR and Executive, scoped on the server.
- **Task CRUD**: add, update status, edit and delete your own tasks, with optimistic updates and rollback.
- **Leave management**: request, cancel while pending, and HR approve or decline.
- **Live manager workload chart** that recalculates from the database.
- **Executive overview** with a risk score, revenue chart and contract alerts computed from data.
- **HR directory** with live search and an empty state.
- **Light and dark mode** with smooth transitions, loading states on every async action and designed empty states.

## Planning Docs

- [PRD](./HeimDall_PRD.md)
- [Requirements](./HeimDall_Requirements.md)
- [Architecture](./Architecture.md)
- [API Spec](./HeimDall_API_Spec.md)
- [Roadmap](./HeimDall_Roadmap.md)

**Deviations from the plan:** the AI assistant answers from workspace data with keyword matching instead of calling a language model. Contract upload and clause analysis are designed but not built.

---

## Architecture

```
Browser ──> Next.js on Vercel ──┬─ /app pages and components (React)
                                ├─ /app/api REST routes ── lib/guard.ts (session + role checks)
                                └─ Prisma ──> Neon Postgres
Auth.js (Google, GitHub) ── JWT session cookie ── middleware.ts protects /workspace
```

The client loads `/api/bootstrap`, which returns only the data the signed-in user's role may see. Mutations call REST routes that re-check the session and role on the server, validate the input, write through Prisma, then the client refetches.

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Pages and API routes in one deployable app |
| Database | Neon PostgreSQL + Prisma | Relational data, typed queries, migrations |
| Auth | Auth.js v5 (Google, GitHub) | Secure session cookies, OAuth |
| Styling | Tailwind CSS v4 | Consistent design tokens, light and dark themes |
| Deployment | Vercel | Native Next.js hosting |

## Database Schema

| Table | Key columns | Relations |
|---|---|---|
| User | id, name, email (unique), role, title, dept, joinedAt | has many Task, LeaveRequest, Activity, Account |
| Account / Session / VerificationToken | Auth.js tables | Account and Session belong to User |
| Project | id, name (unique), status, pct, lead, deadline | has many Task |
| Task | id, title, desc, priority, due, status, progress, projectId, assigneeId | belongs to Project and User |
| Activity | id, who, what, target, at, userId | belongs to User |
| LeaveRequest | id, userId, type, from, to, status | belongs to User |
| Risk, Contract, Revenue | executive reporting data | none |

No passwords are stored; authentication is delegated to Google and GitHub.

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/bootstrap` | Signed in | Data for the current user's role |
| GET | `/api/tasks` | Signed in | Own tasks (all tasks for manager and executive) |
| POST | `/api/tasks` | Signed in | Create a task (employees: assigned to themselves) |
| PATCH | `/api/tasks/:id` | Assignee, manager, executive | Update status, title, priority, due date, progress |
| DELETE | `/api/tasks/:id` | Assignee, manager, executive | Delete a task |
| GET | `/api/leave` | Signed in | Own leave requests |
| POST | `/api/leave` | Signed in | Request leave |
| PATCH | `/api/leave/:id` | HR, executive | Approve or decline |
| DELETE | `/api/leave/:id` | Owner | Cancel a pending request |
| PATCH | `/api/users/:id` | Executive | Change a user's role |

Errors return `{ "error": "message" }` with 400, 401, 403, 404 or 409.

---

## Getting Started

```bash
git clone https://github.com/Sumit10Sinha/HeimDall.git
cd HeimDall/heimdall-frontend
npm install
cp .env.example .env.local   # fill in the values below
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Edit the emails in `prisma/seed.ts` to your team's real Google or GitHub emails before seeding.

## Environment Variables

| Variable | Description | Where to Get |
|---|---|---|
| `DATABASE_URL` | Pooled Postgres connection string | Neon, via Vercel Storage |
| `DATABASE_URL_UNPOOLED` | Direct connection used for migrations | Neon, via Vercel Storage |
| `AUTH_SECRET` | Session signing secret | `npx auth secret` |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub OAuth app | GitHub, Developer settings |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth client | Google Cloud Console, Credentials |
| `ADMIN_EMAILS` | Emails that become Executive on first sign-in | You choose |

## Auth Flow

- **Providers:** Google and GitHub via Auth.js.
- **Sessions:** a signed JWT in an HTTP-only cookie.
- **Protected routes:** `middleware.ts` redirects visitors without a session to the landing page; every API route re-verifies the session and role server-side.
- **Linking:** a person's login attaches to their seeded profile by verified email.

## What I Learned

Replace this section with your own reflection: the hardest full-stack challenge and what you would architect differently.

---

*Submitted to Journey to Mastery — Level 3: Samurai*
