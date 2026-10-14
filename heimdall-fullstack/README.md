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
- **Zero Client Trust:** Every query and mutation derives `organizationId` and permissions strictly from the server-verified active membership (`ctx.membership.organizationId`).
- **Multi-Organization Membership:** Users can belong to multiple organizations simultaneously with independent roles per tenant (e.g., Executive in Org A, Manager in Org B). Memberships are tracked via `@@unique([userId, organizationId])`.
- **Active Tenant Tracking (`hd-org` Cookie):** The currently active organization ID is preserved in an HTTP-only, Secure, SameSite=Lax cookie (`hd-org`). The server validates the cookie against the user's verified memberships on every request; if missing, forged, or invalid, it gracefully falls back to their most recently joined organization or personal space (`null`).
- **Personal vs Organization Data:** Personal tasks have `organizationId = null` and are scoped strictly to `ownerId = user.id`. Company tasks require valid membership and active tenant scoping.
- **Sole-Executive Safety Invariant:** A user who is the only Executive of an organization cannot leave or be removed (returns `409 Conflict`), ensuring no organization is left orphaned.

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
| **Membership** | `id`, `userId`, `organizationId`, `role`, `addedById`, `createdAt` | Links user to an organization with a specific role (`@@unique([userId, organizationId])`). Users can belong to multiple organizations. |
| **Invitation** | `id`, `organizationId`, `email`, `role`, `token` (unique), `status`, `expiresAt` | 14-day expiring invites for new colleagues scoped to an organization. |
| **Project** | `id`, `organizationId`, `name`, `status`, `pct`, `lead`, `deadline` | Organization projects. Unique on `[organizationId, name]`. |
| **Task** | `id`, `organizationId` (nullable), `ownerId`, `assigneeId`, `title`, `status`, `due` | Null `organizationId` = personal task; non-null = scoped company task. |
| **LeaveRequest** | `id`, `organizationId`, `userId`, `type`, `from`, `to`, `status` | Scoped to organization and requesting user. |
| **Activity** | `id`, `organizationId`, `userId`, `who`, `what`, `target`, `at` | Recent audit events within the tenant. |
| **Risk / Contract / Revenue** | `id`, `organizationId`, metrics | Executive reporting data scoped to organization. |

---

## API Routes Summary

| Method | Endpoint | Required Role / Auth | Description |
|---|---|---|---|
| `GET` | `/api/bootstrap` | Signed in | Bootstraps workspace state, active company (`hd-org`), user companies list, and tenant data scoped to caller's role |
| `PATCH` | `/api/me` | Signed in | Updates personal profile headline, name, and location |
| `GET` | `/api/me/tasks` | Signed in | Lists personal tasks owned by caller (`organizationId: null`) |
| `POST` | `/api/me/tasks` | Signed in | Creates a new personal task |
| `PATCH` | `/api/me/tasks/:id` | Owner | Updates status, priority, or due date of own personal task |
| `DELETE` | `/api/me/tasks/:id` | Owner | Deletes own personal task |
| `POST` | `/api/orgs` | Signed in | Registers an organization, grants `EXECUTIVE` membership, and sets active `hd-org` cookie (works even if user has other companies; `409` on duplicate slug) |
| `POST` | `/api/orgs/switch` | Signed in | Switches active organization via `hd-org` cookie (`403` if not a member; `organizationId: null` for personal space) |
| `POST` | `/api/orgs/leave` | Org member | Leaves active organization (`409 Conflict` if caller is the sole Executive) |
| `GET` | `/api/orgs/members` | Org member | Lists organization members and active pending invitations |
| `POST` | `/api/orgs/members/invite` | Executive, HR, Manager | Issues invitation scoped to active org (`403` if role unpermitted; `409` if duplicate pending invite or already member of this org) |
| `DELETE` | `/api/orgs/members/:id` | Executive, HR | Removes member (`409` if target is sole Executive; Exec removes any; HR removes Employee) |
| `GET` | `/api/users/:id` | Org member | Fetches member details scoped to active organization |
| `PATCH` | `/api/users/:id` | Executive | Updates member role |
| `GET` | `/api/invitations/:id` | Public | Fetches invitation public details by ID or token |
| `POST` | `/api/invitations/:id/accept` | Signed in invitee | Accepts invitation, creates membership in target org, and sets active `hd-org` cookie |
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

## Authentication & Multi-Tenant Flow

```
1. Sign In (Google / GitHub)
   │
   ├─► Read `hd-org` cookie & load user memberships
   │     │
   │     ├─► Cookie is 'personal' OR user has 0 memberships
   │     │     └──► Redirect to /home (Personal Workspace)
   │     │            • Manage personal tasks (organizationId: null)
   │     │            • Edit individual profile card
   │     │            • Review & accept pending invitations
   │     │            • Top bar switcher to jump to any joined company
   │     │            • Button: "Create a company" ──► /create-company
   │     │
   │     └─► Valid active company (or fallback to latest joined membership)
   │           └──► Redirect to /workspace (Organization Workspace)
   │                  • Top bar displays Organization Switcher dropdown:
   │                      - Lists all user companies with role ("Acme: Manager", "Beta: Executive")
   │                      - "Personal space" item
   │                      - "Create a company" item
   │                  • Top bar View Switcher (role-permitted dashboard tabs)
   │                  • Sidebar shows role-authorized views (People for Exec/HR/Mgr)
   │                  • All data queries scoped strictly to caller's verified organizationId
```

### Company Switcher & Top Bar Controls
- **Company Switcher:** Located in the top-left/top-right header. Allows instantaneous switching between companies or personal space via `POST /api/orgs/switch` which sets an HTTP-only, Secure, SameSite=Lax `hd-org` cookie. Shows an inline loading spinner while data refreshes.
- **Role View Switcher:** Allows members to toggle between dashboard views permitted by their role in the **active company**:
  - **Executive**: `Executive View`, `Manager View`, `HR View`, `Employee View`
  - **Manager**: `Manager View`, `Employee View`
  - **HR**: `HR View`, `Employee View`
  - **Employee**: Single `Employee View` badge (cannot switch views)
- **Sole-Executive Protection & Leaving:** In the People table or Workspace settings, users can click **Leave organization** (`POST /api/orgs/leave`). If the caller is the sole Executive of the company, the server rejects the request with `409 Conflict` and prompts them to promote another Executive first. Non-sole executives and other roles can leave cleanly, switching their active context to another company or personal home.

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
Runs 19 native unit and scenario verification tests checking the permission matrix, organization slug formatting, multi-tenant security isolation, multi-org switching, per-company roles, and sole-executive protection.

---

## Verification & Manual Testing Checklist

Refer to **[`docs/TESTING.md`](./docs/TESTING.md)** for step-by-step verification procedures for:
1. Two personal users cannot see each other's tasks.
2. User creates a company and becomes Executive.
3. Executive invites HR, Manager, and Employee.
4. HR and Manager can invite only Employees, and the server rejects other roles with 403.
5. A user from another company cannot read this company's data.
6. An invitation for another email cannot be accepted.
7. User in two companies sees only the active company's data; active tenant persists in `hd-org` cookie.
8. Switching to a company the user doesn't belong to returns 403 Forbidden.
9. Roles and permissions are evaluated per active company.
10. Sole Executive cannot leave or be removed (409 Conflict), but non-sole executives and members can leave cleanly.
