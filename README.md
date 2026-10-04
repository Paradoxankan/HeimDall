<p align="center">
  <img src="heimdall-frontend/public/logo.png" alt="HeimDall Logo" width="140" />
</p>

# HeimDall — Enterprise Workspace

> **Stay Ahead.** A role-based company workspace with grounded AI assistance, built for employees, managers, HR teams and executives.

**Submitted to Journey to Masky — Level 2 (Kenshi)**

| | |
|---|---|
| 🌐 **Live demo** | https://heimdall-hazel.vercel.app/ |
| 💻 **Repository** | https://github.com/Sumit10Sinha/HeimDall |

---

## Previews

| | Light | Dark |
|---|---|---|
| **Mobile (375px)** | ![Mobile light](docs/screenshots/mobile-light.png) | ![Mobile dark](docs/screenshots/mobile-dark.png) |
| **Desktop (1280px)** | ![Desktop light](docs/screenshots/desktop-light.png) | ![Desktop dark](docs/screenshots/desktop-dark.png) |

---

## What It Does

HeimDall brings a company's day-to-day work into one workspace. The landing page works as an access gate: pick a persona and the whole UI, navigation and data re-render for that role.

**Four role-based dashboards**

- **Employee:** pending and ongoing tasks, project updates, active projects, and the Heimdall AI assistant.
- **Manager:** a workload status chart (To Do / In Progress / Blocked / Completed), team view with active task counts, critical deadlines, active projects, quick actions and an activity feed.
- **HR:** an employee directory with live, keystroke-by-keystroke search.
- **Executive:** organization-wide overview with a weekly AI company summary, overall risk score, key risks, contract alerts, revenue reports and items requiring attention.

**Key user flows**

1. Choose a persona on the landing page (Employee, Manager, HR or Executive).
2. Update a task status as an employee; the manager's workload chart recalculates instantly from the shared state.
3. Switch dashboards at any time with the role toggles in the top-right bar, with no logout needed.
4. Search the HR directory; a nonexistent name shows a clean empty state.
5. Ask the Heimdall AI assistant a question and watch the loading state before the response appears.
6. Sign out from any dashboard to clear the session and return to the landing page.

---

## Planning Docs

| Document | Link |
|---|---|
| PRD (Product Requirements) | `docs/PRD.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Roadmap | `docs/ROADMAP.md` |
| Deviation from plan | See below |

### Deviation from plan

- The original concept was an **AI Contract Risk & Obligation Manager**. It grew into the broader HeimDall company-management platform.
- The designs show a live Gemini-generated company summary and contract analysis. In this MVP, **data comes from a local `mockData.json`** and **AI responses are simulated** (a 2-second loading state, then a text response).
- Real backend, database, authentication and AI APIs are deliberately deferred to the next milestone (see *What We Learnt*).

---

## Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| Framework | Next.js (App Router) & React | Routing and component-based frontend |
| Language | TypeScript | Strict type-checking |
| Styling | Tailwind CSS v4 | Responsive, utility-first design |
| State management | React Context API & `localStorage` | Session and data state that survives refreshes without a backend |
| Data source | Local `mockData.json` | User profiles, tasks, contracts and projects |
| Deployment | Vercel | Hosts the production build |

---

## Setup Instructions

**Prerequisites:** Git and Node.js v18 or higher.

```bash
# 1. Clone the repository
git clone https://github.com/Sumit10Sinha/HeimDall.git

# 2. Go to the frontend directory
cd HeimDall/heimdall-frontend

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open **http://localhost:3000** in your browser.

## Environment Variables

None required for this MVP phase.

| Variable | Description |
|---|---|
| *(none)* | The app runs entirely on local mock data. |

---

## Must Haves

### Working features

| Feature | Implementation | Experience |
|---|---|---|
| Role-Based Access Control | The landing page updates the global `WorkspaceContext` on persona selection | UI, navigation and data change for Employee, Manager, HR or Executive |
| In-App Dashboard Toggles | Role-switching buttons in the top-right nav | Jump between the 4 dashboards without logging out |
| Sign Out | A working button on all 4 dashboards | Clears session state and returns to the landing page |
| Real-Time Task Analytics Sync | Updating an Employee task status changes the shared mock JSON state | Manager's Workload Status chart recalculates automatically |
| Live HR Directory Search | Reactive filtering of the employee table | Instant results as you type |
| AI Assistant | Chat widget on Employee, Manager, HR and Executive dashboards | Simulated async AI response |

### Animations

- **Page transitions:** `animate-fade-in` on the landing page, welcome headers and dashboards.
- **Micro-interactions:** hover states on sidebar links, action buttons and persona cards.
- **Theme transition:** 300ms eased dark/light mode switch.
- **Mobile drawer:** Gemini-style slide-out navigation using native Tailwind transitions (375px view only).

### Data source

The whole app is powered by a local **`mockData.json`**. The dashboards read, map and render user profiles, task lists, contracts and projects directly from it.

### Empty state

HR Dashboard → Employee Directory. Type a random string such as `xyz` into **"Search name..."**. The table is replaced by a dashed-border box reading *"No employees found. Try adjusting your search query."*

### Loading state

Heimdall AI Assistant widget (visible on the Employee, Manager, HR and Executive dashboards). Type any message into **"Ask AI..."** and press Enter (or click **+**). An `animate-pulse` skeleton of two blinking bars shows for exactly 2 seconds before the response appears.

### Responsiveness and theming

Layouts adapt from mobile (375px) to desktop (1280px), with a dual-button dark/light mode toggle on a global theme state.

---

## What We Learnt

1. **What we built:** HeimDall, a high-fidelity enterprise workspace MVP with four distinct role-based dashboards (Employee, Manager, HR, Executive).
2. **Hardest challenge:** managing global state across four role-based dashboards while fighting browser caching, so the mocked JSON data stayed in sync with the UI.
3. **Proudest design decision:** the dynamic Manager Workload Chart, which recalculates in real time as task statuses change anywhere in the workspace.
4. **Proudest animation:** the Gemini-style mobile drawer navigation, built with smooth native Tailwind CSS transitions.
5. **Self rating: 4 / 5 ⭐.** The MVP delivers a polished, production-like frontend under strict constraints, with complex global state, four role-based dashboards, a responsive layout and real-time visualizations, all without external dependencies. The remaining star depends on replacing local JSON and browser storage with a live backend database, real AI APIs and secure authentication.

---

**Author / Team:** Kenshi · Journey to Masky — Level 2
