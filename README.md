<div align="center">
  <img src="./assets/heimdall-logo.png" alt="HeimDall Logo" width="260" />

# HeimDall

> A company management platform that helps teams keep people, projects, documents, contracts, and obligations organized in one place.

---

## The Idea

Companies often manage important information across spreadsheets, chat messages, emails, cloud folders, and disconnected tools. This makes it difficult to know what needs attention, who is responsible for it, and what obligations are approaching. **HeimDall** brings company operations into one centralized workspace for managing people, projects, tasks, documents, contracts, and obligations. Its core differentiator is contract intelligence, helping teams understand contracts, identify risks, extract obligations, and track what needs to be done.

---

## Sketch

<!-- Excalidraw only. Link the live board AND embed/link a static export as backup. -->

![Sketch](./sketches)

[View live board (Excalidraw)](https://excalidraw.com/#json=wLM3da9J0HQDwyx_gAEGR,qaLlLSxaOpqr-dwqwuVeyQ)

---

## Documents

- [Product Requirements](./HeimDall_PRD.md)
- [Architecture](./Architecture.md)
- [API Spec](./HeimDall_API_Spec.md)
- [Roadmap](./HeimDall_Roadmap.md)
- [Requirements](./HeimDall_Requirements.md)

---

## Planned Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | HTML, CSS, JavaScript | Lightweight and practical interface for the MVP |
| Backend | Python, FastAPI | Fast API development with a strong Python ecosystem |
| Database | PostgreSQL | Reliable relational database for company data |
| Auth | JWT + RBAC | Secure authentication and role-based access |
| AI / ML | Python, LLM/RAG Pipeline | Contract analysis, summaries, risks, obligations, and AI assistance |
| File Storage | Object Storage | Secure storage for contracts and company documents |
| Hosting | Cloud Deployment | Make the platform accessible to real users |

---

## What I'm Building Toward

**Kenshi (frontend):** A complete visual prototype of HeimDall with the main company workspace, dashboard, people management, projects, tasks, contracts, obligations, documents, notifications, reports, and contract-focused AI interface. The frontend will demonstrate the complete user journey and how different parts of the platform connect, even before a backend exists.

**Samurai (full-stack):** Connect the interface to a real backend, database, authentication, and role-based access control. Companies will be able to create workspaces, add employees, manage projects and tasks, upload contracts, extract contract information, track obligations, receive notifications, and interact with HeimDall's AI capabilities using real data.

**Shogun (production):** A secure, scalable SaaS platform that real companies can use for day-to-day operations. HeimDall will provide reliable company management, contract intelligence, AI-assisted decision support, integrations, auditability, and subscription-based features, with the long-term goal of becoming a practical operating workspace for organizations.

---

*Submitted to Journey to Mastery - Level 1: Ronin*
