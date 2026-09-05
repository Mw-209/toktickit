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
        ├── feature/1-spec-and-test-plan  ──(PR #10)──> lab2-staging
        ├── feature/2-db-model-and-seed    ──(PR #11)──> lab2-staging
        ├── feature/3-dev-requester-context──(PR #12)──> lab2-staging
        ├── feature/4-create-ticket        ──(PR #13)──> lab2-staging
        ├── feature/5-my-tickets           ──(PR #14)──> lab2-staging
        ├── feature/6-ticket-detail        ──(PR #15)──> lab2-staging
        ├── feature/7-zen-green-and-e2e    ──(PR #16)──> lab2-staging
        └── [Release PR to main]
```

---

## Issue Decompositions

### Issue 1: Sprint Engineering Specification & Test Plan Deliverables
* **Branch:** `feature/1-spec-and-test-plan`
* **Requirement IDs:** Section 8.9, 8.10, 9.1, 9.2, 12
* **Scope:**
  * Author `docs/lab-02/specification.md` covering all 11 required sections (Sprint Goal, Stakeholder Request, Scope, FR-01..n, BR-01..n, UI Spec summary, Data changes, API contracts, AC-01..n, Definition of Done, Assumptions/Decisions).
  * Author `docs/lab-02/ui-spec.md` with full Zen Green design tokens, component states, and responsive rules.
  * Author `docs/lab-02/api-spec.md` specifying all request/response schemas, errors, and status codes.
  * Author `docs/lab-02/tests.md` with planned test table and AC-to-test traceability matrix.
* **Exclusions:** Code implementation.
* **Acceptance Criteria:**
  * All documentation files exist in `docs/lab-02/` and conform to lab format before coding PRs begin.
* **Dependencies:** None.
* **Merge Order:** 1st.

---

### Issue 2: PostgreSQL Database Model & Idempotent Seed Data
* **Branch:** `feature/2-db-model-and-seed`
* **Requirement IDs:** Section 5.1, 5.2, 5.3
* **Scope:**
  * Define Prisma models: `RequesterUser`, `RelatedSystem`, `Ticket`, `Attachment`, and relate them with existing `Category`.
  * Add required fields: Ticket Number (unique), timestamps, priority enum, status enum, soft-removal fields (`isRemoved`, `removedAt`, `removalReason`).
  * Add foreign keys and performance indexes (e.g. `requesterId`, `ticketNumber`, `status`, `createdAt`).
  * Extend `server/prisma/seed.ts` with 4 categories, 7 related systems, 4 active requesters, and 1 inactive requester.
  * Ensure idempotent seeding (safe to execute multiple times).
* **Exclusions:** Real password hashing or user authentication tables.
* **Acceptance Criteria:**
  * `npx prisma migrate dev` creates clean migration without data loss.
  * `npx prisma db seed` runs repeatedly without error or duplicate rows.
* **Dependencies:** Issue 1.
* **Merge Order:** 2nd.

---

### Issue 3: Development Requester Context & Selection UI/API
* **Branch:** `feature/3-dev-requester-context`
* **Requirement IDs:** Section 6, 8.1, `BR-03`, `AC-02`
* **Scope:**
  * Backend API: `GET /api/requesters` returning only active requesters (`isActive: true`).
  * Frontend: Development Requester Selection Screen (`/select-requester` or initial modal context).
  * Display explanation banner stating this is for Lab 2 testing only, not a real login screen.
  * Global Requester Context in React to manage the selected user, store in local state / session, and show Requester name in header.
  * "Change Requester" action in header to switch context cleanly.
  * Automated API and UI component tests.
* **Exclusions:** Passwords, tokens, JWT, cookies, session auth.
* **Acceptance Criteria:**
  * Inactive requesters are excluded from the selector.
  * If no requester is selected, application redirects to selector screen (`AC-02`).
  * Requester name is visible in top navbar.
* **Dependencies:** Issue 2.
* **Merge Order:** 3rd.

---

### Issue 4: Create Ticket Workflow & Attachment Upload
* **Branch:** `feature/4-create-ticket`
* **Requirement IDs:** Section 4.4, 4.5, 6, 8.2, 8.3, `BR-01`, `BR-02`, `AC-01`
* **Scope:**
  * Backend API: `POST /api/tickets` validating fields, auto-generating unique `ticketNumber` (`TKT-YYYY-XXXXXX`), setting initial status `New`, linking to `requesterId`.
  * Support file uploads: validate max 5 files, ≤5 MB, allowed types (`.jpg`, `.png`, `.webp`, `.pdf`).
  * Frontend Create Ticket form: Category, Related System, Requested Priority, Summary, Description, File input.
  * Field-level validation display directly beneath each field with red asterisk markers.
  * Busy state on submit button; duplicate-submission prevention.
  * Success feedback showing created Ticket Number and redirect / view options.
  * API and UI tests (`create-ticket.api.test.ts`, `CreateTicket.test.tsx`).
* **Exclusions:** IT Staff priority assignment, status progression beyond `New`.
* **Acceptance Criteria:**
  * Valid submission yields 201 Created and persists ticket in DB (`AC-01`).
  * Invalid submission blocks request and shows inline error messages.
  * Files exceeding 5MB or invalid MIME types are rejected with safe error details.
* **Dependencies:** Issue 3.
* **Merge Order:** 4th.

---

### Issue 5: My Tickets Screen (List, Filter, Sort, Pagination)
* **Branch:** `feature/5-my-tickets`
* **Requirement IDs:** Section 6.1, 8.4, `AC-03`
* **Scope:**
  * Backend API: `GET /api/tickets` scoped strictly to `requesterId` query parameter with search (`summary`), filters (`category`, `priority`, `status`), sorting (`createdAt`, `updatedAt`, `ticketNumber`), and pagination (`page`, `limit`).
  * Frontend My Tickets view: Table for desktop, responsive cards for mobile.
  * Search bar, filter dropdowns, sorting headers, pagination controls.
  * States: loading spinner, empty list (no tickets created yet), no-results (search returned 0 results), error banner.
  * Enforcement: Requester A cannot see tickets belonging to Requester B (`AC-03`).
  * Tests (`my-tickets.api.test.ts`, `MyTickets.test.tsx`).
* **Exclusions:** Global admin viewing all tickets, ticket modification controls on list.
* **Acceptance Criteria:**
  * Switching from Requester A to B immediately reloads and isolates the ticket list.
  * Search and filters return correct subsets with pagination metadata.
* **Dependencies:** Issue 4.
* **Merge Order:** 5th.

---

### Issue 6: Requester Ticket Detail & Soft-removal Attachments
* **Branch:** `feature/6-ticket-detail`
* **Requirement IDs:** Section 4.5, 6, 8.5, `AC-03`
* **Scope:**
  * Backend API: `GET /api/tickets/:id` (verifies ownership), `POST /api/tickets/:id/attachments`, `DELETE /api/tickets/:id/attachments/:attachmentId` (soft removal), `GET /api/attachments/:id/download`.
  * Frontend Ticket Detail view: Read-only ticket header, requester details, summary, description, and status badge.
  * Attachment section: list active and removed attachments.
  * Active attachments allow download/preview; soft-removed attachments display metadata (name, removal reason, timestamp) and block download.
  * Add attachment action (verifies max 5 active attachments limit).
  * Soft-removal confirmation modal requiring a removal reason.
  * Tests (`ticket-detail.api.test.ts`, `attachments.api.test.ts`, `RequesterTicketDetail.test.tsx`, `AttachmentSection.test.tsx`).
* **Exclusions:** Comments, internal notes, changing ticket status or ticket owner.
* **Acceptance Criteria:**
  * Attempting to view a ticket belonging to another requester returns 403/404 (`AC-03`).
  * Soft-removed attachment cannot be downloaded (returns 410 or 404).
* **Dependencies:** Issue 5.
* **Merge Order:** 6th.

---

### Issue 7: Zen Green Design System Polish & E2E Validation
* **Branch:** `feature/7-zen-green-and-e2e`
* **Requirement IDs:** Section 7, 8.7, 8.8, 9.2, 12
* **Scope:**
  * Audit and unify all CSS tokens into Zen Green specification palette (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`).
  * Verify responsive viewports: Desktop (≥992px), Tablet (768-991px), Mobile (<768px).
  * Implement Playwright E2E test suite in `e2e/lab-02/requester-ticket-flow.spec.ts`.
  * Capture automated screenshots in `artifacts/lab-02/screenshots/` (create-ticket, my-tickets, ticket-detail).
* **Exclusions:** Non-standard styling frameworks violating vanilla/clean CSS guidelines.
* **Acceptance Criteria:**
  * All E2E test scenarios pass consistently.
  * Mobile and desktop layouts exhibit zero horizontal scrollbars or truncated buttons.
* **Dependencies:** Issue 6.
* **Merge Order:** 7th.

---

### Issue 8: Release Integration, Review & Lab 2 Delivery
* **Branch:** `lab2-staging`
* **Requirement IDs:** Section 10.1, 13.1, 13.2, 14
* **Scope:**
  * Perform integration audit across all 4 screens and APIs.
  * Complete `docs/lab-02/reviewer.md` documenting peer review notes and PR history.
  * Complete `docs/lab-02/ai-use.md` with prompt log and reflection.
  * Open release PR from `lab2-staging` into `main`.
* **Exclusions:** Developing directly on `main`.
* **Acceptance Criteria:**
  * All tests pass on `lab2-staging` and final `main`.
  * All 9 answers for PDF submission can be generated from traceable artifacts.
* **Dependencies:** Issue 7.
* **Merge Order:** 8th (Final).
