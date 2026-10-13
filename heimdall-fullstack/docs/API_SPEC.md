# HeimDall API Specification

This document details the RESTful HTTP API for **HeimDall**, including authentication, input validation, role-based authorization rules, and response payloads.

---

## Conventions & Security Model

- **Base URL:** `/api`
- **Content-Type:** `application/json`
- **Session Authentication:** Handled via Auth.js v5 JWT cookie (`authjs.session-token` or `__Secure-authjs.session-token`).
- **Authorization Context:** Every request resolves `{ user, membership, org }` on the server using `getContext()`. Client-provided organization IDs are never trusted.
- **Single-Organization Policy:** A user may belong to only one organization at a time (enforced by a `@unique` constraint on `Membership.userId`).
- **Standard Error Format:**
  ```json
  { "error": "Human readable error message" }
  ```
- **HTTP Status Codes:**
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource successfully created.
  - `400 Bad Request`: Validation failure or malformed payload.
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: Authenticated user lacks required role/ownership permissions.
  - `404 Not Found`: Target resource does not exist in the caller's context.
  - `409 Conflict`: Business logic violation (e.g. duplicate handle, existing membership, duplicate invitation).
  - `410 Gone`: Resource expired (e.g. expired invitation).

---

## Permission Matrix Reference

| Action | Allowed Roles / Conditions |
|---|---|
| `org.create` | Any authenticated user **without an existing membership** (`role: null`) |
| `member.invite` -> `EXECUTIVE` | **Nobody** (only the original creator is Executive) |
| `member.invite` -> `HR` or `MANAGER` | `EXECUTIVE` only |
| `member.invite` -> `EMPLOYEE` | `EXECUTIVE`, `HR`, `MANAGER` |
| `member.remove` | `EXECUTIVE` (any member except creator/self); `HR` (`EMPLOYEE` only) |
| `task.create` / `task.update` / `task.delete` | Any member for their own tasks (`isOwn: true`); `MANAGER` and `EXECUTIVE` for any org task |
| `leave.decide` | `HR`, `EXECUTIVE` |
| `exec.reports` | `EXECUTIVE` only (risks, contracts, revenue) |

---

## 1. Authentication & Bootstrap

### `GET /api/bootstrap`
Loads initialization state and scoped data for the signed-in user's active tenant and role.

- **Auth Required:** Yes
- **Data Scoping:**
  - **Individual (No company):** Returns personal tasks (`organizationId: null`), empty org metrics, and pending invitations sent to their email.
  - **Employee:** Scoped to tasks where `assigneeId == user.id || ownerId == user.id`. Excluded from executive reports, HR leave decision queue, and directory admin data.
  - **Manager:** Returns all company tasks and projects across the organization (`organizationId: orgId`).
  - **HR:** Returns the organization employee directory and all pending org leave requests (`organizationId: orgId`).
  - **Executive:** Returns company-wide risks, contracts, and revenue records (`organizationId: orgId`).
- **Response `200 OK`:**
  ```json
  {
    "me": {
      "id": "cuid",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "role": "EXECUTIVE"
    },
    "workspace": {
      "isPersonal": false,
      "activeCompany": { "id": "cuid", "name": "Acme Corp", "slug": "acme-corp" },
      "companies": [
        { "id": "cuid", "name": "Acme Corp", "slug": "acme-corp", "role": "EXECUTIVE", "title": "CEO" }
      ],
      "invitations": []
    },
    "data": {
      "tasks": [],
      "projects": [],
      "activity": [],
      "people": [],
      "joiners": [],
      "leave": [],
      "myLeave": [],
      "exec": {
        "score": 0,
        "compliance": 100,
        "summary": [],
        "risks": [],
        "contracts": [],
        "revenue": []
      }
    }
  }
  ```

---

## 2. Personal Workspace & Profile

### `PATCH /api/me`
Updates the authenticated user's individual profile card.

- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "name": "Alice Smith",
    "title": "Principal Architect",
    "city": "San Francisco, CA"
  }
  ```
- **Validation:** `name` must be between 1 and 60 characters. `title` and `city` optional up to 100/60 characters.
- **Response `200 OK`:**
  ```json
  {
    "id": "cuid",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "title": "Principal Architect",
    "city": "San Francisco, CA",
    "joinedAt": "2026-10-13T00:00:00.000Z"
  }
  ```

### `GET /api/me/tasks`
Fetches personal tasks owned by the caller (`organizationId: null`, `ownerId: user.id`).

- **Auth Required:** Yes
- **Response `200 OK`:** Array of personal tasks ordered by due date ascending.

### `POST /api/me/tasks`
Creates a new personal task.

- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "title": "Prepare tax return",
    "desc": "Gather receipts and deductions",
    "due": "2026-10-20",
    "priority": "high"
  }
  ```
- **Validation:** `title` (3-120 chars), `due` (valid ISO date), `priority` (`high` | `medium` | `low`).
- **Response `201 Created`:** Created task record with `organizationId: null` and `ownerId: user.id`.

### `PATCH /api/me/tasks/:id`
Updates status, title, due date, or priority of a personal task owned by the caller.

- **Auth Required:** Yes (`ownerId === user.id` and `organizationId === null`)
- **Response `200 OK`:** Updated task record.
- **Errors:** `403 Forbidden` if caller does not own the task.

### `DELETE /api/me/tasks/:id`
Deletes a personal task owned by the caller.

- **Auth Required:** Yes (`ownerId === user.id` and `organizationId === null`)
- **Response `200 OK`:** `{ "success": true }`.

---

## 3. Organization & Registration

### `POST /api/orgs`
Registers a new organization and assigns the caller as `EXECUTIVE` in an atomic database transaction.

- **Auth Required:** Yes
- **Prerequisites:** User must not have an existing organization membership (`Membership.userId` unique constraint).
- **Request Body:**
  ```json
  {
    "name": "Acme Corporation",
    "slug": "acme-corp"
  }
  ```
- **Validation:**
  - `name`: 3 to 60 characters.
  - `slug`: 3 to 40 characters; lowercase alphanumeric and hyphens (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- **Response `201 Created`:**
  ```json
  {
    "organization": {
      "id": "cuid",
      "name": "Acme Corporation",
      "slug": "acme-corp",
      "createdById": "user_cuid",
      "plan": "STARTER",
      "createdAt": "2026-10-13T00:00:00.000Z"
    },
    "membership": {
      "id": "mem_cuid",
      "organizationId": "cuid",
      "userId": "user_cuid",
      "role": "EXECUTIVE",
      "createdAt": "2026-10-13T00:00:00.000Z"
    }
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure on name or handle format.
  - `409 Conflict`: Slug already taken OR user already belongs to an organization.

---

## 4. Team & Member Management

### `GET /api/orgs/members`
Lists all members and pending invitations for the caller's organization.

- **Auth Required:** Yes (must belong to an org)
- **Response `200 OK`:**
  ```json
  {
    "members": [
      {
        "id": "mem_cuid",
        "userId": "user_cuid",
        "name": "Alice Smith",
        "email": "alice@example.com",
        "role": "EXECUTIVE",
        "title": "Founder",
        "city": "London",
        "joinedAt": "2026-10-13T00:00:00.000Z",
        "addedBy": null,
        "isCreator": true
      }
    ],
    "invitations": [
      {
        "id": "inv_cuid",
        "email": "colleague@example.com",
        "role": "EMPLOYEE",
        "status": "PENDING",
        "token": "tok_cuid",
        "createdAt": "2026-10-13T00:00:00.000Z",
        "expiresAt": "2026-10-27T00:00:00.000Z",
        "invitedBy": "Alice Smith"
      }
    ]
  }
  ```

### `POST /api/orgs/members/invite`
Issues an organization invitation to an email address.

- **Auth Required:** Yes (`EXECUTIVE`, `HR`, or `MANAGER`)
- **Request Body:**
  ```json
  {
    "email": "teammate@example.com",
    "role": "EMPLOYEE"
  }
  ```
- **Permission Matrix Enforcement:**
  - `EXECUTIVE` can invite `HR`, `MANAGER`, `EMPLOYEE`.
  - `HR` can invite `EMPLOYEE` only.
  - `MANAGER` can invite `EMPLOYEE` only.
  - Inviting `EXECUTIVE` is rejected for all callers.
- **Validation & Conflict Checks:**
  - Returns `403 Forbidden` if caller lacks permission for target role.
  - Returns `409 Conflict` if user is already a member of this organization.
  - Returns `409 Conflict` if a non-expired `PENDING` invitation exists for this email.
- **Response `201 Created`:**
  ```json
  {
    "id": "inv_cuid",
    "email": "teammate@example.com",
    "role": "EMPLOYEE",
    "token": "tok_cuid",
    "status": "PENDING",
    "expiresAt": "2026-10-27T00:00:00.000Z",
    "createdAt": "2026-10-13T00:00:00.000Z",
    "organizationName": "Acme Corporation",
    "invitedBy": "Alice Smith"
  }
  ```

### `DELETE /api/orgs/members/:id`
Removes a member from the organization (`:id` matches `Membership.id` or `User.id`).

- **Auth Required:** Yes
- **Rules & Guards:**
  - Cannot remove self (`400 Bad Request`).
  - Cannot remove organization creator/owner (`403 Forbidden`).
  - `EXECUTIVE` can remove any other member.
  - `HR` can remove `EMPLOYEE` only.
  - `MANAGER` and `EMPLOYEE` cannot remove members (`403 Forbidden`).
- **Response `200 OK`:** `{ "success": true, "message": "Member removed successfully" }`.

### `GET /api/users/:id`
Retrieves a member's public details within the caller's organization.

- **Auth Required:** Yes
- **Response `200 OK`:** Member details.
- **Errors:** `404 Not Found` if user is not in the caller's organization.

### `PATCH /api/users/:id`
Updates a member's role (`EXECUTIVE` only).

- **Auth Required:** Yes (`role: 'EXECUTIVE'`)
- **Request Body:** `{ "role": "MANAGER" }`
- **Rules:** Cannot modify own role or creator role.
- **Response `200 OK`:** Updated membership record.

---

## 5. Invitations Lifecycle

### `GET /api/invitations/:id`
Retrieves public invitation metadata by `id` or `token`.

- **Auth Required:** No
- **Response `200 OK`:**
  ```json
  {
    "id": "inv_cuid",
    "token": "tok_cuid",
    "companyName": "Acme Corporation",
    "companySlug": "acme-corp",
    "email": "teammate@example.com",
    "role": "EMPLOYEE",
    "status": "PENDING",
    "expiresAt": "2026-10-27T00:00:00.000Z",
    "invitedBy": "Alice Smith"
  }
  ```

### `POST /api/invitations/:id/accept`
Accepts a pending invitation and creates an active organization membership.

- **Auth Required:** Yes
- **Verification Criteria:**
  1. Invitation exists and status is `PENDING` (returns `400` if already accepted/declined/revoked).
  2. Invitation has not expired (marks `REVOKED` and returns `410 Gone` if expired).
  3. Authenticated user's email matches the invitation email (`invite.email.toLowerCase() === user.email.toLowerCase()`; returns `403 Forbidden` on mismatch).
  4. Authenticated user does not already belong to an organization (`409 Conflict` on single-org policy).
- **Database Action:** Atomic transaction creates `Membership` and sets invitation status to `ACCEPTED`.
- **Response `200 OK`:** `{ "success": true, "company": { "id": "...", "name": "...", "slug": "..." } }`.

### `POST /api/invitations/:id/decline`
Declines an invitation sent to the authenticated caller's email.

- **Auth Required:** Yes (caller email must match invite email)
- **Response `200 OK`:** `{ "success": true, "status": "DECLINED" }`.

### `POST /api/invitations/:id/revoke`
Revokes a pending invitation for the organization.

- **Auth Required:** Yes (`EXECUTIVE`, `HR`, or `MANAGER` belonging to the organization)
- **Response `200 OK`:** `{ "success": true, "status": "REVOKED" }`.

---

## 6. Company Tasks

### `GET /api/tasks`
Lists organization tasks scoped by role.

- **Auth Required:** Yes
- **Scoping:**
  - `EMPLOYEE` / `HR`: receives tasks where `assigneeId == user.id || ownerId == user.id`.
  - `MANAGER` / `EXECUTIVE`: receives all company tasks (`organizationId: orgId`).
- **Response `200 OK`:** Array of tasks ordered by due date ascending.

### `POST /api/tasks`
Creates a company task.

- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "title": "Deploy v1.2 release",
    "desc": "Verify production migration",
    "due": "2026-10-25",
    "priority": "high",
    "projectId": "proj_cuid",
    "assigneeId": "user_cuid"
  }
  ```
- **Rules:** Assigning tasks to other members requires `MANAGER` or `EXECUTIVE` role (`can(role, 'task.create', isOwn)`).
- **Response `201 Created`:** Created task record.

### `PATCH /api/tasks/:id`
Updates task status, details, priority, or progress.

- **Auth Required:** Yes (must belong to task's organization)
- **Rules:** Own tasks (`isOwn: true`) can be updated by any member; updating others' tasks requires `MANAGER` or `EXECUTIVE`.
- **Response `200 OK`:** Updated task record.

### `DELETE /api/tasks/:id`
Deletes an organization task.

- **Auth Required:** Yes
- **Rules:** Own tasks can be deleted by any member; others' tasks require `MANAGER` or `EXECUTIVE`.
- **Response `200 OK`:** `{ "ok": true }`.

---

## 7. Leave Management

### `GET /api/leave`
Returns own submitted leave requests.

- **Auth Required:** Yes
- **Response `200 OK`:** Array of user's leave requests.

### `POST /api/leave`
Submits a leave request to HR/Executive queue.

- **Auth Required:** Yes (must belong to an org)
- **Request Body:**
  ```json
  {
    "type": "Annual leave",
    "from": "2026-11-01",
    "to": "2026-11-05"
  }
  ```
- **Validation:** `type` (`Annual leave` | `Casual leave` | `Sick leave`), `to >= from`.
- **Response `201 Created`:** Created leave request with status `PENDING`.

### `PATCH /api/leave/:id`
Approves or declines a leave request (`HR` or `EXECUTIVE` only).

- **Auth Required:** Yes (`can(role, 'leave.decide')`)
- **Request Body:** `{ "decision": "APPROVED" }` (`APPROVED` | `DECLINED`)
- **Response `200 OK`:** Updated leave request record.

### `DELETE /api/leave/:id`
Cancels a pending leave request.

- **Auth Required:** Yes (must be request owner; status must be `PENDING`)
- **Response `200 OK`:** `{ "ok": true }`.
