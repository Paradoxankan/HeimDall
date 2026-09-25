<p align="center"><img src="./assets/heimdall-logo.png" alt="HeimDall Logo" width="260" /></p>

# HeimDall - System Architecture

> **Architecture & Technical Design Documentation**

HeimDall is being built as a single-page web application with a centralized **FastAPI backend**. The backend coordinates authentication, contracts, obligations, tasks, PostgreSQL, the AI/document-processing layer, file storage, and notifications.

This document describes the planned architecture, technology choices, request flow, contract-processing pipeline, and core data entities for the HeimDall MVP.

---

## 1. System Overview

At a high level, HeimDall follows this architecture:

```text
┌──────────────────────┐
│   Browser / Web App  │
│    SPA Frontend      │
└──────────┬───────────┘
           │
           │ HTTPS / JSON
           ▼
┌──────────────────────────────────┐
│         FastAPI Backend          │
│                                  │
│ Auth • Contracts • Obligations   │
│ Tasks • Business Logic           │
└───────┬──────────┬──────────┬────┘
        │          │          │
        ▼          ▼          ▼
┌────────────┐ ┌───────────┐ ┌──────────────┐
│ PostgreSQL │ │ AI Layer  │ │ File Storage │
│            │ │           │ │              │
│ Users      │ │ OCR       │ │ Contract PDFs│
│ Roles      │ │ RAG       │ │ Uploaded     │
│ Contracts  │ │ LLM       │ │ documents    │
│ Obligations│ │           │ │              │
│ Tasks      │ │           │ │              │
│ Logs       │ │           │ │              │
└────────────┘ └───────────┘ └──────────────┘
        │          │
        └────┬─────┘
             ▼
┌──────────────────────────┐
│    Notification Engine   │
│                          │
│ Email / In-app Alerts    │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ Browser Dashboard &      │
│ Alerts Update             │
└──────────────────────────┘
```

The **backend is the central access layer**. The browser does not communicate directly with PostgreSQL, the AI layer, or file storage. Frontend data is returned through the REST API.

---

## 2. Architecture Principles

### Centralized Backend

The FastAPI backend is responsible for coordinating the major application services.

```text
Browser
   ↓
FastAPI
   ↓
Database / AI / Storage / Notifications
```

This keeps business logic and access control on the server rather than exposing internal services directly to the client.

### API-Driven Frontend

The web client communicates with the backend through:

```text
REST API
HTTPS
JSON
```

The frontend renders data returned by the API.

### Permission-Aware Access

Authentication and role-based access control are handled by the backend.

A user should only be able to access contracts and organizational information they are authorized to see.

### AI Grounded in Contract Data

Contract-related AI responses use an:

```text
OCR → RAG → LLM
```

pipeline so that extracted information and answers are grounded in the specific contract being processed.

---

# 3. Planned Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Backend | **FastAPI / Python** | API, authentication, business logic |
| Frontend | **HTML / CSS / JavaScript / React** | Web application interface |
| Database | **PostgreSQL** | Users, contracts, obligations, tasks, logs |
| Authentication | **JWT + OAuth2 password flow + cryptographic hashing** | Authentication and role-based access |
| Authorization | **Role-Based Access Control** | Control access to organizational data |
| AI / Document Processing | **OCR → RAG → LLM** | Contract text extraction and analysis |
| File Storage | **Object storage bucket** | Uploaded PDFs and supporting documents |
| Hosting | **Render + static frontend hosting** | Application deployment |

---

# 4. Why These Technologies?

## FastAPI + Python

FastAPI is the planned backend framework.

It provides:

- Python-based development
- Async request handling
- Automatic OpenAPI documentation
- A suitable API layer for the MVP

---

## HTML / CSS / JavaScript / React

The frontend is planned as a web application using HTML, CSS, JavaScript and React.

The goal is to provide a practical interface for:

- Authentication
- Contract management
- Task management
- Dashboards
- Notifications
- Organizational workflows

---

## PostgreSQL

PostgreSQL is used as the planned relational database.

The system contains strongly related entities such as:

```text
User
  ↓
Contract
  ↓
Clause
  ↓
Obligation
  ↓
Task
  ↓
Notification
```

A relational database is therefore used to maintain relationships and constraints between these records.

---

## JWT Authentication

Authentication is planned around:

```text
OAuth2 Password Flow
        +
JWT
        +
Cryptographic Password Hashing
        +
Role-Based Access Control
```

Document-level permissions are also enforced by the backend.

For example, an employee should not be able to access a contract simply because it exists in the system.

---

# 5. AI / Document Processing Architecture

Contract documents may arrive as native PDFs or scanned documents.

The planned processing pipeline is:

```text
Contract PDF
     │
     ▼
   OCR
     │
     ▼
Machine-readable text
     │
     ▼
   RAG
     │
     ▼
   LLM
     │
     ▼
Structured contract information
```

### OCR

If the uploaded PDF is scanned, OCR converts the document image into machine-readable text.

### RAG

Retrieval-Augmented Generation keeps the AI response grounded in the specific contract text instead of relying only on general model knowledge.

### LLM

The language model processes the grounded contract information to identify items such as:

- Parties
- Dates
- Obligations
- Clauses
- Potentially risky items

---

# 6. File Storage

Uploaded contract PDFs are stored in an object-storage system.

PostgreSQL stores the relevant metadata rather than large binary files.

```text
                    ┌──────────────┐
Upload PDF ────────►│ File Storage │
                    └──────────────┘
                           │
                           │ metadata
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    └──────────────┘
```

Keeping binary files outside the relational database helps keep database queries focused on structured data and allows the storage provider to be changed later without redesigning the database schema.

---

# 7. Request / Response Flow

Most normal application requests follow the same path:

```text
User
 │
 ▼
Browser
 │
 │ HTTPS / JSON
 ▼
FastAPI Backend
 │
 ├── Check JWT
 │
 ├── Determine user permissions
 │
 ├── Read/write PostgreSQL
 │
 └── Execute required business logic
 │
 ▼
JSON Response
 │
 ▼
Browser
 │
 ▼
UI Update
```

This flow covers common operations such as:

- Logging in
- Opening a contract
- Updating a task
- Viewing dashboard information

---

# 8. Contract Upload Data Flow

Contract upload is the main end-to-end workflow because it connects the web client, backend, storage, database, AI layer, tasks, and notifications.

## Step 1 - Upload

The user uploads a contract PDF through the browser.

```text
Browser
   │
   │ multipart POST
   ▼
FastAPI
```

---

## Step 2 - Store Contract

FastAPI:

1. Saves the raw PDF to file storage.
2. Creates a Contract record in PostgreSQL.
3. Sets the contract status to:

```text
processing
```

---

## Step 3 - OCR

If the PDF is scanned:

```text
PDF Image
   ↓
OCR
   ↓
Searchable/machine-readable text
```

Native documents can proceed with their available text.

---

## Step 4 - AI Processing

The extracted text enters the AI layer:

```text
Contract Text
     ↓
    RAG
     ↓
    LLM
     ↓
Parties
Dates
Clauses
Obligations
Risk-related information
```

RAG grounds the model's processing in the contract's own wording.

---

## Step 5 - Store Results

The backend stores the extracted information as structured records:

```text
Contract
 ├── Contract Clause
 └── Contract Obligation
```

The Contract status changes to:

```text
reviewed
```

---

## Step 6 - Generate Tasks

If an obligation contains a deadline:

```text
Contract Obligation
        ↓
       Task
        ↓
Assigned User / Department
        ↓
      Deadline
```

The task can therefore be generated automatically from the contract obligation.

---

## Step 7 - Notification

The notification engine detects the new task and queues a reminder for the assigned user.

```text
Task
 ↓
Notification Engine
 ↓
Email / In-app Alert
```

---

## Step 8 - Dashboard Update

The frontend refetches the contract dashboard.

The user can then see:

- Contract summary
- Extracted obligations
- Generated task
- Relevant alerts

### Complete Workflow

```text
┌─────────────┐
│ Contract PDF│
└──────┬──────┘
       ▼
┌─────────────┐
│   FastAPI   │
└──────┬──────┘
       ├──────────────► File Storage
       │
       ▼
┌─────────────┐
│     OCR     │
└──────┬──────┘
       ▼
┌─────────────┐
│     RAG     │
└──────┬──────┘
       ▼
┌─────────────┐
│     LLM     │
└──────┬──────┘
       ▼
┌──────────────────────────┐
│ Clauses + Obligations    │
└────────────┬─────────────┘
             ▼
       ┌──────────┐
       │   Task   │
       └────┬─────┘
            ▼
┌─────────────────────┐
│ Notification Engine │
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│ Dashboard / Alerts  │
└─────────────────────┘
```

---

# 9. Core Data Model

The current design identifies the following core entities.

## User

Represents the person logging into HeimDall.

A User has a role such as:

```text
Admin
Procurement
Employee
...
```

The role determines what the user can see and do.

---

## Contract

The central record created when a PDF is uploaded.

It contains information such as:

- Parties
- Start date
- End date
- Value
- Status

Example statuses include:

```text
processing
reviewed
expiring
```

---

## Contract Clause

An individual clause extracted from a Contract by the AI layer.

```text
Contract
   └── Contract Clause
```

A contract can contain multiple clauses.

---

## Contract Obligation

A specific commitment associated with a contract clause.

Examples include:

- Quarterly audit
- Payment deadline
- Notice period

Relationship:

```text
Contract
   └── Clause
         └── Obligation
```

---

## Task

A task can be:

- Automatically created from an obligation
- Manually created by a manager

Each task has:

- Assigned user
- Deadline
- Status

```text
Obligation
     ↓
    Task
     ↓
   User
```

---

## Document

Represents the underlying file associated with a contract.

This includes:

- Original contract upload
- Supporting files

The actual binary files are stored in object storage.

---

## Notification

A reminder sent to a user.

Notifications are triggered by events such as:

```text
Upcoming Task
      OR
Contract / Obligation Deadline
```

---

## Activity Log

Records meaningful actions performed in the system.

Examples:

```text
Contract uploaded
Contract edited
Approval performed
```

This provides an audit trail of activity.

---

# 10. Entity Relationships

The core relationships can be summarized as:

```text
User
 │
 │ has Role
 ▼
Role

Contract
 │
 ├──────────► Contract Clause
 │                    │
 │                    ▼
 │             Contract Obligation
 │                    │
 │                    ▼
 │                  Task
 │                    │
 │                    ▼
 │                  User
 │
 └──────────► Document

Task / Contract Deadline
             │
             ▼
       Notification

Contract Activity
             │
             ▼
       Activity Log
```

In short:

> **A User has a Role. A Contract has many Clauses and Obligations. Each Obligation can generate a Task, every Task belongs to a User, Notifications are triggered by Tasks or Contract deadlines, and meaningful Contract activity is recorded in the Activity Log.**

---

# 11. Hosting

The planned deployment architecture uses:

```text
Backend
   ↓
Render

PostgreSQL
   ↓
Managed PostgreSQL

Frontend
   ↓
Static Hosting
```

Render is planned for the backend and managed PostgreSQL, while the frontend is intended to use static hosting.

---

# 12. Security Model

Security is implemented through the application architecture rather than direct client access to internal services.

```text
Browser
   │
   │ Request
   ▼
FastAPI
   │
   ├── JWT validation
   ├── Role validation
   ├── Document-level permission checks
   │
   ▼
Authorized Service Access
```

The browser never directly accesses:

- PostgreSQL
- AI services
- File storage

All such access goes through the backend.

---

# 13. Architecture Summary

The complete HeimDall architecture can be reduced to four layers:

```text
┌─────────────────────────────────┐
│          PRESENTATION           │
│     Browser / Web Client        │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│          APPLICATION            │
│       FastAPI REST API          │
│ Auth • Contracts • Tasks        │
└───────┬──────────┬──────────────┘
        │          │
        ▼          ▼
┌────────────┐ ┌──────────────────┐
│ PostgreSQL │ │ AI / Documents   │
│ Structured │ │ OCR → RAG → LLM  │
│ Data       │ │                  │
└────────────┘ └──────────────────┘
        │          │
        └────┬─────┘
             ▼
┌─────────────────────────────────┐
│       Notifications / Alerts    │
└─────────────────────────────────┘
```

The architecture is designed so that the backend remains the central control point while specialized services handle structured data, document storage, AI processing, and notifications.

---

## 📌 Current Architecture Scope

This document describes the **planned architecture** for HeimDall. It establishes the technical direction before implementation and defines:

- End-to-end system structure
- Technology choices
- Request and response flow
- Contract processing flow
- Core data entities
- Storage strategy
- Authentication and authorization approach
- Deployment direction

The database schema is currently described as a **rough data model**, not a finalized schema.

---

## HeimDall
</div>
