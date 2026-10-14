# HeimDall API Specification

This document details the RESTful HTTP API for **HeimDall**, including authentication, input validation, active tenant tracking, multi-organization membership, role-based authorization rules, and response payloads.

---

## Conventions & Security Model

- **Base URL:** `/api`
- **Content-Type:** `application/json`
- **Session Authentication:** Handled via Auth.js v5 JWT cookie (`authjs.session-token` or `__Secure-authjs.session-token`).
- **Authorization Context:** Every request resolves `{ user, membership, org, memberships }` on the server using `getContext()`. The active tenant is tracked via an HTTP-only, Secure, SameSite=Lax cookie named `hd-org`. Client-provided organization IDs are never trusted.
- **Multi-Organization Architecture:** One user can belong to multiple organizations concurrently with independent roles in each (`Membership` uniquely constrained by `[userId, organizationId]`).
- **Standard Error Format:**
  ```json
  { "error": "Human readable error message" }
  ```
- **HTTP Status Codes:**
  - `200 OK`: Request succeeded.
  - `201 Created`: Resource successfully created.
  - `400 Bad Request`: Validation failure or malformed payload.
  - `401 Unauthorized`: Missing or invalid session.
  - `403 Forbidden`: Authenticated user lacks required role/membership permissions.
  - `404 Not Found`: Target resource does not exist in the caller's context.
  - `409 Conflict`: Business logic violation (e.g. duplicate handle, already a member of this org, sole executive leave/remove).
  - `410 Gone`: Resource expired (e.g. expired invitation).

---

## Permission Matrix Reference

| Action | Allowed Roles / Conditions |
|---|---|
| `org.create` | Any authenticated user (even if already member of other companies) |
| `member.invite` -> `EXECUTIVE` | **Nobody** (only the original creator is Executive) |
| `member.invite` -> `HR` or `MANAGER` | `EXECUTIVE` only |
| `member.invite` -> `EMPLOYEE` | `EXECUTIVE`, `HR`, `MANAGER` |
| `member.remove` | `EXECUTIVE` (any member except sole executive/self); `HR` (`EMPLOYEE` only) |
| `task.create` / `task.update` / `task.delete` | Any member for their own tasks (`isOwn: true`); `MANAGER` and `EXECUTIVE` for any org task |
| `leave.decide` | `HR`, `EXECUTIVE` |
| `exec.reports` | `EXECUTIVE` only (risks, contracts, revenue) |

---

## 1. Authentication & Bootstrap

### `GET /api/bootstrap`
Loads initialization state and scoped data for the signed-in user's active tenant and role.

- **Auth Required:** Yes
- **Data Scoping:**
  - **Individual (Personal space):** Returns personal tasks (`organizationId: null`), empty org metrics, user's companies list, and pending invitations sent to their email.
  - **Employee:** Scoped to tasks where `assigneeId == user.id || ownerId == user.id`. Excluded from executive reports, HR leave decision queue, and directory admin data.
  - **Manager:** Returns all company tasks and projects across the active organization (`organizationId: orgId`).
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
      "activeCompany": {
        "id": "cuid",
        "name": "Acme Innovations",
        "slug": "acme-corp",
        "role": "EXECUTIVE"
      },
      "companies": [
        {
          "id": "cuid",
          "name": "Acme Innovations",
          "slug": "acme-corp",
          "role": "EXECUTIVE",
          "title": "Founder",
          "joinedAt": "2026-10-13T00:00:00.000Z"
        }
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
      "exec": {}
    }
  }
  ```

---

## 2. Profile & Personal Tasks

### `GET /api/me`
Retrieves current user profile, active membership, all memberships, and pending invitations.

- **Auth Required:** Yes
- **Response `200 OK`:**
  ```json
  {
    "user": {
      "id": "cuid",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "title": "Founder & CEO",
      "city": "London",
      "joinedAt": "2026-10-13T00:00:00.000Z",
      "image": null
    },
    "membership": {
      "role": "EXECUTIVE",
      "organizationId": "cuid",
      "organizationName": "Acme Innovations",
      "organizationSlug": "acme-corp"
    },
    "memberships": [
      {
        "role": "EXECUTIVE",
        "organizationId": "cuid",
        "organizationName": "Acme Innovations",
        "organizationSlug": "acme-corp",
        "joinedAt": "2026-10-13T00:00:00.000Z"
      }
    ],
    "invitations": []
  }
  ```

### `PATCH /api/me`
Updates user profile fields (name, title, city).

- **Auth Required:** Yes
- **Request Body:** `{ "name": "Alice Smith", "title": "CEO", "city": "London" }`
- **Response `200 OK`:** Updated user object.

### `GET /api/me/tasks`
Lists all personal tasks owned by the signed-in user (`organizationId: null`).

- **Auth Required:** Yes
- **Response `200 OK`:** Array of personal task objects.

### `POST /api/me/tasks`
Creates a new personal task.

- **Auth Required:** Yes
- **Request Body:** `{ "title": "Buy groceries", "due": "2026-10-15", "priority": "high" }`
- **Response `201 Created`:** Created personal task record with `organizationId: null`.

### `PATCH /api/me/tasks/:id`
Updates status, title, due date, or priority of a personal task owned by the caller.

- **Auth Required:** Yes (`ownerId === user.id` and `organizationId === null`)
- **Response `200 OK`:** Updated personal task record.

### `DELETE /api/me/tasks/:id`
Deletes a personal task owned by the caller.

- **Auth Required:** Yes (`ownerId === user.id` and `organizationId === null`)
- **Response `200 OK`:** `{ "success": true }`.

---

## 3. Organization Lifecycle & Switching

### `POST /api/orgs`
Registers a new organization and assigns the caller as `EXECUTIVE` in an atomic database transaction. Sets the `hd-org` cookie to the new organization. Users can create companies even if they already belong to others.

- **Auth Required:** Yes
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
  - `409 Conflict`: Slug already taken.

### `POST /api/orgs/switch`
Switches the caller's active organization by verifying membership and updating the HTTP-only `hd-org` cookie. Passing `organizationId: null` switches to the personal workspace.

- **Auth Required:** Yes
- **Request Body:**
  ```json
  { "organizationId": "org_cuid" }
  ```
  *(or `{ "organizationId": null }` to switch to personal space)*
- **Response `200 OK` (Company):**
  ```json
  {
    "success": true,
    "activeOrganization": {
      "id": "org_cuid",
      "name": "Acme Corporation",
      "slug": "acme-corp"
    },
    "isPersonal": false,
    "role": "EXECUTIVE"
  }
  ```
- **Response `200 OK` (Personal):**
  ```json
  {
    "success": true,
    "activeOrganization": null,
    "isPersonal": true
  }
  ```
- **Errors:**
  - `400 Bad Request`: Invalid organization ID.
  - `403 Forbidden`: Caller does not hold a membership in that organization.

### `POST /api/orgs/leave`
Allows a non-sole-executive or team member to leave the currently active organization. Removes their membership and automatically switches the active tenant cookie to their next company or personal space.

- **Auth Required:** Yes (must have active organization)
- **Safety Rule:** Sole Executive cannot leave the company.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "message": "You have left Acme Corporation.",
    "activeCompanyId": "next_org_cuid",
    "isPersonal": false
  }
  ```
- **Errors:**
  - `409 Conflict`: `"Cannot leave organization: You are the only Executive. You must promote another member to Executive first."`

---

## 4. Team & Member Management

### `GET /api/orgs/members`
Lists all members and pending invitations for the caller's active organization.

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
    "invitations": []
  }
  ```

### `POST /api/orgs/members/invite`
Issues an invitation to a prospective team member.

- **Auth Required:** Yes (`EXECUTIVE`, `HR`, `MANAGER`)
- **Request Body:**
  ```json
  {
    "email": "colleague@example.com",
    "role": "EMPLOYEE"
  }
  ```
- **Validation:**
  - Caller role must satisfy permission matrix for target role:
    - `EXECUTIVE` can invite `HR`, `MANAGER`, `EMPLOYEE`.
    - `HR` can invite `EMPLOYEE`.
    - `MANAGER` can invite `EMPLOYEE`.
- **Response `201 Created`:** Created invitation object with 14-day expiry.
- **Errors:**
  - `403 Forbidden`: Unauthorized to invite requested role.
  - `409 Conflict`: User is already a member of *this* organization OR pending invitation exists for *this* organization.

### `DELETE /api/orgs/members/:id`
Removes a member from the active organization.

- **Auth Required:** Yes (`EXECUTIVE` can remove any non-sole-executive; `HR` can remove `EMPLOYEE` only)
- **Safety Rule:** Cannot remove the sole Executive of the company.
- **Response `200 OK`:** `{ "success": true, "message": "Member removed successfully" }`.
- **Errors:**
  - `400 Bad Request`: Cannot remove self from here (use `/api/orgs/leave`).
  - `403 Forbidden`: Insufficient role permissions.
  - `409 Conflict`: `"Cannot remove the only Executive of this organization. Promote another member to Executive first."`

---

## 5. Invitations Lifecycle

### `POST /api/invitations/:id/accept`
Accepts a pending invitation and creates an active organization membership. Automatically switches the active `hd-org` cookie to the newly joined organization. Users can accept invitations even if already in other companies.

- **Auth Required:** Yes
- **Verification Criteria:**
  1. Invitation exists and status is `PENDING`.
  2. Invitation has not expired (`expiresAt > now`).
  3. Caller email matches invitation email.
  4. Caller is not already a member of *this* organization.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "company": { "id": "...", "name": "...", "slug": "..." },
    "membership": { "id": "...", "role": "EMPLOYEE" }
  }
  ```

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
- **Response `200 OK`:** Array of company task objects.

### `POST /api/tasks`
Creates a company task in the caller's active organization.

- **Auth Required:** Yes (`can(role, 'task.create', isOwn)`)
- **Response `201 Created`:** Created task record.

### `PATCH /api/tasks/:id`
Updates a company task.

- **Auth Required:** Yes (must match active `organizationId`, and satisfy `can(role, 'task.update', isOwn)`)
- **Response `200 OK`:** Updated task record.

### `DELETE /api/tasks/:id`
Deletes a company task.

- **Auth Required:** Yes (must match active `organizationId`, and satisfy `can(role, 'task.delete', isOwn)`)
- **Response `200 OK`:** `{ "success": true }`.

---

## 7. Leave Management

### `GET /api/leave`
Returns leave requests. Employees see only their own; HR and Executive see all pending requests for the organization.

- **Auth Required:** Yes
- **Response `200 OK`:** Array of leave request objects.

### `POST /api/leave`
Submits a leave request for the authenticated user inside the active organization.

- **Auth Required:** Yes
- **Response `201 Created`:** Created leave request record.

### `PATCH /api/leave/:id`
Approves or rejects a leave request.

- **Auth Required:** Yes (`HR` or `EXECUTIVE`)
- **Request Body:** `{ "decision": "APPROVED" | "REJECTED" }`
- **Response `200 OK`:** Updated leave request record.
