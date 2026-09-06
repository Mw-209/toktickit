# Lab 2 Test Plan and Traceability

**Project:** TokTickIT — Requester Ticketing MVP with UI Foundation  
**Target Delivery:** Lab 2  
**Frameworks:** Vitest (Server & Client), Supertest, React Testing Library, Playwright (E2E)  

---

## 1. Test Strategy

Quality verification follows a comprehensive multi-tier strategy:
1. **Unit Tests:** Focus on discrete business rules (Ticket Number sequence formatting, boundary validation, file MIME checking).
2. **API Integration Tests (`server/tests/lab-02/`):** Exercise Express endpoints with Supertest against an active test database instance, asserting status codes, payload structures, pagination, and ownership barriers.
3. **UI Component Tests (`client/tests/lab-02/`):** Test rendering, keyboard navigation, user interactions, inline validation feedback, and empty/error states using React Testing Library.
4. **End-to-End Tests (`e2e/lab-02/`):** Full browser-driven flows using Playwright covering the full lifecycle (select requester -> submit ticket with file -> verify in My Tickets -> view detail -> soft-remove attachment -> switch requester).
5. **Responsive & Visual Audits:** Assert viewport behaviors across Desktop (1280px), Tablet (800px), and Mobile (375px), confirming absence of horizontal overflow.

---

## 2. Planned Tests Table

| Test ID | Level | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final Status |
|---|---|---|---|---|---|---|
| **API-01** | API | `AC-01`, `BR-01`, `BR-02` | Create valid ticket with active Requester | 201 Created; returns official `ticketNumber` formatted as `TKT-YYYY-XXXXXX` and status `NEW` | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| **API-02** | API | `BR-05`, `BR-06` | Submit ticket with invalid Summary (<5 chars) or empty Description | 400 Bad Request; returns field validation error details | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| **API-03** | API | `AC-06`, `BR-08`, `BR-09` | Upload attachment with invalid MIME type or size > 5 MB | 400 Bad Request; rejects file with clear error message | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| **API-04** | API | `AC-03`, `FR-07` | Fetch ticket list with `requesterId` query | 200 OK; returns only tickets belonging to the specified requester | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| **API-05** | API | `FR-08` | Search and filter tickets by category and search keyword | 200 OK; returns filtered subset with accurate pagination count | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| **API-06** | API | `AC-04`, `BR-04` | Attempt to access Ticket Detail of another requester's ticket | 403 Forbidden; blocks cross-requester detail leak | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |
| **API-07** | API | `AC-07`, `BR-10` | Add 6th attachment to a ticket already containing 5 active files | 400 Bad Request; blocks addition, reports max 5 limit | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| **API-08** | API | `AC-08`, `BR-11` | Soft-remove attachment with valid `removalReason` | 200 OK; sets `isRemoved = true`, retains reason and timestamp | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| **API-09** | API | `AC-08`, `BR-12` | Attempt download of soft-removed attachment | 410 Gone; download stream is completely blocked | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| **API-10** | API | `BR-03` | Retrieve Development Requesters list | 200 OK; returns only active requesters; inactive excluded | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| **UI-01** | UI | `AC-02`, `FR-02` | App renders without selected Requester in context | Automatically displays Requester Selection screen | `client/tests/lab-02/CreateTicket.test.tsx` | Pass |
| **UI-02** | UI | `AC-05`, `BR-05` | Form submission with missing summary | Displays inline validation message directly under summary input; API not called | `client/tests/lab-02/CreateTicket.test.tsx` | Pass |
| **UI-03** | UI | Section 8.3 | Form submission in-flight | Submit button displays busy spinner and disables to prevent duplicate clicks | `client/tests/lab-02/CreateTicket.test.tsx` | Pass |
| **UI-04** | UI | `AC-03`, `FR-03` | Switch Requester in header | My Tickets triggers reload and clears previous requester's ticket rows | `client/tests/lab-02/MyTickets.test.tsx` | Pass |
| **UI-05** | UI | `FR-08`, Section 8.4 | Filter with no matching records | Displays no-results placeholder with "Reset Filters" action | `client/tests/lab-02/MyTickets.test.tsx` | Pass |
| **UI-06** | UI | Section 8.5 | Render Ticket Detail view | Displays read-only system badges, description card, and attachment list | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | Pass |
| **UI-07** | UI | `AC-08`, Section 8.5 | Click remove attachment | Opens modal requiring reason; confirming updates UI state to muted metadata | `client/tests/lab-02/AttachmentSection.test.tsx` | Pass |
| **E2E-01**| E2E | `AC-01..AC-08` | Full end-to-end requester workflow | Complete responsive ticket submission, search, inspection, and soft-removal | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pass |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Description | Verifying Tests |
|---|---|---|
| **AC-01** | Valid ticket submission yields 201 and official Ticket Number | `API-01`, `E2E-01` |
| **AC-02** | Redirects to requester selector when context is empty | `UI-01`, `E2E-01` |
| **AC-03** | Requester A cannot view or list Requester B's tickets | `API-04`, `UI-04`, `E2E-01` |
| **AC-04** | Direct access to another requester's ticket is forbidden | `API-06`, `E2E-01` |
| **AC-05** | Client form prevents invalid submit with field-level errors | `UI-02`, `API-02` |
| **AC-06** | Files exceeding 5MB or illegal types are rejected | `API-03`, `E2E-01` |
| **AC-07** | Ticket attachment count cannot exceed 5 active items | `API-07` |
| **AC-08** | Soft removal records reason and prevents file download (410) | `API-08`, `API-09`, `UI-07`, `E2E-01` |
| **AC-09** | My Tickets search and filter works accurately | `API-05`, `UI-05`, `E2E-01` |
| **AC-10** | Responsive layouts on desktop, tablet, and mobile with no overflow | `E2E-01`, Visual Check |

---

## 4. Responsive and Visual Checklist

- [x] Primary Green (`#006B3C`) used for header and primary buttons.
- [x] Secondary Green (`#0B7A46`) used for active tabs, links, and hover states.
- [x] Pale Green (`#EAF6EF`) used for container accents and success notices.
- [x] Page background `#F5F7F6` applied quietly across all viewports.
- [x] Desktop (≥ 992px): Multi-column layouts centered within max 1200px container.
- [x] Tablet (768–991px): Two-column layout; summary and description have sufficient space.
- [x] Mobile (< 768px): Vertical stack; full touch-friendly buttons; no horizontal scrollbar.
- [x] Read-only fields visually shaded in soft gray-green (`#EAF1ED`).
- [x] Error messages appear in dark red directly below the invalid input.

---

## 5. Test Commands

```bash
# 1. Run all backend tests
cd server && npm test

# 2. Run all frontend component tests
cd client && npm test

# 3. Run Playwright E2E tests
npx playwright test e2e/lab-02/
```
