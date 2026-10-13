# HeimDall

> **The digital home of an organization, and also your personal workspace.**  
> Anyone signs in as an individual with an independent personal workspace. From there, they can establish a new company as Executive or accept invitations to join existing organizations with role-based dashboards for Employee, Manager, HR, and Executive.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue?style=for-the-badge)](https://heimdall-hazel.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-black?style=for-the-badge&logo=github)](https://github.com/Sumit10Sinha/HeimDall)
[![Test Suite](https://img.shields.io/badge/Tests-Passing-brightgreen?style=for-the-badge)](./docs/TESTING.md)

---

## Preview

| Desktop Workspace | Mobile View |
|---|---|
| <img src="assets/Laptop%20Light%20Mode.png" width="420" alt="Desktop"> | <img src="assets/Phone%20Light%20Mode.jpeg" width="200" alt="Mobile"> |

---

## What It Does

Most tools force you into a corporate silo before you even start. HeimDall works like LinkedIn:
1. **Personal Workspace (`/home`):** Anyone signs in as an individual. Manage personal tasks, edit your professional profile card (headline, location), chat with Personal AI, and review company invitations.
2. **Company Registration (`/create-company`):** Launch an organization in seconds. Pick a company name and customized URL handle (`slug`). You are instantly set as **Executive** on the **Starter Plan**.
3. **Role-Based Company Dashboards (`/workspace`):**
   - **Executive:** Company overview, risks, revenue charts, contract alerts, and full team directory.
   - **HR:** Headcount metrics, employee directory, leave approval queue, and employee onboarding.
   - **Manager:** Team task workload distribution, active project delivery progress, and deadlines.
   - **Employee:** Assigned tasks, progress tracker, personal updates, and leave request submission.
4. **Team Management & Invitations:** Executives and HR can invite team members with restricted roles according to the security matrix. Invitations expire in 14 days and can be accepted, declined, or revoked.

---

## Documentation

- 📋 **[Manual Testing Checklist & Verification Guide](./docs/TESTING.md)**: Comprehensive manual checklist covering cross-user isolation, company creation, invite lifecycle, and role guards.
- 📡 **[API Specification](./docs/API_SPEC.md)**: Full REST API specification with endpoints, request/response schemas, status codes, and security matrix.
- 📐 **[Architecture Overview](./Architecture.md)**: System design and multi-tenant isolation patterns.

---

## Architecture

```
Browser ──> Next.js 15 (App Router) on Vercel
             ├── /app/home (Personal Workspace)
             ├── /app/create-company (Company Registration)
             ├── /app/workspace (Organization Dashboards)
             │
             ├── /app/api (REST Endpoints)
             │    ├── lib/guard.ts (Session + getContext() tenant resolver)
             │    └── lib/permissions.ts (can(role, action) permission matrix)
             │
             └── Prisma 6 ORM ──> Neon Postgres (Serverless Pooler)
```

### Multi-Tenant Isolation Model
- **Zero Client Trust:** Every query and mutation derives `organizationId` strictly from the server-verified session membership (`ctx.membership.organizationId`).
- **Single Organization Constraint:** Each user belongs to at most one organization at a time (enforced via unique index on `Membership.userId`).
- **Personal vs Organization Data:** Personal tasks have `organizationId = null` and are scoped strictly to `ownerId = user.id`. Company tasks require valid membership and tenant scoping.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | React Server Components, Route Handlers, Turbopack |
| **Language** | TypeScript 5.6 | Strict type-safety across client and server |
| **Database** | Neon Postgres + Prisma 6 | Serverless PostgreSQL with typed schema and migrations |
| **Authentication** | Auth.js v5 (NextAuth) | OAuth (Google & GitHub) with encrypted JWT session cookies |
| **Styling** | Tailwind CSS v4 | Dark-first neutral theme, single blue accent, 300ms transition |
| **Icons & UI** | Lucide React | Minimalist UI icons |
| **Testing** | Node.js Test Runner + tsx | Native zero-dependency unit and scenario testing |

---

## Database Schema

```prisma
enum Role {
  EXECUTIVE
  HR
  MANAGER
  EMPLOYEE
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
  REVOKED
}
```

| Table | Key Columns | Description & Multi-Tenant Scoping |
|---|---|---|
| **User** | `id`, `name`, `email`, `title`, `city`, `joinedAt` | Personal individual account. Has no global role. |
| **Organization** | `id`, `name`, `slug` (unique), `createdById`, `plan`, `createdAt` | Company tenant entity. |
| **Membership** | `id`, `userId` (unique), `organizationId`, `role`, `addedById` | 1-to-1 link between user and active company. Enforces single-org rule. |
| **Invitation** | `id`, `organizationId`, `email`, `role`, `token` (unique), `status`, `expiresAt` | 14-day expiring invites for new colleagues. |
| **Project** | `id`, `organizationId`, `name`, `status`, `pct`, `lead`, `deadline` | Organization projects. Unique on `[organizationId, name]`. |
| **Task** | `id`, `organizationId` (nullable), `ownerId`, `assigneeId`, `title`, `status`, `due` | Null `organizationId` = personal task; non-null = scoped company task. |
| **LeaveRequest** | `id`, `organizationId`, `userId`, `type`, `from`, `to`, `status` | Scoped to organization and requesting user. |
| **Activity** | `id`, `organizationId`, `userId`, `who`, `what`, `target`, `at` | Recent audit events within the tenant. |
| **Risk / Contract / Revenue** | `id`, `organizationId`, metrics | Executive reporting data scoped to organization. |

---

## API Routes Summary

| Method | Endpoint | Required Role / Auth | Description |
|---|---|---|---|
| `GET` | `/api/bootstrap` | Signed in | Bootstraps workspace state and tenant data scoped to caller's role |
| `PATCH` | `/api/me` | Signed in | Updates personal profile headline, name, and location |
| `GET` | `/api/me/tasks` | Signed in | Lists personal tasks owned by caller (`organizationId: null`) |
| `POST` | `/api/me/tasks` | Signed in | Creates a new personal task |
| `PATCH` | `/api/me/tasks/:id` | Owner | Updates status, priority, or due date of own personal task |
| `DELETE` | `/api/me/tasks/:id` | Owner | Deletes own personal task |
| `POST` | `/api/orgs` | Non-member | Registers an organization and grants `EXECUTIVE` membership |
| `GET` | `/api/orgs/members` | Org member | Lists organization members and active pending invitations |
| `POST` | `/api/orgs/members/invite` | Executive, HR, Manager | Issues invitation (`403` if role not allowed; `409` if duplicate/member) |
| `DELETE` | `/api/orgs/members/:id` | Executive, HR | Removes member (Executive removes any; HR removes Employee) |
| `GET` | `/api/users/:id` | Org member | Fetches member details scoped to organization |
| `PATCH` | `/api/users/:id` | Executive | Updates member role |
| `GET` | `/api/invitations/:id` | Public | Fetches invitation public details by ID or token |
| `POST` | `/api/invitations/:id/accept` | Signed in invitee | Accepts invitation and creates organization membership |
| `POST` | `/api/invitations/:id/decline` | Signed in invitee | Declines pending invitation |
| `POST` | `/api/invitations/:id/revoke` | Executive, HR, Manager | Revokes pending organization invitation |
| `GET` | `/api/tasks` | Org member | Lists org tasks (Employees: own tasks; Manager/Exec: all org tasks) |
| `POST` | `/api/tasks` | Org member | Creates org task (Manager/Exec can assign to others) |
| `PATCH` | `/api/tasks/:id` | Assignee, Manager, Exec | Updates task status or details |
| `DELETE` | `/api/tasks/:id` | Assignee, Manager, Exec | Deletes task |
| `GET` | `/api/leave` | Org member | Lists own leave requests |
| `POST` | `/api/leave` | Org member | Submits a leave request for HR approval |
| `PATCH` | `/api/leave/:id` | HR, Executive | Approves or declines leave request |
| `DELETE` | `/api/leave/:id` | Requester | Cancels a pending leave request |

---

## Authentication & Tenant Flow

```
1. Sign In (Google / GitHub)
   │
   ├─► Does user have an active Membership?
   │     │
   │     ├─► NO  ──► Redirect to /home (Personal Workspace)
   │     │            • Manage personal tasks
   │     │            • Review & accept pending invitations
   │     │            • Button: "Create a company" ──► /create-company
   │     │
   │     └─► YES ──► Redirect to /workspace (Organization Workspace)
   │                  • Top bar displays Organization Name & View Switcher
   │                  • Sidebar shows role-authorized views (People for Exec/HR/Mgr)
   │                  • All data queries scoped to caller's organizationId
```

### View Switcher Logic
In the top bar, users can toggle between dashboard views permitted by their membership role:
- **Executive**: `Executive View`, `Manager View`, `HR View`, `Employee View`
- **Manager**: `Manager View`, `Employee View`
- **HR**: `HR View`, `Employee View`
- **Employee**: Single `Employee View` badge (cannot switch views)

---

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/Sumit10Sinha/HeimDall.git
cd HeimDall/heimdall-fullstack
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and configure your credentials:
```env
DATABASE_URL="postgresql://user:password@endpoint-pooler.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
AUTH_SECRET="your-32-byte-secret"
AUTH_GOOGLE_ID="google-client-id"
AUTH_GOOGLE_SECRET="google-client-secret"
AUTH_GITHUB_ID="github-client-id"
AUTH_GITHUB_SECRET="github-client-secret"
```

### 3. Database Migrations
```bash
npx prisma migrate deploy
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Test Suite
```bash
npm test
```
Runs 15 native unit and scenario verification tests checking the permission matrix, organization slug formatting, and multi-tenant security isolation.

---

## Verification & Manual Testing Checklist

Refer to **[`docs/TESTING.md`](./docs/TESTING.md)** for step-by-step verification procedures for:
1. Two personal users cannot see each other's tasks.
2. User creates a company and becomes Executive.
3. Executive invites HR, Manager, and Employee.
4. HR and Manager can invite only Employees, and the server rejects other roles with 403.
5. A user from another company cannot read this company's data.
6. An invitation for another email cannot be accepted.
