# HeimDall Manual Testing Checklist & Verification Guide

This document provides a manual test checklist and verification procedures for the multi-tenant personal workspace, multi-organization membership, company registration, active organization switching, role-based access control (RBAC), and team management features in **HeimDall**.

---

## Prerequisites & Test Personas

To execute the full manual checklist, prepare test accounts (or sign in with distinct Google/GitHub OAuth accounts, or use simulated session cookies in separate incognito browser windows):

| Persona | Email | Purpose |
|---|---|---|
| **User A (Alice)** | `alice@example.com` | Individual user (Personal workspace), Executive in Company Alpha, and Employee in Company Beta |
| **User B (Bob)** | `bob@example.com` | Individual user & Executive in Company Beta |
| **User C (Carol)** | `carol@example.com` | HR in Company Alpha |
| **User D (Dave)** | `dave@example.com` | Manager in Company Alpha |
| **User E (Eve)** | `eve@example.com` | Employee in Company Alpha |

---

## Core Verification Scenarios

### Scenario 1: Two personal users cannot see each other's tasks

**Objective:** Verify that personal tasks created by User A are strictly isolated from User B, and neither user can view, edit, or delete the other's personal tasks.

- [ ] **Step 1.1: Alice creates personal tasks**
  - Sign in as **Alice** (`alice@example.com`). With no active company, Alice is directed to `/home`.
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

**Objective:** Verify that an individual user can register a new company via `/create-company` and `POST /api/orgs`, automatically receiving the `EXECUTIVE` membership role, setting the active `hd-org` cookie, and landing on the executive dashboard with proper empty states.

- [ ] **Step 2.1: Open registration page**
  - Signed in as **Alice**, navigate to `/create-company` (or click **"Create a company"** from `/home` or top bar switcher).
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
  - Verify `hd-org` HTTP-only cookie is set to Acme Innovations ID.
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
- [ ] **Step 2.5: Duplicate handle rejection & multi-org capability**
  - Try creating another company with the same slug `"acme-corp"`:
    ```http
    POST /api/orgs
    Content-Type: application/json

    { "name": "Another Acme", "slug": "acme-corp" }
    ```
  - **Expected Result:** Server responds with `409 Conflict` (`"An organization with this handle already exists"`).
  - Create a second company with a unique slug:
    ```http
    POST /api/orgs
    Content-Type: application/json

    { "name": "Second Venture", "slug": "second-venture" }
    ```
  - **Expected Result:** Server responds with `201 Created`. Alice is now Executive in both companies.

---

### Scenario 3: Executive invites an HR, a Manager, and an Employee

**Objective:** Verify that an Executive can invite team members across all authorized roles (`HR`, `MANAGER`, `EMPLOYEE`), creating pending invitations with unique tokens and 14-day expiration.

- [ ] **Step 3.1: Navigate to People view**
  - In Alice's workspace sidebar, click **People**.
  - Verify the **"People & Team"** management screen opens.
- [ ] **Step 3.2: Verify Executive role dropdown options**
  - Click the **Assigned Role** dropdown in the "Add Person" card.
  - Verify options available: **Employee**, **Manager**, **HR** (Executive is NOT in the dropdown).
- [ ] **Step 3.3: Send HR invitation**
  - Email: `carol@example.com`, Role: `HR`. Click **Send Invitation**.
  - Verify `POST /api/orgs/members/invite` returns `201 Created`.
  - Verify inline success banner appears:
    > *"Invitation sent for carol@example.com! Ask them to sign in to HeimDall with this email."*
- [ ] **Step 3.4: Send Manager invitation**
  - Email: `dave@example.com`, Role: `Manager`. Click **Send Invitation**.
  - Verify `POST /api/orgs/members/invite` returns `201 Created`.
- [ ] **Step 3.5: Send Employee invitation**
  - Email: `eve@example.com`, Role: `Employee`. Click **Send Invitation**.
  - Verify `POST /api/orgs/members/invite` returns `201 Created`.
- [ ] **Step 3.6: Verify pending invitation list**
  - Verify all 3 invitations appear in the **Pending Invitations** table with their respective roles, 14-day expiry countdown, and active **Revoke** action buttons.

---

### Scenario 4: HR and Manager can invite only Employees, and server rejects other roles

**Objective:** Verify client dropdown restriction and server-side RBAC enforcement preventing HR and Managers from inviting roles above Employee.

- [ ] **Step 4.1: Carol (HR) signs in and accepts invite**
  - Sign in as `carol@example.com`.
  - Carol sees the invitation banner for Acme Innovations (Role: HR).
  - Click **Accept & Join**. Carol becomes HR in Acme Innovations.
- [ ] **Step 4.2: Carol inspects the Add Person form**
  - Open **People** view.
  - Inspect the **Assigned Role** dropdown.
  - **Expected UI Result:** Only **Employee** is selectable. HR and Manager options are absent.
- [ ] **Step 4.3: Server RBAC bypass attempt by HR**
  - Send direct API request with Carol's session attempting to invite an HR:
    ```http
    POST /api/orgs/members/invite
    Content-Type: application/json

    { "email": "malicious_hr@example.com", "role": "HR" }
    ```
  - **Expected Result:** Server rejects with `403 Forbidden`:
    `{ "error": "Forbidden: You do not have permission to invite members as HR" }`
- [ ] **Step 4.4: Dave (Manager) attempts to invite Manager**
  - Sign in as `dave@example.com`, accept Manager invite. Open **People** view.
  - Send direct API request with Dave's session attempting to invite a Manager:
    ```http
    POST /api/orgs/members/invite
    Content-Type: application/json

    { "email": "malicious_mgr@example.com", "role": "MANAGER" }
    ```
  - **Expected Result:** Server rejects with `403 Forbidden`:
    `{ "error": "Forbidden: You do not have permission to invite members as MANAGER" }`
- [ ] **Step 4.5: Executive bypass attempt (inviting Executive)**
  - Send API request with Alice's session attempting to invite an Executive:
    ```http
    POST /api/orgs/members/invite
    Content-Type: application/json

    { "email": "co_exec@example.com", "role": "EXECUTIVE" }
    ```
  - **Expected Result:** Server rejects with `403 Forbidden`:
    `{ "error": "Forbidden: You do not have permission to invite members as EXECUTIVE" }`

---

### Scenario 5: User from another company cannot read this company's data

**Objective:** Verify tenant isolation so that users in Company Beta cannot read tasks, projects, risks, or member lists from Company Alpha.

- [ ] **Step 5.1: Create Company Beta with Bob as Executive**
  - Sign in as **Bob** (`bob@example.com`), create `"Beta Corp"` (`beta-corp`).
  - Create a private company task in Beta Corp: `"Beta Secret Deliverable"`.
- [ ] **Step 5.2: Query Company Alpha data using Bob's session**
  - Call `GET /api/bootstrap` using Bob's session.
  - Verify tasks returned only contain `"Beta Secret Deliverable"`. No tasks from Acme Innovations appear.
- [ ] **Step 5.3: Cross-tenant task mutation attempt**
  - Attempt to update Alice's company task `task_alpha_1` using Bob's session:
    ```http
    PATCH /api/tasks/task_alpha_1
    Content-Type: application/json

    { "status": "DONE" }
    ```
  - **Expected Result:** Server responds with `403 Forbidden` (`{ "error": "Forbidden" }`).

---

### Scenario 6: Invitation for another email cannot be accepted

**Objective:** Verify that an invitation issued for email X cannot be claimed by email Y.

- [ ] **Step 6.1: Alice invites Frank**
  - Alice invites `frank@example.com` as Employee to Acme Innovations.
  - Capture the generated token (e.g. `token_frank_123`).
- [ ] **Step 6.2: Intruder attempts to accept Frank's invitation**
  - Sign in as **Bob** (`bob@example.com`).
  - Send accept request using Bob's session:
    ```http
    POST /api/invitations/token_frank_123/accept
    ```
  - **Expected Result:** Server responds with `403 Forbidden`:
    `{ "error": "This invitation is intended for frank@example.com. You are signed in as bob@example.com." }`
  - Frank's invite remains `PENDING`. Bob does NOT join Acme Innovations.
- [ ] **Step 6.3: Rightful user accepts invitation**
  - Sign in as `frank@example.com`, call `POST /api/invitations/token_frank_123/accept`.
  - **Expected Result:** Server responds with `200 OK`. Frank receives Membership and `hd-org` cookie is set to Acme Innovations.

---

### Scenario 7: Multi-Organization Switching & Tenant Isolation

**Objective:** Verify that a user belonging to multiple companies sees only the active company's data, can switch active organizations via the top bar dropdown or `POST /api/orgs/switch`, and the active organization is persisted via the `hd-org` cookie.

- [ ] **Step 7.1: Setup user with two memberships**
  - Sign in as **Alice**. Alice is Executive in **Acme Innovations** and accepts an Employee invitation in **Beta Corp**.
- [ ] **Step 7.2: Verify top bar company switcher**
  - In `/workspace`, inspect the company switcher in the header.
  - Verify options listed:
    - `"Acme Innovations: Executive"`
    - `"Beta Corp: Employee"`
    - `"Personal space"`
    - `"Create a company"`
- [ ] **Step 7.3: Switch active company to Beta Corp**
  - Select `"Beta Corp: Employee"` from the switcher.
  - Verify loading indicator appears (`"Switching..."`).
  - Verify network call: `POST /api/orgs/switch { "organizationId": "beta_corp_id" }` returns `200 OK`.
  - Verify `hd-org` cookie is updated to Beta Corp's ID.
  - Verify dashboard updates: top bar shows `Beta Corp / Employee View`. Only Beta Corp tasks and data are displayed.
- [ ] **Step 7.4: Switch to Personal space**
  - Select `"Personal space"` from the switcher.
  - Verify network call: `POST /api/orgs/switch { "organizationId": null }` returns `200 OK`.
  - Verify redirection to `/home`. Personal tasks and profile card are displayed.
- [ ] **Step 7.5: Re-enter company from personal home**
  - On `/home`, use the top bar switcher to select `"Acme Innovations: Executive"`.
  - Verify redirection to `/workspace` with Acme Innovations active.

---

### Scenario 8: Switching to an unjoined company returns 403

**Objective:** Verify that forged or unauthorized company switch attempts are strictly rejected.

- [ ] **Step 8.1: Send switch request for unauthorized organization ID**
  - With Alice's session, send:
    ```http
    POST /api/orgs/switch
    Content-Type: application/json

    { "organizationId": "org_unjoined_random_id" }
    ```
  - **Expected Result:** Server responds with `403 Forbidden`:
    `{ "error": "You are not a member of this organization" }`
  - Verify `hd-org` cookie remains untouched.

---

### Scenario 9: Roles evaluated per company

**Objective:** Verify that permissions are evaluated based on the active company's membership role.

- [ ] **Step 9.1: Test Executive actions in Acme Innovations**
  - With Acme Innovations active (Role: `EXECUTIVE`), Alice accesses `exec.reports` and sends member invites. All succeed.
- [ ] **Step 9.2: Test restricted actions in Beta Corp**
  - Switch to Beta Corp (Role: `EMPLOYEE`).
  - Attempt to access `exec.reports` or invite members:
    ```http
    POST /api/orgs/members/invite
    Content-Type: application/json

    { "email": "test@example.com", "role": "EMPLOYEE" }
    ```
  - **Expected Result:** Server responds with `403 Forbidden`:
    `{ "error": "Forbidden: You do not have permission to invite members as EMPLOYEE" }`

---

### Scenario 10: Sole Executive safety rules & leaving an organization

**Objective:** Verify that a user who is the only Executive cannot leave or be removed from the company (409 Conflict), but non-sole executives and employees can leave.

- [ ] **Step 10.1: Sole Executive attempts to leave**
  - While Alice is the only Executive of Acme Innovations, Alice opens **Settings** (or clicks **Leave** in People view).
  - Confirm leave action.
  - Network request: `POST /api/orgs/leave`.
  - **Expected Result:** Server responds with `409 Conflict`:
    `{ "error": "Cannot leave organization: You are the only Executive. You must promote another member to Executive first." }`
  - Inline error banner displays the message. Alice remains Executive.
- [ ] **Step 10.2: Attempt to remove sole Executive**
  - HR or another user attempts `DELETE /api/orgs/members/alice_membership_id`.
  - **Expected Result:** Server responds with `409 Conflict`:
    `{ "error": "Cannot remove the only Executive of this organization. Promote another member to Executive first." }`
- [ ] **Step 10.3: Promote another member and leave**
  - Promote Carol to `EXECUTIVE`. Acme Innovations now has two Executives.
  - Alice clicks **Leave this organization**.
  - **Expected Result:** `POST /api/orgs/leave` returns `200 OK`. Alice's membership in Acme Innovations is deleted.
  - Active cookie switches to Alice's next company or personal space (`/home`).

---

## Edge Case & Error Handling Verification

| Test Case | Trigger | Expected Status Code | Expected Behavior |
|---|---|---|---|
| **Duplicate Invite** | Send invite to an email that already has a `PENDING` non-expired invite | `409 Conflict` | Error: *"An invitation is already pending for this email address"* |
| **Invite Existing Member** | Send invite to an email already in this organization's membership | `409 Conflict` | Error: *"User is already a member of this organization"* |
| **Expired Invite** | Attempt to accept an invite past its 14-day `expiresAt` | `410 Gone` | Error: *"This invitation has expired"*; status updated to `REVOKED` |
| **Switch to Unjoined Org** | User calls `/api/orgs/switch` with an organization ID they do not belong to | `403 Forbidden` | Error: *"You are not a member of this organization"* |
| **Sole Executive Leave** | Sole Executive calls `/api/orgs/leave` | `409 Conflict` | Error: *"Cannot leave organization: You are the only Executive..."* |
| **Sole Executive Remove** | Admin attempts to delete the sole Executive | `409 Conflict` | Error: *"Cannot remove the only Executive of this organization..."* |
| **Revoke Invite** | Org admin clicks Revoke on a pending invite | `200 OK` | Invitation status transitions to `REVOKED`; disappears from pending list |
