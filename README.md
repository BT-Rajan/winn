# Winn

A trust-first construction marketplace platform, built around a central
expandable core with three experiences plugged into it: Customer, Builder,
and Admin.

See [`docs/PHASE_1_CONSTITUTION.md`](docs/PHASE_1_CONSTITUTION.md) for the
full development-pass specification and the rules every pass follows.

## Status

**Pass 1 — Foundation & Core: complete.**

Built so far:

- Authentication (register, login, refresh, logout) with JWT access tokens
  and rotating hashed refresh tokens
- RBAC (admin / customer / builder) enforced centrally, not per-module
- Core data model: users, roles, audit_logs, notifications, files
- Central error handling (one `AppError` hierarchy, one formatting middleware)
- Audit foundation — every important action writes through one service
- Notification foundation — in-app now, channel-extensible later
- File/document foundation — storage behind a swappable driver, private by default
- Design system tokens + base components (Button, Input, Card, AppShell)
- Login / Register / Dashboard, session restore on reload

Passes 2–8 (Customer, Builder, Marketplace, AI Matching, Proposal &
Selection, Commercial, Admin/Trust/Production) build on this core without
duplicating it — see the constitution doc.

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
