# HeimDall API Specification

## 1. Overview

The HeimDall API provides the backend interface for the company workspace and contract intelligence platform.

The API is responsible for:

- Authentication and user management
- Company and role-based access
- Contract management
- Contract document access
- AI-based contract analysis
- Clause and risk information
- Obligation management
- Notifications
- Dashboard data
- Contract reports

The API is designed around a single backend with clearly separated internal modules.

All protected resources are scoped to the user's company.

---

## 2. API Design

### Base URL

```text
/api/v1
```

Example:

```text
/api/v1/contracts
```

### API Format

Requests and responses use JSON unless the endpoint specifically handles file uploads or file downloads.

### Authentication

Protected endpoints use JWT authentication.

```http
Authorization: Bearer <access_token>
```

The API uses access and refresh tokens.

### Authorization

Role-based access control is applied at the API level.

Initial roles:

```text
Admin
HR / Legal
Employee
```

The frontend should only show actions available to a user's role, but the backend remains responsible for enforcing the permission.

---

# 3. API Conventions

## 3.1 HTTP Methods

| Method | Purpose |
|---|---|
| GET | Retrieve resources |
| POST | Create a resource or trigger an action |
| PATCH | Partially update a resource |
| DELETE | Remove a resource |

## 3.2 Common Status Codes

| Status | Meaning |
|---|---|
| 200 | Request completed successfully |
| 201 | Resource created successfully |
| 202 | Request accepted for background processing |
| 204 | Request completed with no response body |
| 400 | Invalid request |
| 401 | Authentication required or invalid |
| 403 | User does not have permission |
| 404 | Resource not found |
| 409 | Resource conflict |
| 422 | Request validation failed |
| 500 | Internal server error |

## 3.3 Validation

FastAPI and Pydantic schemas are used to validate request and response data.

Invalid request data should return a structured validation response.

---

# 4. Authentication and Users API

## 4.1 Register Company

### `POST /auth/register`

Creates a new company workspace and its first administrator account.

**Access:** Public

### Purpose

Used during initial company onboarding.

### Request

The request should contain the initial company and administrator information.

### Result

Creates:

```text
Company
+
Admin User
```

---

## 4.2 Login

### `POST /auth/login`

Authenticates a user and issues access and refresh tokens.

**Access:** Public

### Result

The client receives:

```text
Access Token
Refresh Token
```

The access token is used for protected API requests.

---

## 4.3 Refresh Token

### `POST /auth/refresh`

Exchanges a valid refresh token for a new access token.

**Access:** Authenticated

---

## 4.4 Current User

### `GET /users/me`

Returns the signed-in user's profile and role.

**Access:** Authenticated

### Information

The response should include information needed by the frontend to identify the current user and determine the available role-based interface.

---

## 4.5 Invite User

### `POST /users/invite`

Invites a teammate to the company workspace.

**Access:** Admin

### Purpose

Allows an administrator to add another user to the organization.

---

## 4.6 List Users

### `GET /users`

Returns users belonging to the current company.

**Access:** Admin, HR / Legal

### Scope

The response must only contain users belonging to the authenticated user's company.

---

# 5. Contracts API

Contracts are the main resource handled by HeimDall.

---

## 5.1 Upload Contract

### `POST /contracts`

Uploads a new contract and queues it for AI analysis.

**Access:** Admin, HR / Legal

### Processing Flow

```text
Upload
   ↓
Store Document
   ↓
Queue Analysis
   ↓
OCR if Required
   ↓
Extract Clauses
   ↓
Extract Obligations
   ↓
Identify Risks
   ↓
Generate Summary
```

The AI processing may run asynchronously.

### Expected Contract Information

The contract record can contain:

- Title
- Category
- Status
- Owner
- Company
- Upload date
- Start date
- End date
- Renewal information
- AI-generated summary
- Processing status

---

## 5.2 List Contracts

### `GET /contracts`

Returns contracts belonging to the current company.

**Access:** Authenticated

### Filters

The endpoint should support filtering by:

```text
status
risk level
expiry window
```

Example:

```text
GET /api/v1/contracts?status=active
```

The exact query parameter format can be finalized during implementation.

---

## 5.3 Get Contract

### `GET /contracts/{id}`

Returns contract details, metadata, and the AI-generated summary.

**Access:** Authenticated, company scoped

### Important

A user must not be able to access a contract belonging to another company.

---

## 5.4 Get Contract File

### `GET /contracts/{id}/file`

Provides access to the original contract document.

**Access:** Authenticated, company scoped

The document should not be exposed through a public static path.

For deployed environments, the API should provide controlled access to the original file.

---

## 5.5 Reanalyze Contract

### `POST /contracts/{id}/reanalyze`

Runs AI extraction again for an existing contract.

**Access:** Admin, HR / Legal

### Use Cases

- AI processing failed
- Contract was manually corrected
- Extraction needs to be refreshed
- AI pipeline has been updated

---

## 5.6 Delete Contract

### `DELETE /contracts/{id}`

Removes a contract.

**Access:** Admin

Deleting a contract should also consider related clauses, obligations, AI data, and stored files according to the application's data retention rules.

---

# 6. Clauses and Risk API

## 6.1 List Contract Clauses

### `GET /contracts/{id}/clauses`

Returns clauses extracted from a contract.

**Access:** Authenticated, company scoped

Each clause should contain information such as:

```text
Clause
Clause Type
Plain-language Explanation
```

---

## 6.2 List Contract Risks

### `GET /contracts/{id}/risks`

Returns AI-flagged risk items for a contract.

**Access:** Authenticated, company scoped

Risk information should include:

```text
Risk
Severity
Reasoning
```

AI-generated risk information should be treated as an assistive result for human review, not as definitive legal advice.

---

# 7. Obligations API

Obligations represent specific duties or deadlines extracted from contracts.

---

## 7.1 List Contract Obligations

### `GET /contracts/{id}/obligations`

Returns obligations extracted from a specific contract.

**Access:** Authenticated, company scoped

An obligation may contain:

```text
Description
Assignee
Due Date
Status
Source Contract
```

---

## 7.2 Cross-Contract Obligation Feed

### `GET /obligations`

Returns obligations across the current company.

**Access:** Authenticated

### Filters

The endpoint should support filtering by:

```text
assignee
due date
status
```

Example:

```text
GET /api/v1/obligations?status=overdue
```

---

## 7.3 Update Obligation

### `PATCH /obligations/{id}`

Updates an obligation.

**Access:** Assignee, Admin

Supported fields include:

```text
status
due date
assignee
```

The backend must verify that the requesting user is allowed to modify the obligation.

---

## 7.4 Complete Obligation

### `POST /obligations/{id}/complete`

Marks an obligation as fulfilled.

**Access:** Assignee

This action should create an activity record.

---

# 8. AI Assistant API

The AI API provides contract-specific question answering and summary generation.

---

## 8.1 Ask About a Contract

### `POST /contracts/{id}/ask`

Allows an authenticated user to ask a natural-language question about a specific contract.

**Access:** Authenticated, company scoped

### Processing

```text
User Question
      ↓
Authentication
      ↓
Permission Check
      ↓
Contract Retrieval
      ↓
Vector / Semantic Search
      ↓
Relevant Contract Context
      ↓
LLM
      ↓
Answer
```

The retrieval process should only use information the user is authorized to access.

### Example Questions

```text
What is the renewal period?

Who is responsible for this obligation?

When does this contract expire?

Summarize the termination clause.
```

---

## 8.2 Regenerate Contract Summary

### `POST /contracts/{id}/summary`

Regenerates the plain-language summary of a contract.

**Access:** Admin, HR / Legal

This endpoint should trigger the contract summary generation process using the current contract content.

---

# 9. Notifications API

Notifications inform users about deadlines, contract events, and other relevant activity.

---

## 9.1 List Notifications

### `GET /notifications`

Returns notifications for the signed-in user.

**Access:** Authenticated

Notifications may be generated for:

```text
Upcoming obligation
Overdue obligation
Contract expiry
Contract renewal
Task-related events
Other supported system events
```

---

## 9.2 Mark Notification as Read

### `PATCH /notifications/{id}/read`

Marks a notification as read.

**Access:** Authenticated

The user must only be able to modify their own notifications.

---

# 10. Dashboard API

## 10.1 Dashboard Summary

### `GET /dashboard/summary`

Returns aggregate information for the authenticated user's company.

**Access:** Authenticated

### Expected Information

The dashboard should provide information such as:

```text
Contract Count
Contracts Expiring Soon
Overdue Obligations
Risk Breakdown
```

Additional metrics may be added as the dashboard develops.

---

# 11. Reports API

## 11.1 Contract Report

### `GET /reports/contracts`

Provides an exportable report containing contract and obligation status.

**Access:** Admin, HR / Legal

The report should include information relevant to:

```text
Contracts
Contract Status
Obligations
Obligation Status
Due Dates
Risk Information
```

The exact export format can be finalized during implementation.

---

# 12. Endpoint Summary

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create company and first admin |
| POST | `/auth/login` | Public | Authenticate user |
| POST | `/auth/refresh` | Authenticated | Refresh access token |
| GET | `/users/me` | Authenticated | Get current user |
| POST | `/users/invite` | Admin | Invite teammate |
| GET | `/users` | Admin, HR / Legal | List company users |
| POST | `/contracts` | Admin, HR / Legal | Upload contract |
| GET | `/contracts` | Authenticated | List contracts |
| GET | `/contracts/{id}` | Authenticated | Get contract |
| GET | `/contracts/{id}/file` | Authenticated | Access contract file |
| POST | `/contracts/{id}/reanalyze` | Admin, HR / Legal | Re-run AI analysis |
| DELETE | `/contracts/{id}` | Admin | Delete contract |
| GET | `/contracts/{id}/clauses` | Authenticated | List clauses |
| GET | `/contracts/{id}/risks` | Authenticated | List risks |
| GET | `/contracts/{id}/obligations` | Authenticated | List contract obligations |
| GET | `/obligations` | Authenticated | List obligations |
| PATCH | `/obligations/{id}` | Assignee, Admin | Update obligation |
| POST | `/obligations/{id}/complete` | Assignee | Complete obligation |
| POST | `/contracts/{id}/ask` | Authenticated | Ask AI about contract |
| POST | `/contracts/{id}/summary` | Admin, HR / Legal | Generate summary |
| GET | `/notifications` | Authenticated | List notifications |
| PATCH | `/notifications/{id}/read` | Authenticated | Mark notification as read |
| GET | `/dashboard/summary` | Authenticated | Get dashboard metrics |
| GET | `/reports/contracts` | Admin, HR / Legal | Export contract report |

---

# 13. API Security Requirements

Security is required even for the MVP because contracts and company information are sensitive.

## Authentication

- Passwords must never be stored in plaintext.
- Passwords must be securely hashed.
- Protected endpoints must require valid authentication.
- Access tokens must have an appropriate expiration period.
- Refresh tokens must be handled securely.

## Authorization

- Every protected write endpoint must verify the user's role.
- Resource access must be company scoped.
- A user must not be able to access another company's contracts, users, obligations, or notifications.
- Backend authorization must not depend only on frontend UI restrictions.

## Contract Files

Contract files should not be publicly accessible.

For production storage, files should be served through signed, time-limited URLs or an equivalent controlled mechanism.

## Secrets

API keys, database credentials, JWT secrets, and other sensitive configuration must be stored in environment variables or a secure secret-management system.

They must never be committed to GitHub.

---

# 14. AI Security Requirements

The AI Assistant must follow the same access rules as the rest of the application.

```text
User
 ↓
Authentication
 ↓
Role Check
 ↓
Resource Permission Check
 ↓
Retrieve Authorized Contract Data
 ↓
RAG
 ↓
LLM
 ↓
Response
```

If a user is not authorized to access a contract, the AI must not:

- Summarize it
- Answer questions about it
- Retrieve its clauses
- Retrieve its obligations
- Expose information from it indirectly

---

# 15. Background Processing

Contract analysis may take longer than a normal API request.

The preferred flow is:

```text
POST /contracts
       ↓
Contract Stored
       ↓
Analysis Queued
       ↓
HTTP 202 Accepted
       ↓
Background Processing
       ↓
OCR
       ↓
Extraction
       ↓
AI Analysis
       ↓
Database Updated
```

The frontend can use the contract status to determine whether processing has completed.

Possible processing states:

```text
Uploaded
Processing
Completed
Failed
```

---

# 16. API and Data Ownership

The API operates over the following primary entities:

| Entity | Purpose |
|---|---|
| Company | Organization using HeimDall |
| User | User account and role |
| Contract | Uploaded contract and metadata |
| ContractClause | Extracted contract clause |
| ContractObligation | Contract duty or deadline |
| Notification | User reminder or alert |
| ActivityLog | Record of important actions |

Relationship overview:

```text
Company
  │
  ├── Users
  │
  ├── Contracts
  │     ├── Clauses
  │     ├── Risks
  │     └── Obligations
  │
  ├── Notifications
  │
  └── Activity Logs
```

---

# 17. Activity Logging

Important API actions should create activity log records.

Examples:

```text
User Login
User Invited
Contract Uploaded
Contract Reanalyzed
Contract Deleted
Obligation Updated
Obligation Completed
AI Action Executed
```

An activity record should contain enough information to identify:

```text
Actor
Action
Resource
Timestamp
```

---

# 18. API Documentation

FastAPI should generate OpenAPI documentation automatically.

During development, the API documentation can be exposed through the standard FastAPI documentation interfaces.

The generated API documentation should be kept synchronized with the implemented endpoints and schemas.

---

# 19. MVP API Scope

The following endpoints are required for the initial four-week MVP.

## Authentication

```text
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /users/me
```

## Users

```text
POST /users/invite
GET  /users
```

## Contracts

```text
POST   /contracts
GET    /contracts
GET    /contracts/{id}
GET    /contracts/{id}/file
POST   /contracts/{id}/reanalyze
DELETE /contracts/{id}
```

## Contract Intelligence

```text
GET /contracts/{id}/clauses
GET /contracts/{id}/risks
GET /contracts/{id}/obligations
POST /contracts/{id}/ask
POST /contracts/{id}/summary
```

## Obligations

```text
GET   /obligations
PATCH /obligations/{id}
POST  /obligations/{id}/complete
```

## Notifications

```text
GET   /notifications
PATCH /notifications/{id}/read
```

## Dashboard and Reports

```text
GET /dashboard/summary
GET /reports/contracts
```

---

# 20. Out of Scope for the MVP

The following are intentionally excluded from the first API version:

- Native mobile application APIs
- Payment gateway APIs
- Subscription billing APIs
- Slack integration
- Google Workspace integration
- Microsoft 365 integration
- Calendar synchronization
- Multi-language contract parsing
- Advanced enterprise SSO
- External business system integrations

These can be introduced as separate API modules after the core contract workflow is stable.

---

# 21. Core API Workflow

The main HeimDall workflow connects the API resources in this order:

```text
Company Registration
        ↓
User Authentication
        ↓
Contract Upload
        ↓
AI Processing
        ↓
Clauses / Risks / Obligations
        ↓
Obligation Assignment
        ↓
Notifications
        ↓
Dashboard
        ↓
AI Questions / Reports
```

The API exists primarily to make this workflow reliable, secure, and easy for the frontend to consume.

---

## 22. Final API Goal

The first version of the HeimDall API should provide a clean and secure foundation for the contract intelligence MVP.

The most important requirement is not the number of endpoints. It is that the complete workflow works correctly:

```text
Upload
  ↓
Understand
  ↓
Extract
  ↓
Assign
  ↓
Remind
  ↓
Track
  ↓
Report
```

The API should remain modular enough that future HeimDall features can be added without redesigning the entire backend.
