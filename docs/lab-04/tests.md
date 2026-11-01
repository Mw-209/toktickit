# Lab 4 Test Plan

**Project:** TokTickIT — Actions Taken, Dashboards, and Final Regression  
**Methodology:** Test-Driven Development (TDD) — this plan is created before implementation

---

## 1. Test Coverage Overview

| Type | Count (Planned) | Count (Actual) | Files | Final Status |
|------|-----------------|----------------|-------|--------------|
| API / Integration | 35+ | 40 | `server/tests/lab-04/` (4 files) | **Pass** |
| UI Component | 20+ | 22 | `client/tests/lab-04/` (4 files) | **Pass** |
| E2E (Playwright) | 15+ | 24 | `e2e/lab-04/` (3 files across 3 viewports) | **Pass** |

---

## 2. Test Plan Table

### 2.1 Actions Taken API Tests (`server/tests/lab-04/actions-taken.api.test.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Automated Test File | Status |
|---------|------|----|--------------|-----------------|---------------------|--------|
| API-AT-01 | API | AC-01 | IT Staff creates valid Action Taken | 201 Created, record saved with performedById = authenticated user | actions-taken.api.test.ts | **Pass** |
| API-AT-02 | API | AC-02 | Requester attempts POST to actions endpoint | 403 Forbidden | actions-taken.api.test.ts | **Pass** |
| API-AT-03 | API | AC-03 | Create Action Taken with followUpRequired=true and empty followUpNote | 400 Bad Request | actions-taken.api.test.ts | **Pass** |
| API-AT-04 | API | AC-01 | Create Action Taken with followUpRequired=true and valid followUpNote | 201 Created | actions-taken.api.test.ts | **Pass** |
| API-AT-05 | API | — | GET actions for a Ticket returns all Actions Taken | 200 OK, array of actions | actions-taken.api.test.ts | **Pass** |
| API-AT-06 | API | — | Unauthenticated GET actions endpoint | 401 Unauthorized | actions-taken.api.test.ts | **Pass** |
| API-AT-07 | API | — | IT Staff updates an existing Action Taken with correct version | 200 OK, updated fields returned | actions-taken.api.test.ts | **Pass** |
| API-AT-08 | API | AC-07 | Concurrent update with stale version | 409 Conflict | actions-taken.api.test.ts | **Pass** |
| API-AT-09 | API | — | Client supplies a different performedById in request body | Field ignored; stored as authenticated user | actions-taken.api.test.ts | **Pass** |
| API-AT-10 | API | — | Create Action Taken on a Ticket the IT Staff cannot access | 403 Forbidden | actions-taken.api.test.ts | **Pass** |

---

### 2.2 Ticket Workflow API Tests (`server/tests/lab-04/ticket-workflow.api.test.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Automated Test File | Status |
|---------|------|----|--------------|-----------------|---------------------|--------|
| API-WF-01 | API | AC-08 | IT Staff transitions Ticket from Closed to In Progress | 400 Bad Request | ticket-workflow.api.test.ts | **Pass** |
| API-WF-02 | API | — | IT Staff transitions Ticket from New to Open | 200 OK, status updated | ticket-workflow.api.test.ts | **Pass** |
| API-WF-03 | API | — | IT Staff transitions Ticket from In Progress to Resolved | 200 OK, status = Resolved | ticket-workflow.api.test.ts | **Pass** |
| API-WF-04 | API | AC-06 | Requester flags "problem appears resolved" — status unchanged | 200 OK, status not changed to Resolved | ticket-workflow.api.test.ts | **Pass** |
| API-WF-05 | API | — | Requester attempts to directly transition status to Resolved | 403 Forbidden | ticket-workflow.api.test.ts | **Pass** |
| API-WF-06 | API | AC-07 | Two concurrent status patches using same ticket version | Second returns 409 Conflict | ticket-workflow.api.test.ts | **Pass** |
| API-WF-07 | API | — | IT Staff cancels a Ticket from In Progress | 200 OK, status = Cancelled | ticket-workflow.api.test.ts | **Pass** |
| API-WF-08 | API | — | IT Staff reopens a Cancelled Ticket | 200 OK, status = Reopened | ticket-workflow.api.test.ts | **Pass** |
| API-WF-09 | API | — | Unauthenticated status PATCH | 401 Unauthorized | ticket-workflow.api.test.ts | **Pass** |

---

### 2.3 Requester Dashboard API Tests (`server/tests/lab-04/requester-dashboard.api.test.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Automated Test File | Status |
|---------|------|----|--------------|-----------------|---------------------|--------|
| API-RD-01 | API | AC-04 | Requester gets their own dashboard | 200 OK, only own Ticket metrics | requester-dashboard.api.test.ts | **Pass** |
| API-RD-02 | API | AC-04 | Requester A cannot see Requester B's data | Metrics match only Requester A's Tickets | requester-dashboard.api.test.ts | **Pass** |
| API-RD-03 | API | — | IT Staff attempts to access requester dashboard endpoint | 403 Forbidden | requester-dashboard.api.test.ts | **Pass** |
| API-RD-04 | API | — | Unauthenticated access to requester dashboard | 401 Unauthorized | requester-dashboard.api.test.ts | **Pass** |
| API-RD-05 | API | — | Requester dashboard with zero open Tickets returns 0, not null | 200 OK, totalOpen = 0 | requester-dashboard.api.test.ts | **Pass** |

---

### 2.4 IT Staff Dashboard API Tests (`server/tests/lab-04/staff-dashboard.api.test.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Automated Test File | Status |
|---------|------|----|--------------|-----------------|---------------------|--------|
| API-SD-01 | API | AC-05 | IT Staff dashboard unassigned count matches DB | 200 OK, unassignedCount = actual count | staff-dashboard.api.test.ts | **Pass** |
| API-SD-02 | API | — | My Tickets count matches Tickets owned by authenticated user | myTicketsCount correct | staff-dashboard.api.test.ts | **Pass** |
| API-SD-03 | API | — | Requester attempts to access staff dashboard | 403 Forbidden | staff-dashboard.api.test.ts | **Pass** |
| API-SD-04 | API | — | Unauthenticated access to staff dashboard | 401 Unauthorized | staff-dashboard.api.test.ts | **Pass** |
| API-SD-05 | API | — | Staff dashboard with zero unassigned Tickets returns 0, not null | 200 OK, unassignedCount = 0 | staff-dashboard.api.test.ts | **Pass** |

---

### 2.5 UI Component Tests

#### ActionsTaken (`client/tests/lab-04/ActionsTaken.test.tsx`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| UI-AT-01 | UI | AC-01 | Actions Taken list renders all returned actions | All action cards visible | **Pass** |
| UI-AT-02 | UI | AC-03 | Submit form with followUpRequired=true and empty note shows validation error | Inline error message shown | **Pass** |
| UI-AT-03 | UI | — | Requester view shows read-only list (no create button) | Create button absent | **Pass** |
| UI-AT-04 | UI | — | IT Staff view shows Create Action Taken button | Button present and clickable | **Pass** |
| UI-AT-05 | UI | — | Empty state when no Actions Taken | "No actions recorded" message shown | **Pass** |

#### StaffDashboard (`client/tests/lab-04/StaffDashboard.test.tsx`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| UI-SD-01 | UI | AC-05 | Dashboard renders unassigned count from API | Correct number displayed | **Pass** |
| UI-SD-02 | UI | — | Loading state shown while fetching | Spinner or skeleton visible | **Pass** |
| UI-SD-03 | UI | — | Clicking a metric card navigates to filtered view | Correct URL or filtered list rendered | **Pass** |
| UI-SD-04 | UI | — | Forbidden state shown when role mismatch | 403 feedback message shown | **Pass** |

#### RequesterDashboard (`client/tests/lab-04/RequesterDashboard.test.tsx`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| UI-RD-01 | UI | AC-04 | Dashboard renders only requester-scoped data | Own Ticket counts displayed | **Pass** |
| UI-RD-02 | UI | — | Loading state shown while fetching | Spinner or skeleton visible | **Pass** |
| UI-RD-03 | UI | — | Empty state when Requester has no open Tickets | 0 count or empty message shown | **Pass** |

#### TicketWorkflow (`client/tests/lab-04/TicketWorkflow.test.tsx`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| UI-WF-01 | UI | AC-08 | Status dropdown only shows permitted transitions | Closed → In Progress not selectable | **Pass** |
| UI-WF-02 | UI | — | Successful status change refreshes displayed status | New status badge updated immediately | **Pass** |
| UI-WF-03 | UI | AC-06 | Requester "appears resolved" button does not change status badge | Status unchanged in UI after click | **Pass** |

---

### 2.6 End-to-End Tests (Playwright)

#### Actions Taken Flow (`e2e/lab-04/actions-taken-flow.spec.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| E2E-AT-01 | E2E | AC-01 | IT Staff logs in, opens Ticket, views Action Taken list (Desktop, Tablet, Mobile) | Full-page screenshots captured, Actions Taken visible | **Pass** |
| E2E-AT-02 | E2E | AC-03 | IT Staff submits Action Taken with followUp=true and no note | Inline validation error visible (`#followup-error`) | **Pass** |
| E2E-AT-03 | E2E | AC-02 | Requester logs in, opens Ticket — no create button visible | Create button absent, read-only mode verified | **Pass** |

#### Ticket Resolution (`e2e/lab-04/ticket-resolution.spec.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| E2E-WF-01 | E2E | — | IT Staff completes Ticket status transition across Desktop, Tablet, Mobile | Transition verified, status updated | **Pass** |
| E2E-WF-02 | E2E | AC-06 | Requester marks ticket as "appears resolved" — IT Staff sees advisory badge | Advisory flag set, status not changed to Resolved | **Pass** |

#### Dashboards (`e2e/lab-04/dashboards.spec.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| E2E-DB-01 | E2E | AC-05 | IT Staff dashboard shows approved metrics and drill-down links | Metric cards and recent tickets visible | **Pass** |
| E2E-DB-02 | E2E | AC-04 | Requester dashboard shows only own Tickets and scoped metrics | Scoped counts and recent tickets visible | **Pass** |
| E2E-DB-03 | E2E | — | Clicking quick action or card navigates to target view | Destination view rendered with zero white screen | **Pass** |

---

## 3. Regression Test Coverage (Labs 1–3)

All existing test suites pass on the main branch after Lab 4 changes:

| Suite | Path | AC | Status |
|-------|------|----|--------|
| Lab 3 Auth API | `server/tests/lab-03/auth.api.test.ts` | AC-10 | **Pass** |
| Lab 3 Authorization API | `server/tests/lab-03/authorization.api.test.ts` | AC-10 | **Pass** |
| Lab 3 Ticket API | `server/tests/lab-03/` | AC-10 | **Pass** |
| Lab 2 Ticket API | `server/tests/lab-02/` | AC-10 | **Pass** |
| Lab 3 Client UI | `client/tests/lab-03/` | AC-10 | **Pass** |
| Lab 2 Client UI | `client/tests/lab-02/` | AC-10 | **Pass** |
