# Phase 1 — Development Pass Specifications

Governing principles for every Claude Code pass. Target users: **senior executives**.

## Global Architecture

Everything must be built around a **central expandable core**.

```text
                 ┌─────────────────────┐
                 │   CENTRAL CORE      │
                 │ Users               │
                 │ Projects            │
                 │ Builders            │
                 │ Verification        │
                 │ Matching            │
                 │ Proposals           │
                 │ Payments            │
                 └─────────┬───────────┘
                           │
             ┌─────────────┼─────────────┐
             ↓             ↓             ↓
        Customer UI    Builder UI    Admin UI
```

**One core. Multiple experiences.**

No duplicated business logic, data or workflows.

---

## Pass 1 — Foundation & Core

### Objective

Build the central platform foundation correctly before adding business features.

### Specification

* React + TypeScript
* Node.js + TypeScript
* MySQL
* Modular monolith
* Authentication
* RBAC
* Core data model
* API structure
* Design system
* Error handling
* Audit foundation
* Notification foundation
* File/document foundation

### UX principle

**Executive-grade simplicity.**

No clutter, dashboards full of meaningless numbers, unnecessary menus or decorative UI.

### Deliverable

A clean expandable core onto which every later pass plugs in.

---

## Pass 2 — Customer Experience

### Objective

Make submitting a genuine project **effortless and trustworthy**.

### Customer journey

```text
Register
   ↓
Verify
   ↓
Create Project
   ↓
Upload Documents
   ↓
Submit
   ↓
Verified
   ↓
Receive Builder Proposals
```

### UX rules

* Minimal steps
* Plain language
* One decision at a time
* Clear progress
* No unnecessary forms
* Save automatically
* Never ask for the same information twice
* Mobile responsive

### Executive principle

> **The customer should never have to understand the platform.**

---

## Pass 3 — Builder Experience

### Objective

Make the platform the **highest-quality source of construction opportunities** for builders.

### Builder journey

```text
Register
   ↓
Company Profile
   ↓
Verify
   ↓
Subscribe
   ↓
See Matching Projects
   ↓
Evaluate
   ↓
Bid
```

### Project card

Show only what matters:

* Project type
* Location
* Size
* Budget
* Readiness
* Key requirements
* Match score
* Closing date

### Builder UX principle

> **A builder should understand an opportunity in seconds.**

No information overload.

---

## Pass 4 — Marketplace

### Objective

Create the trusted exchange between projects and builders.

### Core workflow

```text
Verified Project
       ↓
Eligibility
       ↓
Matching Builders
       ↓
Project Access
       ↓
Proposal
```

### Trust requirements

* Only verified builders participate
* Only verified projects are published
* Customer identity protected
* Builder identity verified
* Project information clearly labelled
* Access controlled
* Bid confidentiality

### Critical principle

> **Quality of opportunities is more important than quantity.**

---

## Pass 5 — AI Matching

### Objective

Help the platform identify the **best-fit builders**, not simply the largest number of builders.

### Matching inputs

* Project type
* Location
* Size
* Budget
* Requirements
* Builder capability
* Experience
* Availability
* Historical performance when available

### Output

```text
96% Match
```

with a concise explanation:

> **Strong match because the builder has relevant luxury-villa experience, operates in the project area and regularly handles projects in this budget range.**

### Trust rules

AI cannot:

* Alter verification
* Manufacture reputation
* Favour paying builders
* Hide relevant information

### Principle

> **AI should make the decision clearer, not make the platform mysterious.**

---

## Pass 6 — Proposal & Selection

### Objective

Make comparing builders **dramatically easier than WhatsApp + Excel + PDFs**.

### Customer sees

```text
BUILDER A
KWD XXX
14 months
96% Match

BUILDER B
KWD XXX
16 months
93% Match

BUILDER C
KWD XXX
13 months
91% Match
```

Then:

### Compare

* Price
* Duration
* Scope
* Exclusions
* Payment terms
* Warranty
* Key differences

### Trust principle

Never manipulate the comparison to favour a builder.

The customer chooses.

---

## Pass 7 — Commercial

### Objective

Implement the simplest viable monetization.

### Customer

* Verification fee
* Payment status
* Receipt

### Builder

* Verification fee
* Subscription
* Renewal
* Payment status

### Rules

* Payment does not equal verification
* Premium status does not equal better trust
* Subscription does not artificially improve AI ranking
* Failed payments handled cleanly

### UX

The user should always know:

> **What am I paying? Why? What do I get?**

No dark patterns.

---

## Pass 8 — Admin, Trust & Production Hardening

### Objective

Give the platform operators complete control without exposing complexity to customers or builders.

### Admin

* Customer verification
* Builder verification
* Project verification
* Project management
* Builder management
* Proposal monitoring
* Subscription management
* Audit history
* Suspensions
* Manual review

### Trust

Every important action must be traceable.

### Security

* RBAC
* Secure authentication
* Private documents
* Access control
* Input validation
* Rate limiting
* Secure uploads
* Backups
* Audit logs

### Production

* Error monitoring
* Logging
* Database backup
* Deployment process
* Recovery procedure

---

## The Rules Claude Code Must Follow in Every Pass

These should be included in **every pass prompt**.

1. **Clarity over features** — If a feature makes the experience harder to understand, question it.
2. **User experience over technical convenience** — Don't make users adapt to the architecture.
3. **Trust over growth** — Never weaken verification, privacy or transparency to increase conversion.
4. **Zero bloat** — Every screen, field, button, notification and workflow must justify its existence.
5. **No duplication** — One business rule. One data source. One implementation.
6. **No conflicting logic** — A rule defined in the core cannot be reimplemented differently in another module.
7. **Central expandable core** — New functionality plugs into the core rather than creating parallel systems.
8. **No speculative engineering** — Don't build for imaginary future requirements.
9. **Executive UX** — Users are busy, intelligent and impatient. Few clicks. Clear information. Immediate understanding.
10. **No feature drift** — Claude must not introduce functionality outside the current pass.

---

## The UX Standard

The product should feel like:

> **A premium professional service, delivered through software.**

Not:

> A complicated construction marketplace.

The design target is:

**Sharp. Quiet. Trustworthy. Fast.**

A senior executive should be able to open the application and understand:

> **Where am I?**
> **What matters?**
> **What do I need to do next?**

within seconds.

---

## One Governing Statement

> **Build a razor-sharp, trust-first platform around a central expandable core. Every feature must earn its place. Every workflow must be simple. Every important rule must have one source of truth. Never sacrifice clarity, trust or user experience for technical convenience or feature quantity.**
