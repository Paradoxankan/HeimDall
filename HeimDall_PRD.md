# HeimDall - Product Requirements Document (PRD)

## 1. Problem Statement

Organizations commonly manage employees, departments, projects, tasks, contracts, documents, communication, and operational records across disconnected tools such as email, messaging apps, spreadsheets, and cloud storage.

This fragmentation creates:

- Information silos
- Unclear ownership
- Missed deadlines
- Duplicated work
- Unnecessary administrative effort

Employees lack a single view of what is happening across teams, while they must search across multiple places for tasks, documents, announcements, and company information.

### Proposed Solution

Build **one company workspace** that connects organizational data and workflows, then use AI to understand that data and surface what requires attention.

### Primary Objective

Deliver a functional **company-management MVP in four weeks** that demonstrates a complete workflow from:

```text
Company Setup
      ↓
Employee / Team Management
      ↓
Work Tracking
      ↓
Document / Contract Intelligence
      ↓
Notifications
      ↓
Management Reporting
```

---

# 2. Target Audience & User Needs

HeimDall is intended for organizations that need a unified workspace for people, work, documents, contracts, communication, and operational visibility.

## 2.1 User Personas

| Persona | Primary Needs |
|---|---|
| **Employee** | See assigned work, deadlines, authorized documents, announcements, projects, and personal activity in one place. |
| **Supervisor / Manager** | Assign and track tasks, manage projects, review team activity, monitor deadlines, and communicate with the team. |
| **HR / Administration** | Manage employees, departments, employment-related documents/contracts, announcements, and operational records. |
| **Finance / Procurement / Legal** | Store and monitor relevant contracts/documents, identify obligations and renewal deadlines, and track actions. |
| **C-Suite / Company Admin** | See organization-wide reports, key risks, activity, contracts, tasks, and department-level status. |
| **System Administrator** | Configure company workspace, users, roles, permissions, and platform settings. |

## 2.2 Representative User Stories

- As an **employee**, I want to see my tasks and deadlines so I know what requires attention.
- As a **manager**, I want to assign a task to a team member and track its status.
- As **HR**, I want to upload an employment contract and automatically extract important dates and obligations.
- As a **responsible manager**, I want a reminder before a contract renewal or other obligation becomes due.
- As an **executive**, I want a company dashboard that summarizes employees, projects, tasks, and contracts.
- As an **employee**, I want to ask an authorized question about company documents and receive a source-grounded answer.
- As an **administrator**, I want role-based permissions so sensitive company information is visible only to authorized users.

---

# 3. Functional Requirements

## 3.1 Organization & Workspace

The platform shall provide:

- Company registration and company profile
- Company workspace/dashboard
- Modules for:
  - People
  - Departments
  - Projects
  - Tasks
  - Documents
  - Contracts
  - Announcements
  - Chats
  - Reports
  - Settings
- Organization hierarchy:
  - Company
  - Departments
  - Teams / Projects
- User invitation and onboarding
- Role-Based Access Control (RBAC)
- Organization-level activity feed for important actions

---

## 3.2 People & Departments

The platform shall support:

- Employee profiles containing:
  - Name
  - Role
  - Department
  - Manager / Supervisor
  - Joining information
  - Skills
  - Relevant activity
- Department creation and management
- Manager/supervisor assignment
- Employee directory with search and filtering
- Role and permission assignment
- Employee-facing view of:
  - Own tasks
  - Projects
  - Authorized documents
  - Activity

---

## 3.3 Projects & Work Management

The platform shall support:

### Projects

- Project creation
- Project description
- Project owner
- Project members
- Project status
- Project dates
- Project workspace containing:
  - Tasks
  - Documents
  - Members
  - Meetings/discussions
  - Activity

### Tasks

Users with appropriate permissions can:

- Create tasks
- Assign tasks
- Prioritize tasks
- Update tasks

Each task should contain:

```text
Title
Description
Assignee
Creator
Department / Project
Priority
Status
Due Date
Timestamps
```

### Task Statuses

```text
To Do
In Progress
Blocked
Completed
```

Additional task functionality:

- Task comments
- Activity history
- Overdue indicators
- Upcoming task indicators
- Project activity timeline
- Team activity timeline

---

# 3.4 Documents & Knowledge

The platform shall support:

- Uploading and organizing company documents
- Folders/categories for:
  - HR
  - Legal
  - Finance
  - Engineering
  - Other departments
- Document metadata:
  - Title
  - Type
  - Owner
  - Department
  - Upload date
  - Version
  - Access permissions
- Document search
- Document filtering
- Document version history
- Authorized document preview/download
- AI-powered summarization for supported documents
- AI-powered document question answering
- Source references/citations in AI answers

### Permission Requirement

Document permissions must be respected by AI retrieval.

> If a user cannot access a document normally, the AI must not retrieve or reveal information from that document for that user.

---

# 3.5 Contract Intelligence & Obligation Management

Contract intelligence is a core component of HeimDall.

## Supported Contract Types

The MVP is designed to support contracts such as:

- Employment agreements
- NDAs
- Vendor agreements
- Service agreements
- Other supported business contracts

## Contract Extraction

The system should extract supported fields including:

- Parties
- Contract type
- Start date
- End date
- Renewal terms
- Notice period
- Monetary value, where present
- Responsibilities
- Important clauses
- Obligations

## Contract Intelligence Features

- Concise contract summary
- Identification of important dates
- Identification of obligations
- Contract owner assignment
- Responsible department assignment

## Contract Dashboard

The dashboard should show:

```text
Active
Expiring Soon
Pending Review
Renewal Required
```

Users should be able to search/filter contracts by:

- Type
- Owner
- Department
- Status
- Expiry

## Obligation Workflow

The platform should support:

```text
Contract
   ↓
AI Analysis
   ↓
Important Clause / Obligation
   ↓
Reminder
   ↓
Follow-up Task
   ↓
Responsible User
```

The system should:

- Create reminders from contract dates and obligations
- Create follow-up tasks from identified obligations
- Show extracted information alongside the original contract/source
- Flag potentially important/risky clauses for human review

### AI Safety Requirement

> AI must not present legal conclusions as definitive legal advice.

Potentially important or risky clauses must remain subject to human review.

---

# 3.6 Smart Reminders & Notifications

The platform shall provide:

- In-app notifications for:
  - Task deadlines
  - Overdue tasks
  - Contract expiry
  - Contract renewal events
  - Assigned actions
  - Company announcements
- Reminder rules based on:
  - Due dates
  - Configured lead times
- Notification center
- Read/unread notification state

### Optional Email Notifications

Email notifications may be included if the selected email service is available.

### Future Notification Integrations

Potential future channels include:

- WhatsApp Business
- Slack
- Microsoft Teams
- Similar communication channels

---

# 3.7 Company Communication

The platform shall provide lightweight organizational communication.

### Announcements

- Company-wide announcements
- Department/team announcements

### Community Chat

- Direct messages and/or channels
- Project communication channels
- Department communication channels
- Text messages
- Mentions
- File attachments where feasible
- Notifications for relevant messages and announcements

### MVP Boundary

> For the MVP, chat remains lightweight and is not intended to replace full Slack/Teams functionality.

---

# 3.8 Performance & Activity

HeimDall should track **objective work activity**, including:

- Tasks completed
- On-time completion
- Overdue tasks
- Active projects
- Project contributions

The platform should provide:

- Employee profile activity summary
- Manager/team activity view
- Time-period filters where feasible

### Performance Design Principle

The system should avoid a single opaque AI-generated "employee score".

Performance information should remain traceable to:

- Observable activity
- Manager-entered goals
- Manager-entered feedback

---

# 3.9 Reports & Dashboards

## Company Overview

The company dashboard should provide:

- Employee count
- Active projects
- Open tasks
- Overdue tasks
- Active contracts
- Contracts expiring soon

## Additional Reports

- Department-level activity/performance summary
- Project-level progress summary
- Contract status summary
- Upcoming obligation summary
- Task completion summary
- Overdue task summary

## AI-Generated Weekly Summary

The platform may generate an AI-powered weekly company summary based **only on authorized platform data**.

## Export

Export/report generation may be included for key summaries if time permits.

---

# 3.10 Company AI Assistant

The Company AI Assistant is designed to operate over authorized company data.

It shall support:

- Natural-language questions
- Questions about:
  - Documents
  - Contracts
  - Tasks
  - Company information
- Retrieval and citation of relevant source documents/records
- Surfacing items requiring attention

Example:

> **"What requires my attention this week?"**

## AI Actions

Where explicitly implemented, the assistant may support actions such as:

```text
Identify obligation
      ↓
Create reminder/task
```

Actions must only be performed when explicitly requested by the user.

## Authorization

The AI Assistant must:

- Respect RBAC
- Never retrieve information the requesting user is not authorized to access
- Maintain an audit trail for AI-triggered actions

---

# 4. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Security** | Passwords/authentication handled using established secure methods; sensitive data protected in transit and at rest where supported. |
| **Authorization** | RBAC enforced server-side for every protected resource, not only in the UI. |
| **Privacy** | Users can only access company data they are authorized to access. AI retrieval must apply the same permissions. |
| **Performance** | Target **<2 seconds** for common dashboard/API operations under expected MVP/demo load; long AI/document jobs may be asynchronous. |
| **Reliability** | Core records must not be lost during normal operation. Errors should be logged and user-facing failures should be recoverable. |
| **Scalability** | Architecture should separate frontend, API, database, file storage, and AI services so each can scale independently later. |
| **Auditability** | Important actions such as login, role changes, document uploads, contract changes, and AI-triggered actions should be auditable. |
| **Usability** | Core actions should require minimal steps, use clear status indicators, and work on desktop and mobile-sized screens. |
| **Accessibility** | Readable typography, clear contrast, keyboard-friendly forms where practical, and meaningful labels. |
| **Maintainability** | Use modular backend services, documented APIs, Git/GitHub branching, and reusable frontend components. |
| **AI Safety** | AI outputs are assistive, not authoritative. Contract/legal flags require human review; unsupported claims should be minimized through source-grounded retrieval. |

---

# 5. UI/UX Design

## 5.1 Primary Navigation

The primary navigation should include:

```text
Overview
People
Departments
Projects
Tasks
Documents
Contracts
Communication
Reports
AI Assistant
Settings
```

---

## 5.2 Core User Flow A - New Company

```text
Register Company
      ↓
Configure Company Profile
      ↓
Invite Users
      ↓
Create Departments
      ↓
Assign Roles
      ↓
Company Dashboard
```

---

## 5.3 Core User Flow B - Contract Intelligence

```text
Upload Contract
      ↓
Store Document Securely
      ↓
Parse / OCR if Required
      ↓
Extract Fields & Obligations
      ↓
Human Review
      ↓
Save Structured Contract
      ↓
Configure Reminders
      ↓
Generate Tasks
      ↓
Monitor Contract Dashboard
```

---

## 5.4 Core User Flow C - Task Manager

```text
Manager Creates Task
      ↓
Assigns Employee
      ↓
Employee Updates Status
      ↓
Comments / Activity Recorded
      ↓
Deadline Approaches
      ↓
Reminder
      ↓
Completion
      ↓
Dashboard Metrics Updated
```

---

## 5.5 Core User Flow D - AI Company Question

```text
User Asks Question
      ↓
Authenticate User
      ↓
Check Permissions
      ↓
Retrieve Authorized Records / Documents
      ↓
Generate Grounded Response
      ↓
Show Sources
      ↓
Optional Task / Reminder Creation
```

Task/reminder creation occurs only if the user explicitly requests it.

---

## 5.6 Core User Flow E - Executive Overview

```text
C-Suite / Admin Opens Dashboard
      ↓
View Organization Metrics
      ↓
Review Overdue Work & Contract Alerts
      ↓
Drill into Department / Project / Contract
      ↓
Assign or Follow Up on Actions
```

---

## 5.7 Visual Design Direction

The product should follow a:

- Modern enterprise SaaS aesthetic
- Clean and information-dense layout
- Low-clutter interface
- Subtle Nordic/guardian inspiration in branding
- Accessible status colors and icons
- Clear text labels
- Responsive desktop/mobile-sized layouts

> The Nordic/guardian inspiration should remain subtle and should not make the interface look like a mythology or game product.

### Design Tools

**Figma** and **Stitch** should be used to establish:

- Design system
- Key screens
- Component direction
- Interaction patterns

before implementation.

---

# 6. Scope & Boundaries

## 6.1 In Scope - 4-Week MVP

The MVP includes:

- Multi-user company workspace
- Authentication
- Company creation
- RBAC
- Employee profiles
- Departments
- Projects
- Task management
- Document repository
- Document metadata
- Document permissions
- Contract upload
- Contract extraction
- Contract summary
- Contract expiry tracking
- Obligation tracking
- Contract reminders
- Basic company announcements
- Lightweight communication
- Company dashboard
- Department dashboard
- Project dashboard
- Contract dashboard
- Task dashboard
- AI document/contract assistant
- Source-grounded AI answers
- Notifications
- Activity feed
- Responsive web application
- Working demo deployment

---

## 6.2 Out of Scope for MVP

The following are explicitly outside the MVP scope:

- Full payroll/accounting system
- Full HRMS/recruitment platform
- Biometric attendance
- Employee surveillance
- Complete Slack/Teams replacement
- Video conferencing
- Full ERP functionality
- Automated legal decision-making
- Automated legal advice
- Guaranteed legal-risk scoring without human review
- Native iOS/Android applications unless spare capacity is available
- Complex external enterprise integrations unless required for the demo
- Production-grade multi-region infrastructure
- Use of actual company customer data without proper consent and security controls

---

# 6.3 Post-MVP Roadmap

Potential future capabilities include:

- Leave management
- Attendance
- Expense management
- Asset management
- Advanced workflow/approval engine
- Google Workspace integration
- Microsoft 365 integration
- Slack/Teams integration
- GitHub integration
- Accounting system integrations
- Messaging-channel integrations
- Advanced analytics
- Organization-wide knowledge graph
- Mobile applications
- Enterprise SSO
- Advanced audit/compliance controls
- Larger-scale infrastructure

---

# 7. MVP Acceptance Criteria

The MVP will be considered functionally complete when:

- [ ] A company admin can create a company workspace.
- [ ] A company admin can invite users.
- [ ] A company admin can assign roles.
- [ ] A manager can create a project.
- [ ] A manager can assign tasks to employees.
- [ ] An employee can view authorized tasks.
- [ ] An employee can update task status.
- [ ] Employees can see relevant deadlines.
- [ ] An authorized user can upload company documents.
- [ ] An authorized user can retrieve company documents.
- [ ] A contract can be uploaded.
- [ ] Supported contract key fields can be extracted into a structured record.
- [ ] Upcoming contract expiries and obligations can be displayed.
- [ ] Contract/task deadlines can generate reminders.
- [ ] An authorized user can ask the AI Assistant about company documents.
- [ ] AI answers are grounded in authorized source information.
- [ ] Relevant source documents/records are shown with factual answers.
- [ ] An executive/admin can view company-level activity and attention summaries.
- [ ] Unauthorized users cannot access restricted company data through the UI.
- [ ] Unauthorized users cannot access restricted company data through the API.

---

# 8. Success Metrics

## 8.1 MVP Success Metrics

| Metric | Target | How Measured |
|---|---|---|
| **Core workflow completion** | A demo user can complete the full company workflow without manual database edits | End-to-end demo test |
| **AI contract extraction** | ≥90% field-level accuracy for supported fields on a curated sample set of contracts | Manually verified test dataset |
| **Document Q&A grounding** | Every AI answer links/cites the source document or page where applicable | Evaluation on predefined questions |
| **Reminder generation** | 100% of configured contract/task deadlines generate the expected in-app reminder | Automated test cases |
| **Role-based access** | No test user can access a restricted module/data set outside its role | Permission/security test cases |
| **Dashboard consistency** | Dashboard counts match underlying test records | Automated/manual reconciliation |
| **Performance** | Primary dashboard/API interactions target <2 seconds under demo load, excluding long AI jobs | Local/staging performance tests |
| **Reliability** | No blocker defects in the final demo flow | Release checklist |

---

## 8.2 Longer-Term Business KPIs

The longer-term product should measure:

- Organizations onboarded
- Active organizations per month
- Monthly active users per organization
- Weekly active users per organization
- Tasks completed on time
- Reduction in overdue tasks
- Contracts monitored
- Obligations successfully actioned
- Document search usage
- AI Assistant usage
- AI answer satisfaction
- Paid conversion
- Customer retention
- Revenue per organization

---

# Product Principle

HeimDall is designed around a simple product principle:

> **Connect organizational information, understand it intelligently, and surface what requires attention.**

The MVP therefore focuses on connecting:

```text
People
   +
Projects
   +
Tasks
   +
Documents
   +
Contracts
   +
Communication
   +
AI
   +
Notifications
   +
Reports
```

into a unified company workspace.
