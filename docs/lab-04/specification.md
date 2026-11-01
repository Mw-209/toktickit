# Lab 4 Sprint Engineering Specification

**Project:** TokTickIT — Actions Taken, Dashboards, and Final Regression  
**Target Delivery:** Sprint 4 (`lab4-staging`)  
**Methodology:** Spec-Driven Development (Spec DD) & Test-Driven Development (TDD)

---

## 1. Sprint Goal

Deliver a complete IT service-desk work flow by adding Actions Taken under each Ticket, enforcing the final Ticket status lifecycle, providing role-appropriate dashboards for Requesters and IT Staff, and hardening the entire application built across Labs 1–3 to production-ready quality under the Zen Green design language.

---

## 2. Stakeholder Request Interpretation

The service desk needs a structured way for IT Staff to record the work they perform on each Ticket. Each Action Taken captures what was done, when, by whom, what the result was, and whether a follow-up is needed. The primary Ticket Owner still coordinates the Ticket overall, but different staff members may each record their own Actions. Requesters can view Actions Taken but cannot create or change them. Concise dashboards help each role find the information most relevant to them without duplicating the full Ticket list. The entire application must be polished, regression-tested, and presented under the Zen Green design language.

---

## 3. Scope

### 3.1 Included Scope
1. **Actions Taken:** Create, view, and update Actions Taken records linked to a Ticket (IT Staff and Administrator only).
2. **Actions Taken Fields:** Action Date/Time, Action Description, Result, Performed By (auto-set to authenticated user), Follow-Up Required (boolean), Follow-Up Note (required when Follow-Up Required = true), Attachment Notes.
3. **Ticket Owner vs. Actions Taken Assignee:** One primary Ticket Owner coordinates the Ticket; Actions Taken may be performed by any IT Staff member.
4. **Complete Ticket Status Lifecycle:** New → Open → In Progress → Waiting for Requester → Resolved → Closed / Cancelled / Reopened — enforced on the backend.
5. **Resolution Gate:** Requester "problem appears resolved" flag is advisory; IT Staff must formally set Resolved status.
6. **IT Staff Dashboard:** Unassigned Tickets, Tickets owned by current user, Tickets by status/priority, recently updated Tickets, current-user Actions Taken summary.
7. **Requester Dashboard:** Total open Tickets, Tickets waiting for Requester, recently updated Tickets, recently resolved Tickets — scoped to the authenticated Requester only.
8. **Regression Hardening:** All Labs 1–3 features (auth, Requester, IT Staff, Admin, comments, notes, attachments) continue to work.
9. **Zen Green Final Polish:** Responsive, accessible, visually consistent across all screens.
10. **Documentation:** specification.md, tests.md, ui-spec.md, api-spec.md, reviewer.md, ai-use.md.

### 3.2 Excluded Scope
1. Automatic SLA clocks, escalation engines, on-call scheduling, and breach notifications.
2. Email, SMS, LINE, push, or other external notification services.
3. Inventory consumption, spare-parts management, purchasing, or cost accounting.
4. Time-sheet billing, payroll, or detailed labor-cost calculation.
5. Multi-level approval workflows and electronic signatures.
6. Advanced BI tools, custom report builders, or export warehouses.
7. Multi-tenant organizations and production-scale cloud operations.
8. New product features not approved in this Sprint 4 engineering contract.

---

## 4. Functional Requirements

* **FR-01 (Actions Taken — Create):** IT Staff and Administrators shall create an Action Taken record linked to an accessible Ticket. The Performed By field is automatically set to the authenticated user's identity.
* **FR-02 (Actions Taken — Update):** IT Staff and Administrators shall update an existing Action Taken record on an accessible Ticket.
* **FR-03 (Actions Taken — List):** All authenticated roles shall retrieve the list of Actions Taken for a Ticket they are permitted to view.
* **FR-04 (Actions Taken — Requester Read-Only):** Requesters shall view Actions Taken for their own Tickets but shall not create or modify them.
* **FR-05 (Follow-Up Note Required):** When Follow-Up Required is true, Follow-Up Note shall be non-empty; the backend shall reject requests that violate this rule.
* **FR-06 (Ticket Status Transitions):** The backend shall enforce only permitted transitions for the current user's role; invalid transitions shall return 400 or 403.
* **FR-07 (Resolution Gate):** A Requester "problem appears resolved" action shall not change the Ticket status to Resolved; only IT Staff or Administrator may formally set Resolved.
* **FR-08 (Conflict Detection):** The API shall detect stale or concurrent updates and return 409 Conflict when a user's payload reflects an outdated state.
* **FR-09 (IT Staff Dashboard):** The backend shall compute and return IT Staff dashboard metrics in a single endpoint; metrics shall reflect authoritative database queries.
* **FR-10 (Requester Dashboard):** The backend shall compute and return Requester dashboard metrics scoped to the authenticated Requester only.
* **FR-11 (Dashboard Drill-Down):** Each dashboard metric shall expose a link or query parameter that navigates to the corresponding filtered list or detail view.
* **FR-12 (Regression):** All Labs 1–3 APIs and screens shall continue to work correctly after Lab 4 migrations and changes.

---

## 5. Business Rules

| BR ID | Business Rule |
|-------|---------------|
| BR-01 | An Action Taken belongs to exactly one Ticket and cannot be moved to another Ticket. |
| BR-02 | The primary Ticket Owner coordinates the Ticket; an Action Taken may be performed by a different IT Staff member. |
| BR-03 | Requesters may not create or modify Actions Taken. Hiding the UI control does not satisfy this rule — the backend must enforce it. |
| BR-04 | The Performed By field is automatically set to the authenticated user who makes the create request; clients may not supply a different actor. |
| BR-05 | Follow-Up Note is required (non-empty string) whenever Follow-Up Required is true. |
| BR-06 | A Requester flag of "problem appears resolved" does not change Ticket status to Resolved. |
| BR-07 | Only IT Staff and Administrators may formally transition a Ticket to Resolved. |
| BR-08 | A Closed or Cancelled Ticket may only transition to Reopened. |
| BR-09 | Dashboard metrics must be calculated by the backend from authoritative database queries; client-side aggregation is not permitted. |
| BR-10 | Requester dashboard must only include data for Tickets owned by the authenticated Requester. |
| BR-11 | All existing Ticket, User, Attachment, Comment, and Note data must be preserved through Lab 4 migrations. |
| BR-12 | Seed data must be idempotent (safe to run multiple times without duplicating records). |

---

## 6. Ticket Status Transition Matrix

| From \ To | New | Open | In Progress | Waiting for Requester | Resolved | Closed | Cancelled | Reopened |
|-----------|-----|------|------------|----------------------|----------|--------|-----------|----------|
| **New** | — | IT Staff / Admin | — | — | — | — | IT Staff / Admin | — |
| **Open** | — | — | IT Staff / Admin | IT Staff / Admin | — | — | IT Staff / Admin | — |
| **In Progress** | — | IT Staff / Admin | — | IT Staff / Admin | IT Staff / Admin | — | IT Staff / Admin | — |
| **Waiting for Requester** | — | IT Staff / Admin | IT Staff / Admin | — | IT Staff / Admin | — | IT Staff / Admin | — |
| **Resolved** | — | — | — | — | — | IT Staff / Admin | IT Staff / Admin | Requester / IT Staff / Admin |
| **Closed** | — | — | — | — | — | — | — | IT Staff / Admin |
| **Cancelled** | — | — | — | — | — | — | — | IT Staff / Admin |
| **Reopened** | — | IT Staff / Admin | IT Staff / Admin | — | — | — | IT Staff / Admin | — |

---

## 7. UI Specification Summary

Full screen specifications are in `ui-spec.md`. Summary:

* **IT Staff Dashboard** — metric cards (Unassigned, My Tickets, By Status, Recently Updated), each card drills down to a filtered Ticket Queue or detail view.
* **Requester Dashboard** — metric cards (Total Open, Waiting for Me, Recently Updated, Recently Resolved), each scoped to the authenticated Requester's Tickets only.
* **Actions Taken on Ticket Detail** — Actions Taken section below the existing Ticket Detail, visible to all roles. IT Staff and Admin see create/edit controls. Requesters see read-only list.
* **Ticket Workflow Controls** — status selector shows only permitted transitions for the current user's role. Successful transitions refresh the displayed status immediately.
* All screens follow the Zen Green design language: existing design tokens, components, and responsive grid.

---

## 8. Data Changes

### 8.1 New Model — ActionTaken

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `ticketId` | UUID (FK → Ticket) | Required; belongs to exactly one Ticket |
| `performedById` | UUID (FK → User) | Set automatically from authenticated session |
| `actionDateTime` | DateTime | When the action took place; defaults to creation time |
| `actionDescription` | String (text) | Required |
| `result` | String (text) | Required |
| `followUpRequired` | Boolean | Default false |
| `followUpNote` | String? | Required when `followUpRequired = true` |
| `attachmentNotes` | String? | Optional notes describing attached files |
| `createdAt` | DateTime | Auto-managed |
| `updatedAt` | DateTime | Auto-managed |

**Decision 1:** `performedById` is set by the server from the session token and is not accepted from the client body, to prevent impersonation.

**Decision 2:** A `version` integer field is added to ActionTaken for optimistic concurrency control; PUT requests must include the current `version` and will receive 409 if it no longer matches.

### 8.2 Migration Strategy

* New migration adds the `ActionTaken` table without altering any existing table.
* Legacy Tickets with no Actions Taken are valid; dashboard queries treat zero-count results as 0, not null.
* Rollback: the migration can be reversed by dropping the `ActionTaken` table; no existing data is affected.

### 8.3 Required Seed Data

* At least 2 Tickets with zero Actions Taken.
* At least 2 Tickets with exactly one Action Taken (one with follow-up, one without).
* At least 1 Ticket with multiple Actions Taken by different IT Staff members.
* Actions Taken covering all `followUpRequired` = true and false cases.
* Data sufficient to produce non-zero values for every IT Staff and Requester dashboard metric.

---

## 9. API Contract Summary

Full endpoint specifications are in `api-spec.md`. Summary:

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/tickets/:id/actions` | IT Staff, Admin | Create Action Taken |
| PUT | `/api/tickets/:id/actions/:actionId` | IT Staff, Admin | Update Action Taken |
| GET | `/api/tickets/:id/actions` | All authenticated | List Actions Taken for a Ticket |
| GET | `/api/dashboard/staff` | IT Staff, Admin | IT Staff dashboard metrics |
| GET | `/api/dashboard/requester` | Requester | Requester dashboard metrics |
| PATCH | `/api/tickets/:id/status` | Role-dependent | Transition Ticket status |

All existing Labs 2 and 3 endpoints remain unchanged.

---

## 10. Acceptance Criteria

| AC ID | Criterion |
|-------|-----------|
| AC-01 | Given a permitted IT Staff user and valid data, when an Action Taken is created, it is saved under the correct Ticket with the authenticated user as Performed By. |
| AC-02 | Given a Requester, when they attempt to POST to `/api/tickets/:id/actions`, the backend returns 403 Forbidden. |
| AC-03 | Given Follow-Up Required = true and an empty Follow-Up Note, when the Action Taken is submitted, the backend returns 400 Bad Request. |
| AC-04 | Given an authenticated Requester, when dashboard data is retrieved, only metrics and Tickets owned by that Requester are returned. |
| AC-05 | Given an IT Staff user, when the dashboard endpoint is called, unassigned Ticket count matches the count of Tickets where `ownerId IS NULL`. |
| AC-06 | Given a Ticket in Resolved status, when a Requester flags it as "problem appears resolved", the Ticket status remains Resolved (not changed to Closed by the flag alone). |
| AC-07 | Given concurrent updates where two users submit changes based on the same version, the second request receives 409 Conflict. |
| AC-08 | Given a Ticket in Closed status, when IT Staff attempts a transition to In Progress, the backend returns 400 or 403. |
| AC-09 | Given valid seed data, at least one Ticket has multiple Actions Taken by different IT Staff users. |
| AC-10 | Given the complete Lab 3 test suite run against the Lab 4 codebase on main, all tests pass. |

---

## 11. Definition of Done

- [ ] All FR and BR are implemented and enforced by the backend.
- [ ] All AC have at least one passing automated test mapped to them.
- [ ] `docs/lab-04/specification.md`, `tests.md`, `ui-spec.md`, `api-spec.md`, `reviewer.md`, and `ai-use.md` are present and complete.
- [ ] Prisma migration runs cleanly on a fresh database and on the existing Lab 3 database.
- [ ] Seed data is idempotent and produces non-zero dashboard metrics.
- [ ] All server API tests in `server/tests/lab-04/` pass on main.
- [ ] All client UI tests in `client/.../lab-04/` pass on main.
- [ ] All E2E tests in `e2e/lab-04/` pass on main.
- [ ] Labs 1–3 regression test suites pass on main.
- [ ] No console errors on any screen in any supported role.
- [ ] Responsive layouts verified (desktop, tablet, mobile) with screenshots in `artifacts/lab-04/screenshots/`.
- [ ] Zen Green design language applied consistently across all Lab 4 screens.
- [ ] Keyboard navigation and ARIA labels verified for all new UI elements.
- [ ] README setup, seed, migration, test, and demonstration instructions are current.
- [ ] All GitHub Issues for Sprint 4 are in Done on the Kanban board.
- [ ] Release PR from `lab4-staging` to `main` is approved by peer reviewer and merged.

---

## 12. Assumptions and Decisions

1. **Optimistic Concurrency:** ActionTaken uses a `version` integer field; clients must echo the current version on PUT requests.
2. **Dashboard Calculation Time Zone:** All date-based dashboard filters (e.g., "recently updated") use UTC. Boundary definitions (e.g., "last 7 days") are defined in `api-spec.md`.
3. **Requester "Problem Appears Resolved":** Implemented as a separate boolean flag on the Ticket (`requesterIndicatedResolved`); it does not trigger a status change.
4. **Admin Dashboard:** Reuses the IT Staff dashboard endpoint; no separate Admin-only metrics are required for Lab 4.
5. **Attachment Notes field:** Plain text only; file upload is handled by the existing Attachment system from Lab 2/3.
