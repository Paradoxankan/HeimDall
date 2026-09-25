<div align="center">
  <img src="./assets/heimdall-logo.png" alt="HeimDall Logo" width="260" />

  # HeimDall

  ### Stay Ahead.

  **The digital operating platform for organizations.**

  <p>
    <em>Observe. Understand. Act.</em>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Journey%20to%20Mastery-2026-0b63ce?style=for-the-badge" alt="Journey to Mastery" />
    <img src="https://img.shields.io/badge/Stage-MVP-111827?style=for-the-badge" alt="MVP" />
    <img src="https://img.shields.io/badge/AI-Powered-2563eb?style=for-the-badge" alt="AI Powered" />
    <img src="https://img.shields.io/badge/B2B-SaaS-0f766e?style=for-the-badge" alt="B2B SaaS" />
  </p>
</div>

---

## 01 — One-Line Idea

> **HeimDall is an AI-powered company operating platform that connects people, tasks, contracts, communication and organizational insights in one workspace — turning important information into actions before they are missed.**

---

## 02 — Problem Statement

Small and mid-sized companies often manage people, contracts, tasks and communication across disconnected tools such as email, spreadsheets, cloud drives and chat apps. Important obligations and deadlines can therefore remain buried in documents with no clear owner or follow-up.

**HeimDall connects these workflows and uses AI to turn contract obligations into assigned, trackable actions.**

---

## 03 — Target Users

HeimDall is designed primarily for **small and medium-sized organizations**, especially:

- Startups
- IT companies
- Software teams
- Agencies
- Consulting firms
- Service businesses
- Small manufacturing organizations

### Primary users inside a company

| Role | What they use HeimDall for |
|---|---|
| **Employee** | Personal tasks, deadlines, profile, communication and authorized documents |
| **Supervisor** | Assigning work, monitoring team activity and following up on deadlines |
| **HR** | Employee information, contracts, obligations and organizational records |
| **Admin / C-Suite** | Company-wide visibility, reports, contracts and operational health |

---

## 04 — The Core Idea

Most business software stores information.

**HeimDall is designed to connect information with action.**

```text
                    COMPANY INFORMATION
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
      Contracts          People            Work
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                    HEIMDALL AI
                           │
                           ▼
                 Understand & Extract
                           │
                           ▼
                   Obligation / Event
                           │
                           ▼
                    Assigned Task
                           │
                           ▼
                     Notification
                           │
                           ▼
                    Action Completed
                           │
                           ▼
                  Company Dashboard
```

### The hero workflow

**Contract → AI Analysis → Obligation → Task → Reminder → Completion → Dashboard**

This workflow is the central proof of concept for the MVP.

---

## 05 — MVP Scope

The **Journey to Mastery MVP** focuses on a complete, demonstrable company workflow rather than attempting to build every enterprise feature at once.

### Core MVP modules

- 🔐 Company registration, login and role-based access
- 🏢 Company workspace
- 👤 Employee profiles and departments
- ✅ Task creation, assignment, priority and deadlines
- 📄 Contract upload and AI-powered contract understanding
- 🧠 Extraction of key dates, parties, obligations and renewal/expiry terms
- 🔗 Contract-to-task automation
- 🔔 In-app reminders and notifications
- 💬 Company and department channels
- 💬 Direct messaging
- 📊 Company dashboard
- 📈 Basic operational reports

### MVP success condition

A user should be able to upload a contract, have HeimDall identify an actionable obligation, convert it into a task for the appropriate person, receive a reminder and see the resulting activity reflected on the company dashboard.

---

## 06 — Contract Intelligence

Contract intelligence is HeimDall's primary AI-powered differentiator in the MVP.

A user can upload a business document such as an employment agreement, NDA, vendor agreement or service contract.

HeimDall is designed to identify information such as:

```text
Contract Type
Parties
Start Date
Expiry / Renewal Date
Notice Period
Termination Conditions
Responsibilities
Obligations
Important Deadlines
```

### Example

```text
CONTRACT ANALYSIS
────────────────────────────

Contract Type:     Service Agreement
Parties:           Company A + Vendor B
Expiry Date:       31 Dec 2026
Notice Period:     30 Days

KEY OBLIGATIONS
✓ Monthly service report required
✓ Payment due within agreed period
✓ Renewal review required before expiry

ACTION
→ Create task for responsible manager
→ Set deadline
→ Notify assignee
```

The objective is not simply to summarize a PDF.

> **HeimDall turns a clause buried in a document into a visible organizational action.**

---

## 07 — Company Workspace

HeimDall is envisioned as a connected workspace for the entire organization.

### People

- Employee profiles
- Departments
- Supervisors
- Roles and permissions

### Work

- Tasks
- Priorities
- Deadlines
- Status tracking
- Task history

### Contracts

- Contract repository
- AI analysis
- Obligations
- Renewal / expiry tracking
- Contract dashboard

### Communication

- Company channels
- Department channels
- Direct messages
- Mentions
- Notifications

### Visibility

- Company dashboard
- Department activity
- Task completion
- Overdue work
- Contract statistics

---

## 08 — Dashboard Concept

The company dashboard gives authorized management users a quick view of what needs attention.

```text
┌─────────────────────────────────────────────────┐
│                    HEIMDALL                     │
│              COMPANY OVERVIEW                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  EMPLOYEES        TASKS          CONTRACTS      │
│     52             126              37         │
│                                                 │
│  OVERDUE          EXPIRING         PENDING      │
│   09 Tasks       04 Contracts       05         │
│                                                 │
├─────────────────────────────────────────────────┤
│  ⚠ ATTENTION REQUIRED                          │
│                                                 │
│  • 3 contracts require review                  │
│  • 9 tasks are overdue                         │
│  • 5 actions are awaiting completion           │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 09 — Design & Product Sketches

The initial product thinking started from a simple set of organizational workflows: contract understanding, task assignment, reminders, employee profiles, contract dashboards, stakeholders, communication and reporting.

### Initial feature sketch

<p align="center">
  <img src="./assets/initial-feature-sketch.jpg" alt="Initial HeimDall feature sketch" width="520" />
</p>

### Product requirements

<p align="center">
  <img src="./assets/project-requirements.jpg" alt="HeimDall project requirements" width="520" />
</p>

### Miro / Excalidraw

**Miro board:** `Add your Miro board link here`

**UI sketch:** The repository assets above document the current early-stage product thinking. The final UI screens will be linked here once the Figma / Excalidraw workspace is finalized.

---

## 10 — Planned Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Figma for UI/UX design
- Stitch for interface exploration / prototyping

### Backend

- Python
- FastAPI
- REST APIs

### Database

- PostgreSQL

### AI Layer

- Large Language Model API
- Retrieval-Augmented Generation (RAG)
- Embeddings
- Document processing
- Contract information extraction
- OCR for scanned documents

### Development & Collaboration

- Git
- GitHub
- GitHub Issues
- Pull Requests
- Code Reviews

> The stack may evolve during implementation as the team validates the MVP architecture.

---

## 11 — High-Level Architecture

```text
                         ┌──────────────────┐
                         │      USER        │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    FRONTEND      │
                         │                  │
                         │ Dashboard        │
                         │ Tasks            │
                         │ Contracts        │
                         │ Chat             │
                         │ Reports          │
                         └────────┬─────────┘
                                  │ REST API
                                  ▼
                         ┌──────────────────┐
                         │     FASTAPI      │
                         │                  │
                         │ Auth             │
                         │ RBAC             │
                         │ Business Logic   │
                         │ API Endpoints    │
                         └───────┬──────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
       ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
       │ PostgreSQL  │    │  AI SERVICE │    │   STORAGE   │
       │             │    │             │    │             │
       │ Users       │    │ LLM         │    │ Contracts   │
       │ Tasks       │    │ RAG         │    │ Documents   │
       │ Contracts   │    │ Embeddings  │    │ Files       │
       │ Messages    │    │ OCR         │    │             │
       └─────────────┘    └─────────────┘    └─────────────┘
```

---

## 12 — Security & Privacy

HeimDall is intended to handle sensitive organizational information, so authorization is part of the core architecture.

Key principles:

- Role-Based Access Control (RBAC)
- API-level authorization
- Password hashing
- Secure document access
- Server-side permission checks
- Environment variables for secrets
- No API keys committed to GitHub
- Confidential company documents protected by access rules
- AI responses limited by the user's authorized data

> **If a user cannot access a document through the application, the AI should not reveal its contents either.**

---

## 13 — Success Metrics

The MVP will be evaluated using measurable product and technical outcomes.

| Metric | MVP Target |
|---|---|
| Core modules working end-to-end | 100% demoable |
| Contract → task workflow | Under 30 seconds in typical demo conditions |
| AI contract analysis | Under 15 seconds for a typical 5–15 page text-based contract |
| Blocking bugs at final rehearsal | 0 |
| Core workflow | Contract → obligation → task → reminder → dashboard |

The main question is simple:

> **Can HeimDall reliably turn organizational information into timely action?**

---

## 14 — Business Model

HeimDall is planned as a **freemium + B2B SaaS platform**.

### Individuals — Free

A limited free experience for personal productivity and basic organizational tools.

### Premium Individuals

Potential premium capabilities include:

- AI recommendations
- Personal AI researcher
- Higher AI usage limits
- Advanced insights
- HeimDall certifications
- Skill assessments

### Companies — Paid

Company workspaces are the primary B2B offering, with features such as:

- Employee management
- Task management
- Contract intelligence
- Documents
- Communication
- Organizational dashboards
- Reports
- Automation
- Advanced permissions

> Pricing, packaging and usage limits will be validated through future customer discovery rather than fixed during the MVP.

---

## 15 — Roadmap

### Phase 1 — Journey to Mastery MVP

- [x] Product concept
- [x] PRD
- [x] Initial feature planning
- [ ] Authentication & company workspace
- [ ] Employee profiles & departments
- [ ] Task management
- [ ] Notifications
- [ ] Contract intelligence
- [ ] Contract → task automation
- [ ] Communication
- [ ] Company dashboard
- [ ] Basic reports

### Phase 2 — Organizational Intelligence

- [ ] HeimDall AI Assistant
- [ ] Company knowledge search
- [ ] Advanced RAG
- [ ] AI recommendations
- [ ] Smart notifications
- [ ] Workflow automation
- [ ] AI-generated reports

### Phase 3 — People & Community

- [ ] Peer feedback
- [ ] Recognition
- [ ] Achievement badges
- [ ] Leaderboards
- [ ] Community improvements

### Phase 4 — Individual Growth

- [ ] Personal AI researcher
- [ ] HeimDall certifications
- [ ] Skill assessments
- [ ] Learning paths
- [ ] Verified achievements

### Phase 5 — Ecosystem

- [ ] Google Workspace integration
- [ ] Microsoft 365 integration
- [ ] GitHub / GitLab integration
- [ ] Slack / Teams integration
- [ ] Calendar integrations
- [ ] HR system integrations
- [ ] Enterprise identity providers
- [ ] Mobile application

---

## 16 — 4-Week Journey to Mastery Build Plan

### Week 1 — Foundation

**Goal:** Establish the organizational workspace.

- Project setup
- Database foundation
- Authentication
- Company workspace
- Roles & permissions
- Employee profiles
- Initial UI

### Week 2 — Operations

**Goal:** Make the workspace useful for daily work.

- Task management
- Departments
- Notifications
- Company channels
- Direct messaging
- Company dashboard foundation

### Week 3 — AI Hero Workflow

**Goal:** Build the feature that differentiates HeimDall.

- Contract upload
- Document processing
- AI contract analysis
- Obligation extraction
- Contract dashboard
- Contract → task automation

### Week 4 — Polish & Pitch

**Goal:** Turn the prototype into a convincing product demonstration.

- Reports
- Permission testing
- Error handling
- UI refinement
- Security checks
- Testing
- Deployment
- Documentation
- Demo rehearsal

---

## 17 — Team

### 👨‍💻 Ankan Biswas — Tech Lead

**Focus:** Backend, architecture, APIs, AI integration and engineering coordination.

### 👨‍💼 Sumit Sinha — Product Manager

**Focus:** Product requirements, user needs, roadmap, validation and business direction.

### 🎨 Debashis Dey — Design Lead

**Focus:** UI/UX, Figma/Stitch exploration, product interface and design system.

### Team capabilities

- Python
- C
- HTML
- CSS
- Figma
- Stitch
- Git
- GitHub

---

## 18 — Development Workflow

```text
Product Idea
     ↓
GitHub Issue
     ↓
Feature Branch
     ↓
Development
     ↓
Testing
     ↓
Pull Request
     ↓
Code Review
     ↓
Merge
     ↓
Release
```

Example branches:

```text
feature/authentication
feature/company-workspace
feature/task-management
feature/contract-analysis
feature/ai-assistant
feature/notifications
feature/company-dashboard
```

---

## 19 — Repository Structure

```text
HeimDall/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── assets/
│
├── backend/
│   ├── api/
│   ├── auth/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── database/
│
├── ai/
│   ├── document_processing/
│   ├── contract_analysis/
│   ├── embeddings/
│   ├── rag/
│   └── assistant/
│
├── docs/
│   ├── PRD.md
│   ├── architecture.md
│   ├── API.md
│   ├── roadmap.md
│   └── sketches/
│
├── tests/
├── assets/
├── .env.example
├── .gitignore
└── README.md
```

---

## 20 — Long-Term Vision

HeimDall is not intended to be just another task manager or document repository.

The long-term vision is to build a connected organizational operating layer where:

```text
People
  +
Work
  +
Contracts
  +
Knowledge
  +
Communication
  +
AI
  +
Organizational Intelligence
```

work together in one platform.

### Our vision

> ## **Make organizations easier to run, easier to understand and harder to lose track of.**

---

## 🛡️ Why the name HeimDall?

The name is inspired by **Heimdall**, the watchful guardian from Norse mythology.

The metaphor fits the product: HeimDall is designed to help an organization stay aware of its people, responsibilities, documents, deadlines and operational signals.

**Stay Ahead.**

---

<div align="center">

  ## 🛡️ HeimDall

  **Stay Ahead.**

  *The digital operating platform for organizations.*

  <sub>Built for the Journey to Mastery • MVP Release • 2026</sub>

</div>
