# Lab 2: Work Breakdown & GitHub Issues Scope

**Project:** TokTickIT — Requester Ticketing MVP with UI Foundation  
**Target Branch:** `lab2-staging`  
**Methodology:** Spec-Driven Development (Spec DD) & Test-Driven Development (TDD)  

---

## Sprint Overview & Issue Pipeline

All work flows through individual feature branches into `lab2-staging` via Pull Requests. Direct commits to `main` or `lab2-staging` are prohibited (Section 10.1).

```
main (at Lab 1 completion)
  └── lab2-staging
        ├── feature/1-spec-and-test-plan       ──(PR #12)──> lab2-staging
        ├── feature/2-dev-requester-context    ──(PR #13)──> lab2-staging
        ├── feature/3-ticket-creation          ──(PR #16)──> lab2-staging
        ├── feature/4-my-tickets               ──(PR #19)──> lab2-staging
        ├── feature/5-ticket-detail            ──(PR #21)──> lab2-staging
        ├── feature/6-ui-compliance-fix        ──(PR #23)──> lab2-staging
        ├── feature/7-seed-varied-status       ──(PR #24)──> lab2-staging
        └── [Release PR to main]
```

---

## Issue Decompositions

### Issue 1: Sprint Engineering Specification & Test Plan Deliverables
* **Branch:** `feature/1-spec-and-test-plan`
* **PR:** #12
* **Requirement IDs:** Section 8.9, 8.10, 9.1, 9.2, 12
* **Scope:**
  * Author `docs/lab-02/specification.md` covering all 11 required sections.
  * Author `docs/lab-02/ui-spec.md` with full Zen Green design tokens, component states, and responsive rules.
  * Author `docs/lab-02/api-spec.md` specifying all request/response schemas, errors, and status codes.
  * Author `docs/lab-02/tests.md` with planned test table and AC-to-test traceability matrix.
* **Exclusions:** Code implementation.
* **Acceptance Criteria:**
  * All documentation files exist in `docs/lab-02/` before coding PRs begin.
* **Dependencies:** None.
* **Merge Order:** 1st.

---

### Issue 2: Development Requester Context & Selection Screen
* **Branch:** `feature/2-dev-requester-context`
* **PR:** #13
* **Requirement IDs:** Section 5.1–5.3, 6, 8.1, `BR-03`, `AC-02`
* **Scope:**
  * Define Prisma models: `RequesterUser`, `RelatedSystem`, `Ticket`, `Attachment`.
  * Extend seed with 4 categories, 7 related systems, 4 active requesters, 1 inactive requester.
  * Backend API: `GET /api/requesters` returning only active requesters.
  * Frontend: Development Requester Selection Screen with context banner.
  * Global React Requester Context stored in `sessionStorage`, shown in header.
* **Exclusions:** Passwords, tokens, JWT, cookies.
* **Acceptance Criteria:**
  * Inactive requesters excluded from selector.
  * No requester selected → redirect to selector screen (`AC-02`).
* **Dependencies:** Issue 1.
* **Merge Order:** 2nd.

---

### Issue 3: Ticket Creation & Attachment Upload
* **Branch:** `feature/3-ticket-creation`
* **PR:** #16
* **Requirement IDs:** Section 4.4, 4.5, 8.2, 8.3, `BR-01`, `BR-02`, `AC-01`
* **Scope:**
  * Backend API: `POST /api/tickets` with validation, `TKT-YYYY-XXXXXX` generation, status `NEW`.
  * Support file uploads: max 5 files, ≤5 MB, allowed types (JPG, PNG, WEBP, PDF).
  * Frontend Create Ticket form with field-level validation, busy state, success feedback.
  * API tests (`create-ticket.api.test.ts`) and UI tests (`CreateTicketForm.test.tsx`).
* **Exclusions:** IT Staff priority assignment, status changes beyond `New`.
* **Acceptance Criteria:**
  * Valid submission returns 201 Created with unique Ticket Number (`AC-01`).
  * Invalid submission shows inline error messages without calling API.
* **Dependencies:** Issue 2.
* **Merge Order:** 3rd.

---

### Issue 4: My Tickets Dashboard (List, Filter, Sort, Pagination)
* **Branch:** `feature/4-my-tickets`
* **PR:** #19
* **Requirement IDs:** Section 6.1, 8.4, `FR-07`, `FR-08`, `AC-03`
* **Scope:**
  * Backend API: `GET /api/tickets` scoped to `requesterId` with search, filters, sorting, pagination.
  * Frontend: Desktop table + mobile card view, search bar, filter dropdowns, pagination controls.
  * Ownership isolation: Requester A cannot see Requester B's tickets.
  * API tests (`my-tickets.api.test.ts`) and UI tests (`MyTicketsDashboard.test.tsx`).
* **Exclusions:** Admin view, ticket modification on list.
* **Acceptance Criteria:**
  * Switching requester immediately reloads list with correct isolation (`AC-03`).
  * Search and filters return correct subsets.
* **Dependencies:** Issue 3.
* **Merge Order:** 4th.

---

### Issue 5: Requester Ticket Detail & Soft-removal Attachments
* **Branch:** `feature/5-ticket-detail`
* **PR:** #21
* **Requirement IDs:** Section 4.5, 6, 8.5, `BR-04`, `BR-11`, `BR-12`, `AC-04`, `AC-07`, `AC-08`
* **Scope:**
  * Backend APIs: `GET /api/tickets/:id`, `POST /api/tickets/:id/attachments`, `DELETE /api/tickets/:id/attachments/:attachmentId`, `GET /api/attachments/:id/download`.
  * Frontend Ticket Detail: read-only overview card, description, attachment list.
  * Active attachments: Download button; Soft-removed: metadata display, download blocked (HTTP 410).
  * Soft-removal modal with mandatory reason (min 3 chars).
  * Playwright E2E test (`e2e/lab-02/requester-ticket-flow.spec.ts`) with screenshots in `artifacts/lab-02/screenshots/`.
  * API tests (`ticket-detail.api.test.ts`, `attachments.api.test.ts`) and UI tests (`TicketDetailView.test.tsx`).
* **Exclusions:** Comments, status changes, ticket owner changes.
* **Acceptance Criteria:**
  * Accessing another requester's ticket returns 403 Forbidden (`AC-04`).
  * Soft-removed attachment returns HTTP 410 on download (`AC-08`).
* **Dependencies:** Issue 4.
* **Merge Order:** 5th.

---

### Issue 6: UI Compliance Audit & Final Fixes
* **Branch:** `feature/6-ui-compliance-fix`
* **PR:** #23
* **Requirement IDs:** `BR-05`, `BR-06`, UI Spec 7.2, 7.3
* **Scope:**
  * Add `Last Updated` column to My Tickets desktop table (UI Spec 7.3 — 7 required columns).
  * Add "Showing X–Y of Z tickets" pagination range text (UI Spec 7.3).
  * Add Read-only Meta Strip on Create Ticket form: Ticket No., Ticket Date, Requester (UI Spec 7.2).
  * Fix Summary frontend validation: min 5 chars, max 100 chars (BR-05).
  * Fix Description frontend validation: min 10 chars, max 2,000 chars with counter (BR-06).
  * Update `CreateTicketForm.test.tsx` to reflect corrected BR-05 minimum.
* **Exclusions:** Backend changes (backend validation was already correct).
* **Acceptance Criteria:**
  * My Tickets table shows 7 columns including `Last Updated`.
  * Pagination shows record range text.
  * Create Ticket form shows read-only meta strip.
  * Frontend validation matches BR-05 and BR-06 exactly.
  * All unit tests pass.
* **Dependencies:** Issue 5.
* **Merge Order:** 6th.

---

### Issue 7: Add varied-status seed data & PENDING UI
* **Branch:** `feature/7-seed-varied-status`
* **PR:** [Link to PR 7]
* **Requirement IDs:** Lab Sheet Example Match
* **Scope:**
  * Update `seed.ts` to include 7 tickets for Jennifer Anderson with varied statuses (`NEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `PENDING`) to match the lab sheet UI examples.
  * Update Ticket numbers for David and Sarah to avoid collision.
  * Add `PENDING` to `currentStatus` Enum in frontend `api.ts`.
  * Add `zen-badge-pending` CSS class and integrate into `TicketDetailView.tsx` and `MyTicketsDashboard.tsx`.
* **Exclusions:** Backend Prisma schema changes (PENDING handled as raw string since Prisma allows it with SQLite/String, though we use String default NEW).
* **Acceptance Criteria:**
  * Jennifer has exactly 7 tickets in My Tickets dashboard.
  * `PENDING` status renders as a yellow badge.
  * Status filter includes `PENDING`.
* **Dependencies:** Issue 6.
* **Merge Order:** 7th (Final).
