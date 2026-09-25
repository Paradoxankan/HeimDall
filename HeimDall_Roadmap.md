# HeimDall Roadmap

## 1. Roadmap Overview

The goal of the first four weeks is to build a working HeimDall MVP that demonstrates the main company management workflow.

The MVP should not try to build every planned feature. The priority is to make the core product usable from start to finish:

```text
Company Setup
    ↓
People and Teams
    ↓
Projects and Tasks
    ↓
Documents and Contracts
    ↓
AI Understanding
    ↓
Obligations and Reminders
    ↓
Dashboard and Reports
```

After the MVP, HeimDall can gradually expand into a broader operating platform for organizations.

---

# 2. Phase 0: Planning and Product Setup

## Duration

1 to 2 days

## Goals

Before writing the main application, the team should agree on the product structure and development workflow.

## Tasks

- Finalize the MVP feature list
- Finalize user roles
- Finalize the main navigation
- Define the database entities
- Define API resources
- Create the initial UI wireframes
- Set up the GitHub repository
- Set up the project branches
- Create the initial backend and frontend projects
- Prepare environment configuration
- Decide how AI and document processing will be connected

## Expected Output

```text
Product structure finalized
UI direction finalized
Repository ready
Development environment ready
Initial architecture ready
```

---

# 3. Phase 1: Platform Foundation

## Week 1

The first week focuses on creating the foundation of the application.

## Backend

Build:

- FastAPI application
- Database connection
- PostgreSQL schema
- Authentication
- User model
- Organization model
- Department model
- Role and permission model
- Basic API structure
- Error handling
- Environment configuration

## Frontend

Build:

- Application layout
- Login page
- Registration/invitation flow
- Dashboard shell
- Sidebar/navigation
- User profile area
- Responsive base components

## Organization

Implement:

- Company creation
- Company profile
- Department creation
- Employee invitation
- Employee directory
- Basic role assignment

## Target Result

By the end of Week 1:

```text
User
  ↓
Login
  ↓
Company Workspace
  ↓
Dashboard
  ↓
People / Departments
```

A user should be able to enter the system and see a real company workspace.

---

# 4. Phase 2: Work Management

## Week 2

The second week focuses on the operational side of HeimDall.

## Projects

Implement:

- Project creation
- Project details
- Project owner
- Project members
- Project status
- Project activity

## Tasks

Implement:

- Task creation
- Task assignment
- Task priority
- Task status
- Due dates
- Task comments
- Task activity
- Overdue indicators
- Task completion

Initial statuses:

```text
To Do
In Progress
Blocked
Completed
```

## Dashboards

Add:

- Open tasks
- Completed tasks
- Overdue tasks
- Active projects
- Upcoming deadlines

## Notifications

Implement the first notification system for:

- Task assignment
- Upcoming deadlines
- Overdue tasks

## Target Result

By the end of Week 2:

```text
Manager
   ↓
Creates Project
   ↓
Creates Task
   ↓
Assigns Employee
   ↓
Employee Updates Task
   ↓
Manager Sees Progress
```

This should be a complete working workflow, not just individual screens.

---

# 5. Phase 3: Documents and Contract Intelligence

## Week 3

The third week is the most important technical phase because it introduces one of HeimDall's main differentiators: contract intelligence.

## Document Management

Implement:

- Document upload
- Document metadata
- Document ownership
- Document permissions
- Document listing
- Document filtering
- Secure document access

## Contract Management

Implement:

- Contract upload
- Contract records
- Contract type
- Contract owner
- Department
- Start date
- End date
- Renewal information
- Notice period
- Contract status

## AI Document Pipeline

Build the first working pipeline:

```text
Contract Upload
      ↓
File Storage
      ↓
Text Extraction
      ↓
OCR if Required
      ↓
Text Processing
      ↓
RAG / Retrieval
      ↓
LLM
      ↓
Structured Contract Data
```

## AI Extraction

The MVP should focus on extracting useful information such as:

- Parties
- Contract type
- Important dates
- Renewal terms
- Notice period
- Responsibilities
- Obligations
- Important clauses

## Contract Summary

Generate a concise summary for each supported contract.

## Obligation Management

Convert extracted obligations into actionable records.

```text
Contract
   ↓
Obligation
   ↓
Responsible Person
   ↓
Deadline
   ↓
Task
   ↓
Reminder
```

## Target Result

By the end of Week 3, the team should be able to upload a sample contract and see meaningful structured information extracted from it.

---

# 6. Phase 4: Integration and MVP Completion

## Week 4

The fourth week is for connecting the modules, improving reliability, and preparing the final product.

## Integrate the Main Modules

Connect:

```text
People
Projects
Tasks
Documents
Contracts
Obligations
Notifications
Dashboard
AI Assistant
```

## AI Assistant

Implement the first version of the company AI assistant.

Users should be able to ask questions about information they are authorized to access.

Example:

```text
"What contracts are expiring soon?"
"What obligations are assigned to me?"
"Summarize this contract."
"What tasks require my attention?"
```

The assistant should provide source information where applicable.

## Permission-Aware AI

Before retrieving information:

```text
User
 ↓
Authentication
 ↓
Permission Check
 ↓
Authorized Data Retrieval
 ↓
AI Response
```

The AI must not expose information from documents or records the user cannot access.

## Company Dashboard

Finalize:

- Employee count
- Active projects
- Open tasks
- Overdue tasks
- Active contracts
- Contracts expiring soon
- Upcoming obligations

## Activity Log

Track important events such as:

- Login
- User creation
- Role changes
- Task assignment
- Task completion
- Document upload
- Contract upload
- Contract updates
- AI actions

## Testing

Test the complete flows:

- Authentication
- Company setup
- User permissions
- Employee management
- Project creation
- Task assignment
- Task completion
- Document upload
- Contract processing
- Obligation creation
- Reminder generation
- AI questions
- Unauthorized access attempts

## Deployment

Prepare:

- Production environment
- Database
- Backend deployment
- Frontend deployment
- Environment variables
- HTTPS
- Basic logging
- Demo data

## Target Result

At the end of Week 4:

```text
A new company
      ↓
Adds employees
      ↓
Creates projects
      ↓
Assigns tasks
      ↓
Uploads contracts
      ↓
HeimDall understands them
      ↓
Obligations are identified
      ↓
Reminders are generated
      ↓
Management sees everything
      ↓
AI helps users find information
```

This is the MVP that should be demonstrated.

---

# 7. Four Week Milestone Summary

| Week | Main Focus | Main Deliverable |
|---|---|---|
| Week 1 | Foundation | Authentication, organization, people, departments |
| Week 2 | Work Management | Projects, tasks, notifications, basic dashboards |
| Week 3 | Contract Intelligence | Documents, contracts, extraction, obligations |
| Week 4 | Integration | AI assistant, dashboards, testing, deployment |

---

# 8. Team Development Plan

With a three-person team, development can be divided into three primary areas.

## Member 1: Backend and Database

Focus on:

- FastAPI
- PostgreSQL
- Authentication
- RBAC
- API development
- Database models
- Backend validation

## Member 2: Frontend and UI

Focus on:

- HTML/CSS/JavaScript or React
- Figma/Stitch implementation
- Dashboard
- Forms
- Tables
- Navigation
- Responsive design
- Frontend API integration

## Member 3: AI and Integration

Focus on:

- Document processing
- OCR
- RAG
- LLM integration
- Contract extraction
- Obligation extraction
- AI Assistant
- Notification logic

## Shared Responsibilities

All three members should participate in:

- GitHub
- Code reviews
- Testing
- Documentation
- Bug fixing
- Final deployment
- Product presentation

---

# 9. GitHub Development Workflow

The repository should use a simple branch structure.

```text
main
  │
  ├── backend
  ├── frontend
  ├── ai
  └── feature branches
```

A practical workflow is:

```text
Issue
  ↓
Feature Branch
  ↓
Implementation
  ↓
Testing
  ↓
Pull Request
  ↓
Code Review
  ↓
Merge
```

Each feature should have a clear issue before development begins.

Examples:

```text
Add employee profile API
Add task assignment
Add contract upload
Add contract extraction
Add notification system
Add AI document Q&A
```

---

# 10. MVP Freeze

At the end of Week 3, the team should freeze the MVP feature list.

After the freeze, new features should only be added if:

1. The existing workflow is stable.
2. The feature can be completed without affecting core functionality.
3. The team has enough time for testing.

Avoid adding major modules during the final days.

The final week should primarily be used for integration, testing, bug fixing, deployment, and presentation.

---

# 11. Post-MVP Roadmap

Once the MVP is stable, HeimDall can move toward the larger product vision.

## Phase 5: Product Expansion

Potential additions:

- Advanced search
- Better reporting
- Weekly AI summaries
- Email notifications
- More communication features
- Advanced contract monitoring
- Improved document management
- More granular permissions

---

## Phase 6: AI Expansion

Build more intelligent assistance around the company workspace.

Potential features:

- Personal AI researcher
- AI recommendations
- Company knowledge assistant
- Automated action suggestions
- Personalized work insights
- Advanced document comparison
- Cross-document analysis

The AI should continue to operate within the user's permissions.

---

## Phase 7: Organizational Tools

Expand HeimDall beyond the initial MVP.

Potential modules:

- Leave management
- Attendance
- Expense management
- Asset management
- Approval workflows
- Internal knowledge management
- Advanced HR operations

---

## Phase 8: Integrations

Connect HeimDall with tools companies already use.

Potential integrations:

- Google Workspace
- Microsoft 365
- Slack
- Microsoft Teams
- GitHub
- Accounting systems
- Business messaging platforms

The goal is to make HeimDall a central layer connecting existing company tools rather than forcing companies to replace everything at once.

---

## Phase 9: Enterprise Features

For larger organizations:

- Enterprise SSO
- Advanced audit controls
- Advanced permissions
- Compliance features
- Organization-wide analytics
- Larger storage and usage limits
- Advanced administration
- Dedicated organization controls

---

# 12. Business Roadmap

HeimDall is intended to follow a B2B SaaS model with a limited free individual experience.

## Individual Plan

The free experience can provide limited access to selected HeimDall features.

Possible limits:

- AI usage
- Storage
- Advanced recommendations
- Advanced reports
- Other premium capabilities

## Company Plans

Paid plans can unlock:

- Full organization workspace
- Higher usage limits
- Contract intelligence
- Advanced AI capabilities
- AI recommendations
- Advanced reporting
- Larger storage
- Advanced organization controls
- Future certification features

The exact pricing model should be decided after the MVP and initial user feedback.

---

# 13. Future Certification System

A future HeimDall certification system may provide recognition for skills or activities completed through the platform.

Possible capabilities:

```text
Skill
  ↓
Assessment / Activity
  ↓
Verification
  ↓
Achievement
  ↓
HeimDall Certification
```

This is a future product direction and should not be part of the four-week MVP unless the core platform is already stable.

---

# 14. Long-Term Product Direction

The long-term goal is for HeimDall to become a digital operating platform for organizations.

The product can gradually move from:

```text
Managing Company Information
```

to:

```text
Understanding Company Information
```

and eventually toward:

```text
Helping People Act on Company Information
```

The long-term product loop is:

```text
Capture
   ↓
Organize
   ↓
Understand
   ↓
Identify
   ↓
Recommend
   ↓
Act
   ↓
Measure
```

The human remains in control of important decisions and actions.

---

# 15. Roadmap Priorities

The development order should follow this priority:

### Priority 1

Build a reliable company workspace.

### Priority 2

Make tasks and projects actually usable.

### Priority 3

Make contract and document handling useful.

### Priority 4

Add AI where it solves a real workflow problem.

### Priority 5

Connect information through dashboards and notifications.

### Priority 6

Expand into advanced AI, integrations, and organizational tools.

---

# 16. Definition of a Successful MVP

The MVP is successful if a person can understand the value of HeimDall by following one complete workflow:

```text
Create Company
      ↓
Add Employee
      ↓
Create Project
      ↓
Assign Task
      ↓
Upload Contract
      ↓
HeimDall Understands Contract
      ↓
Find Obligation
      ↓
Create Reminder
      ↓
Track Work
      ↓
View Company Dashboard
      ↓
Ask AI for Information
```

The first version does not need to contain every future feature.

It needs to make this core workflow reliable, understandable, and convincing.

---

## 17. Roadmap Status

| Area | Status |
|---|---|
| Product concept | Defined |
| MVP scope | Defined |
| Requirements | Defined |
| Architecture | Defined |
| UI planning | In progress |
| Backend development | Upcoming |
| Frontend development | Upcoming |
| AI pipeline | Upcoming |
| Integration | Upcoming |
| Testing | Upcoming |
| Deployment | Upcoming |
| Post-MVP features | Planned |

---

## 18. Final Direction

HeimDall starts with a focused problem: companies have too much information spread across too many places.

The first four weeks should prove that a single platform can connect people, work, contracts, documents, reminders, and AI assistance in one place.

Everything after the MVP should be driven by real user feedback and actual organizational needs.
