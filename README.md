# Winn

A trust-first construction marketplace platform, built around a central
expandable core with three experiences plugged into it: Customer, Builder,
and Admin.

See [`docs/PHASE_1_CONSTITUTION.md`](docs/PHASE_1_CONSTITUTION.md) for the
full development-pass specification and the rules every pass follows.

## Status

**Pass 1 — Foundation & Core: complete.**
**Pass 2 — Customer Experience: complete.**
**Pass 3 — Builder Experience: complete.**
**Pass 4 — Marketplace: complete.**
**Pass 5 — AI Matching: complete.**
**Pass 6 — Proposal & Selection: complete.**

Built so far:

- Authentication (register, login, refresh, logout) with JWT access tokens
  and rotating hashed refresh tokens
- RBAC (admin / customer / builder) enforced centrally, not per-module
- Core data model: users, roles, audit_logs, notifications, files, projects,
  project_documents, builder_profiles, builder_documents, proposals
- Central error handling (one `AppError` hierarchy, one formatting middleware)
- Audit foundation — every important action writes through one service
- Notification foundation — in-app now, channel-extensible later
- File/document foundation — storage behind a swappable driver, private by
  default, with a generic access-grant hook new modules can extend without
  reimplementing the ownership check
- Design system tokens + base components (Button, Input, Textarea, Card, AppShell)
- Login / Register / Dashboard, session restore on reload
- **Customer project workspace:** start a project, fill in details with
  autosave (one field at a time, no separate "Save" step), attach
  documents via the Pass 1 file foundation, and submit — enforced
  server-side, not just hidden in the UI, so a project can't be submitted
  incomplete. Once submitted, a project becomes read-only for the customer
  until an admin verifies or rejects it (Pass 8).
- **Builder company profile:** a builder's single profile is created
  lazily on first visit — no separate "start" step. Autosave for company
  name, description, years of experience, typical budget range, service
  locations, and specialties; upload verification documents via the same
  file foundation; submit for verification once complete, enforced
  server-side. Once submitted, the profile is read-only until an admin
  verifies or rejects it (Pass 8), at which point a rejection reopens it
  for edits and resubmission.
- **Marketplace:** verified builders browse verified projects — project
  type, location, size, budget, closing date, and a requirements summary,
  with customer identity never exposed. Clicking in shows the full brief
  and lets the builder download the project's documents, access granted
  purely because both sides are verified — no separate access-grant table.
  An unverified builder gets a clear "get verified first" message instead
  of an error.
- **AI Matching:** a deterministic, rule-based match score (0–100%) and a
  plain-language explanation for every project/builder pair, computed
  from specialty overlap, location overlap, typical-budget-range overlap,
  and years of experience — the only inputs the platform actually has
  real data for. Availability and historical performance are
  constitution-listed inputs deliberately left out, since there's no real
  signal behind them yet (no capacity tracking, no completed-project
  history) — nothing is faked to fill the gap. The score is fully
  traceable to its inputs (exposed as `matchedCriteria`), and the
  marketplace listing is ranked best-match-first.
- **Proposal & Selection:** a verified builder submits one proposal per
  verified project (price, duration, scope, exclusions, payment terms,
  warranty) — a complete document, not an autosaved draft, since a bid is
  a formal commitment, not a work-in-progress form. They can edit or
  withdraw it while it's still open, and resubmit after withdrawing. The
  customer sees every active proposal on their project side by side —
  company, price, duration, full terms, and the same honest match score
  from Pass 5 — in submission order, never re-sorted or filtered by the
  platform, because the constitution's trust rule here is explicit: *the
  customer chooses*. Awarding a proposal is one atomic transaction: the
  winning bid is marked awarded, every other open bid on that project is
  rejected, and the project itself closes to further proposals — never a
  partial award. Both sides get notified through the Pass 1 notification
  foundation.

Passes 7–8 (Commercial, Admin/Trust/Production) build on this core
without duplicating it — see the constitution doc. Subscription/paywall
and admin verification of both projects and builder profiles are
deliberately not built yet. Because no admin verification exists yet, the
marketplace, matching, and proposal flow all have no real data to show
until Pass 8 lands.

## Structure

```
winn/
  server/   Node.js + TypeScript + MySQL API (modular monolith)
  client/   React + TypeScript UI (Vite)
  docs/     Phase 1 constitution
```

## Getting started

### Server

```bash
cd server
cp .env.example .env   # fill in your MySQL credentials + JWT secrets
npm install
npm run migrate         # applies migrations in server/src/db/migrations
npm run dev              # http://localhost:4000
```

### Client

```bash
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Register a customer or builder account from the UI, or `POST /api/auth/register`.
