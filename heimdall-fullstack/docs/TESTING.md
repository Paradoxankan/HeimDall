# HeimDall Manual Testing Checklist & Verification Guide

This document provides a manual test checklist and verification procedures for the multi-tenant personal workspace, company registration, role-based access control (RBAC), and team management features in **HeimDall**.

---

## Prerequisites & Test Personas

To execute the full manual checklist, prepare four test accounts (or sign in with distinct Google/GitHub OAuth accounts, or use simulated session cookies in separate incognito browser windows):

| Persona | Email | Purpose |
|---|---|---|
| **User A (Alice)** | `alice@example.com` | Individual user (Personal workspace) & Founder of Company Alpha |
| **User B (Bob)** | `bob@example.com` | Independent individual user (Personal workspace) & Founder of Company Beta |
| **User C (Carol)** | `carol@example.com` | Invited to Company Alpha as HR |
| **User D (Dave)** | `dave@example.com` | Invited to Company Alpha as Manager |
| **User E (Eve)** | `eve@example.com` | Invited to Company Alpha as Employee |

---

## Core Verification Scenarios

### Scenario 1: Two personal users cannot see each other's tasks

**Objective:** Verify that personal tasks created by User A are strictly isolated from User B, and neither user can view, edit, or delete the other's personal tasks.

- [ ] **Step 1.1: Alice creates personal tasks**
  - Sign in as **Alice** (`alice@example.com`). With no company membership, Alice is directed to `/home`.
  - In the **Personal Tasks** card, create two tasks:
    1. Title: `"Alice Tax Filing"`, Due: `Tomorrow`, Priority: `High`
    2. Title: `"Alice Weekly Journal"`, Due: `In 3 days`, Priority: `Medium`
  - Verify tasks appear in Alice's task table.
  - Verify API call: `POST /api/me/tasks` returns `201 Created` with `organizationId: null` and `ownerId: alice.id`.
- [ ] **Step 1.2: Bob checks his personal workspace**
  - In an incognito window, sign in as **Bob** (`bob@example.com`). Bob lands on `/home`.
  - Verify Bob's **Personal Tasks** list shows the designed empty state:
    > *"No personal tasks yet — Create tasks above to track your independent priorities, notes, and milestones."*
  - Verify Bob cannot see *"Alice Tax Filing"* or *"Alice Weekly Journal"*.
  - Verify API call: `GET /api/me/tasks` returns `[]` for Bob.
- [ ] **Step 1.3: Cross-user mutation isolation check**
  - Using Alice's task ID (e.g. `task_alice_1`), send a request using Bob's session:
    ```http
    PATCH /api/me/tasks/task_alice_1
    Content-Type: application/json

    { "status": "DONE" }
    ```
  - **Expected Result:** Server responds with `403 Forbidden` (`{ "error": "Forbidden" }`) or `404 Not Found`. Alice's task status remains unchanged.
  - Send delete request using Bob's session:
    ```http
    DELETE /api/me/tasks/task_alice_1
    ```
  - **Expected Result:** Server responds with `403 Forbidden`. The task is not deleted.

---

### Scenario 2: User creates a company and becomes Executive

**Objective:** Verify that an individual user can register a new company via `/create-company` and `POST /api/orgs`, automatically receiving the `EXECUTIVE` membership role and landing on the executive dashboard with proper empty states.

- [ ] **Step 2.1: Open registration page**
  - Signed in as **Alice**, navigate to `/create-company` (or click **"Create a company"** from `/home`).
  - Verify form renders:
    - Company Name input (`3 to 60 characters`)
    - Organization Handle / Slug input (`lowercase alphanumeric and dashes`)
    - "Starter Plan Included" feature badge
- [ ] **Step 2.2: Test auto-slug generation & validation**
  - Type `"Acme Innovations"` in Company Name.
  - Verify the Handle field auto-populates with `"acme-innovations"`.
  - Edit Handle manually to `"acme-corp"`.
  - Enter an invalid character or consecutive dashes (e.g. `acme--corp`); verify inline validation error:
    > *"Handle may only contain lowercase letters, numbers, and hyphens without consecutive or trailing dashes."*
  - Correct to `"acme-corp"`.
- [ ] **Step 2.3: Submit company registration**
  - Click **"Create Company"**.
  - Verify button shows loading state (`"Creating organization..."`).
  - Verify network request:
    ```http
    POST /api/orgs
    Content-Type: application/json

    { "name": "Acme Innovations", "slug": "acme-corp" }
    ```
  - **Expected Status:** `201 Created`. Response returns `{ organization: { id, name, slug, plan: "STARTER" }, membership: { role: "EXECUTIVE" } }`.
- [ ] **Step 2.4: Workspace redirection & Executive dashboard empty states**
  - Verify immediate redirection to `/workspace`.
  - Verify the top bar displays: `Acme Innovations / Executive View`.
  - Verify Alice's role is set to `EXECUTIVE`.
  - Verify all dashboard cards render intentional empty states:
    - **Active Projects:** *"No active projects — Projects across your organization will show up here."*
    - **Company Tasks:** *"No tasks yet — No company tasks have been created. Switch to Manager or Employee view to add tasks, or assign them to team members."*
    - **Team Members:** *"No team members yet — You are currently the only member in this company. Invite colleagues using the form below to collaborate."*
    - **Weekly Company Summary:** *"No summary generated yet"*
    - **Risks:** *"No open risks"*
    - **Overdue Items:** *"Nothing overdue"*
    - **Contract Alerts:** *"No contract alerts"*
    - **Revenue by business unit:** *"No revenue data"*
    - **Recent Updates:** *"No updates yet"*
- [ ] **Step 2.5: Single-organization guard**
  - While signed in as Alice, try sending `POST /api/orgs` again:
    ```http
    POST /api/orgs
    Content-Type: application/json

    { "name": "Duplicate Co", "slug": "dup-co" }
    ```
  - **Expected Result:** Server responds with `409 Conflict`:
    > *"You already belong to a company. A user may belong to only one organization at a time."*

---

### Scenario 3: Executive invites an HR, a Manager, and an Employee

**Objective:** Verify that an Executive can invite team members across all authorized roles (`HR`, `MANAGER`, `EMPLOYEE`), creating pending invitations with unique tokens and 14-day expiration.

- [ ] **Step 3.1: Navigate to People view**
  - In Alice's workspace sidebar, click **People**.
  - Verify the **"People & Team"** management screen opens.
- [ ] **Step 3.2: Verify Executive role dropdown options**
  - Click the **Assigned Role** dropdown in the "Add Person" card.
  - Verify options listed: `HR`, `Manager`, `Employee`.
  - Verify `Executive` is **NOT** present in the dropdown.
- [ ] **Step 3.3: Invite HR member (Carol)**
  - Enter email: `carol@example.com`.
  - Select Role: `HR`.
  - Click **"Send Invitation"**.
  - Verify loading state (`"Sending invitation..."`).
  - Verify inline success message:
    > *"Invitation sent for carol@example.com!"*
    > *"Ask them to sign in to HeimDall with this email."*
  - Click **Copy link**; verify button reflects *"Copied!"*.
  - Verify `POST /api/orgs/members/invite` returned `201 Created`.
- [ ] **Step 3.4: Invite Manager member (Dave)**
  - Enter email: `dave@example.com`.
  - Select Role: `Manager`.
  - Click **"Send Invitation"**.
  - Verify inline success message appears.
- [ ] **Step 3.5: Invite Employee member (Eve)**
  - Enter email: `eve@example.com`.
  - Select Role: `Employee`.
  - Click **"Send Invitation"**.
  - Verify inline success message appears.
- [ ] **Step 3.6: Verify Pending Invitations list**
  - Verify the **Pending Invitations** table displays 3 rows:
    1. `carol@example.com` · Chip: `HR` · Invited by: `Alice` · Expires: `In 14 days`
    2. `dave@example.com` · Chip: `Manager` · Invited by: `Alice` · Expires: `In 14 days`
    3. `eve@example.com` · Chip: `Employee` · Invited by: `Alice` · Expires: `In 14 days`
  - Verify each row has a functional **Revoke** button.

---

### Scenario 4: HR and Manager can invite only Employees; server rejects other roles with 403

**Objective:** Verify that HR and Manager users can only invite `EMPLOYEE` members, and that server-side validation strictly enforces this rule by rejecting unauthorized role invitations with `403 Forbidden`.

- [ ] **Step 4.1: Carol (HR) accepts invitation**
  - Sign in as **Carol** (`carol@example.com`).
  - On `/home`, the invitations card shows: `Acme Innovations · Role: HR`.
  - Click **"Accept"**.
  - Verify Carol joins Acme Innovations as `HR` and is redirected to `/workspace`.
- [ ] **Step 4.2: Verify Carol's client dropdown permissions**
  - Click **People** in the sidebar.
  - Inspect the **Assigned Role** dropdown in the "Add Person" card.
  - **Expected Result:** The only selectable option is `Employee`.
- [ ] **Step 4.3: Server enforcement test for HR (Tampering / Direct API call)**
  - Using Carol's authenticated session, attempt to invite an HR or Manager:
    ```http
    POST /api/orgs/members/invite
    Content-Type: application/json

    { "email": "unauth@example.com", "role": "MANAGER" }
    ```
  - **Expected Result:** Server responds with `403 Forbidden`:
    `{ "error": "Forbidden: You do not have permission to invite members as MANAGER" }`
  - Try inviting an Executive:
    ```http
    POST /api/orgs/members/invite
    Content-Type: application/json

    { "email": "unauth2@example.com", "role": "EXECUTIVE" }
    ```
  - **Expected Result:** Server responds with `403 Forbidden`.
- [ ] **Step 4.4: Dave (Manager) accepts invitation and verifies restrictions**
  - Sign in as **Dave** (`dave@example.com`).
  - Accept invitation on `/home`.
  - Navigate to **People** in `/workspace`.
  - Verify role dropdown displays only `Employee`.
  - Using Dave's session, attempt to send `POST /api/orgs/members/invite` with `"role": "HR"`.
  - **Expected Result:** Server responds with `403 Forbidden`.
- [ ] **Step 4.5: Employee has no invite capability**
  - Sign in as **Eve** (`eve@example.com`) after accepting her employee invitation.
  - Verify the **People** link is **NOT visible** in the sidebar navigation.
  - Attempting `POST /api/orgs/members/invite` with Eve's session returns `403 Forbidden`.

---

### Scenario 5: A user from another company cannot read this company's data

**Objective:** Verify strict multi-tenant database isolation. A member of Company Beta cannot read tasks, leave requests, projects, or member lists of Company Alpha.

- [ ] **Step 5.1: Create Company Beta**
  - Sign in as **Bob** (`bob@example.com`).
  - Navigate to `/create-company`.
  - Create company: Name `"Beta Global"`, Handle `"beta-global"`.
  - Bob becomes Executive of Beta Global.
- [ ] **Step 5.2: Create confidential data in Company Alpha**
  - As **Alice** (Executive of Acme Innovations):
    - Create a company task: `"Alpha Secret Patent"`.
    - Create an organization risk: `"High Competitor Risk"`.
    - Create a contract: `"Alpha Vendor Deal"`.
- [ ] **Step 5.3: Verify Company Beta cannot read Company Alpha data**
  - As **Bob** (Beta Global):
    - Check `/workspace` (or call `GET /api/bootstrap`).
    - Verify tasks list does **NOT** contain `"Alpha Secret Patent"`.
    - Verify risks does **NOT** contain `"High Competitor Risk"`.
    - Call `GET /api/orgs/members`. Verify response contains only Bob, not Alice, Carol, Dave, or Eve.
- [ ] **Step 5.4: Cross-tenant task access attempt**
  - Using the ID of `"Alpha Secret Patent"` (`task_alpha_id`), send request using Bob's session:
    ```http
    PATCH /api/tasks/task_alpha_id
    Content-Type: application/json

    { "status": "DONE" }
    ```
  - **Expected Result:** Server responds with `403 Forbidden` (`{ "error": "Forbidden" }`).
  - Attempt to delete Alpha's task using Bob's session:
    ```http
    DELETE /api/tasks/task_alpha_id
    ```
  - **Expected Result:** Server responds with `403 Forbidden`.

---

### Scenario 6: An invitation for another email cannot be accepted

**Objective:** Verify that an invitation token cannot be hijacked or accepted by an account with an email address different from the one to which the invitation was issued.

- [ ] **Step 6.1: Issue invitation to a specific email**
  - As **Alice**, send an invitation to `frank@example.com` with role `Employee`.
  - Capture the generated invitation ID or token from `GET /api/orgs/members` (e.g. `token_frank_123`).
- [ ] **Step 6.2: Intruder attempts to accept Frank's invitation**
  - Sign in as **Bob** (`bob@example.com`) or any user whose email is not `frank@example.com`.
  - Send accept request using Bob's session:
    ```http
    POST /api/invitations/token_frank_123/accept
    ```
  - **Expected Result:** Server responds with `403 Forbidden`:
    `{ "error": "This invitation is intended for frank@example.com. You are signed in as bob@example.com." }`
  - Verify Frank's invitation remains `PENDING` in the database.
  - Verify Bob does **NOT** receive membership in Acme Innovations.
- [ ] **Step 6.3: Rightful user accepts invitation**
  - Sign in with an account matching `frank@example.com`.
  - Send accept request:
    ```http
    POST /api/invitations/token_frank_123/accept
    ```
  - **Expected Result:** Server responds with `200 OK` (`{ "success": true, "company": { ... } }`).
  - Verify Frank's invitation status transitions to `ACCEPTED`.
  - Verify Frank receives a `Membership` record with `role: "EMPLOYEE"` in Acme Innovations.

---

## Edge Case & Error Handling Verification

| Test Case | Trigger | Expected Status Code | Expected Behavior |
|---|---|---|---|
| **Duplicate Invite** | Send invite to an email that already has a `PENDING` non-expired invite | `409 Conflict` | Error: *"An invitation is already pending for this email address"* |
| **Invite Existing Member** | Send invite to an email already in the organization's membership | `409 Conflict` | Error: *"User is already a member of this organization"* |
| **Expired Invite** | Attempt to accept an invite past its 14-day `expiresAt` | `410 Gone` | Error: *"This invitation has expired"*; status updated to `REVOKED` |
| **Already In an Org** | A user who already belongs to Company Alpha attempts to accept an invite to Company Beta | `409 Conflict` | Error: *"You already belong to an organization. A user may belong to only one organization at a time."* |
| **Owner Deletion Protection** | Executive attempts to remove the organization creator | `403 Forbidden` | Error: *"The organization owner/creator cannot be removed"* |
| **Self Deletion Protection** | User attempts to delete their own membership via member removal route | `400 Bad Request` | Error: *"You cannot remove yourself from the organization here"* |
| **Revoke Invite** | Org admin clicks Revoke on a pending invite | `200 OK` | Invitation status transitions to `REVOKED`; disappears from pending list |
