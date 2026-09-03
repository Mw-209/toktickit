# Lab 2 Sprint Engineering Specification

**Project:** TokTickIT — Requester Ticketing MVP with UI Foundation  
**Target Delivery:** Sprint 2 (`lab2-staging`)  
**Methodology:** Spec-Driven Development (Spec DD)  

---

## 1. Sprint Goal

Deliver a responsive, professional Requester-facing IT ticketing MVP with a consistent Zen Green design foundation. Enable end users (simulated through a Development Requester identity) to select their profile, submit support tickets with permitted attachments, track their submitted tickets via a searchable, sortable, and paginated "My Tickets" dashboard, inspect ticket details, and manage attachments with soft-removal rules while enforcing strict multi-user ownership isolation.

---

## 2. Stakeholder Request Interpretation

The IT department requires a self-service ticketing portal for campus end users (Requesters) to report issues across categories (Account & Access, Hardware, Software, Network) and related systems. Requesters must be able to describe their problems, indicate urgency, attach evidence files, and receive an official, system-generated Ticket Number. End users must have access to a personalized dashboard ("My Tickets") where they can view only their own tickets, filter and search through them, and open a read-only detail view to inspect status and manage attachments. Because real authentication is scheduled for Lab 3, a temporary Development Requester selection mechanism must simulate user identity during testing. The user interface must adhere strictly to a clean, cohesive "Zen Green" design language with responsive support across desktop, tablet, and mobile devices.

---

## 3. Scope

### 3.1 Included Scope
1. **Development Requester Simulation:** Selection screen and top-bar context to switch between active seeded Requesters to simulate multi-user testing without real credentials.
2. **Create Ticket Workflow:** Capturing category, related system, requested priority, summary, description, and initial attachments (up to 5 files, ≤5 MB each, JPG/PNG/WEBP/PDF). Backend generation of official unique Ticket Number and initial status `New`.
3. **My Tickets Dashboard:** Filterable (Category, Priority, Status), searchable (summary/ticket number), sortable, and paginated list showing only tickets owned by the active Requester.
4. **Requester Ticket Detail Screen:** Read-only presentation of ticket information, owner metadata, and attachment management.
5. **Attachment Lifecycle:** Uploading permitted attachments, downloading active attachments, and performing soft-removal with a mandatory removal reason (blocking download while preserving metadata).
6. **Zen Green UI Foundation:** Centralized design tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#F5F7F6`), responsive multi-column/two-column/stacked layouts, accessible form states, inline error feedback, and button hierarchies.
7. **Automated Verification:** Comprehensive test suite spanning unit, API integration, UI component, and Playwright E2E tests.

### 3.2 Excluded Scope (Section 4.2)
1. **Authentication & Security:** Passwords, password hashing, sessions, JWTs, cookies, and role-based access control (RBAC).
2. **IT Staff Workflow:** IT Staff dashboard, claiming tickets, reassigning tickets, setting IT Priority, or internal triage queues.
3. **Collaboration Features:** Public comments, internal staff notes, and actions taken tracking.
4. **Advanced Lifecycle States:** Status transitions beyond `New` (resolving, closing, reopening, cancelling).
5. **Administrative Management:** Admin CRUD for users, roles, categories, or systems.

---

## 4. Functional Requirements

* **FR-01 (Requester Identity Selection):** The system shall allow the user to select an active Development Requester from a dropdown, storing the selection in application context and displaying the selected user's name in the global header.
* **FR-02 (Requester Context Guard):** If no Development Requester is selected, navigation to ticketing screens shall automatically redirect the user to the Requester Selection screen.
* **FR-03 (Requester Switching):** The user shall be able to change the active Requester at any time from the global header, causing all ticket lists and detail screens to immediately reload under the new identity.
* **FR-04 (Reference Data Loading):** The Create Ticket screen shall dynamically fetch active Categories and active Related Systems from the backend database.
* **FR-05 (Ticket Creation):** The system shall validate and persist a new support ticket associated with the active Requester, returning an official unique Ticket Number with initial status `New`.
* **FR-06 (Attachment Upload on Creation):** The Create Ticket form shall permit attaching up to 5 valid files (≤5 MB each, JPG/PNG/WEBP/PDF), saving their metadata and storing physical files on the server.
* **FR-07 (Owned Ticket Listing):** The My Tickets screen shall display a paginated list of tickets owned exclusively by the currently selected Requester.
* **FR-08 (Search, Filter, and Sort):** The My Tickets view shall support real-time or submitted search queries (by Ticket Number or Summary), filtering by Category, Priority, and Status, and sorting by creation date, last updated date, or ticket number.
* **FR-09 (Ticket Detail Access Control):** The system shall allow viewing a ticket's detail only if the ticket belongs to the currently active Requester. Any attempt to access another Requester's ticket shall be rejected with HTTP 403/404.
* **FR-10 (Attachment Management & Soft Removal):** The Ticket Detail screen shall allow uploading additional permitted attachments (up to the active limit of 5) and soft-removing an existing active attachment by submitting a required removal reason.

---

## 5. Business Rules (BR)

* **BR-01 (Backend Ticket Number Generation):** The official Ticket Number must be generated solely by the backend upon successful persistence. It must follow the format `TKT-YYYY-XXXXXX` (e.g. `TKT-2026-000001`), be globally unique, and be read-only to all clients.
* **BR-02 (Initial Ticket Status):** Every newly created ticket begins with Current Status `New`. Clients cannot select or alter the initial status.
* **BR-03 (Development Requester Limitation):** The Development Requester selector is strictly a testing simulator and not an authentication system. It must display only active Requesters (`isActive = true`). Inactive Requesters must be excluded from selection.
* **BR-04 (Strict Requester Ownership):** A Requester owns only the tickets where `requesterId` matches their identifier. Requesters are strictly forbidden from viewing, listing, modifying, or downloading tickets/attachments owned by other Requesters.
* **BR-05 (Summary Validation):** The Ticket Summary is required, must be trimmed of leading/trailing whitespace, and must have a length between 5 and 100 characters inclusive.
* **BR-06 (Description Validation):** The Ticket Description is required, must be trimmed of leading/trailing whitespace, and must have a length between 10 and 2,000 characters inclusive.
* **BR-07 (Requested Priority Values):** The Requested Priority must be one of `LOW`, `MEDIUM`, `HIGH`, or `URGENT`. The default selection is `MEDIUM`.
* **BR-08 (Permitted Attachment Types):** Attachments must strictly conform to allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, and `application/pdf`. All other types must be rejected.
* **BR-09 (Attachment Size Boundary):** The file size of any single attachment must not exceed 5 MB (5,242,880 bytes). Files exceeding this limit must be rejected.
* **BR-10 (Maximum Active Attachments):** A single ticket may have a maximum of 5 active (non-removed) attachments at any given time.
* **BR-11 (Attachment Soft-Removal Integrity):** Removing an attachment must be executed as a soft removal (`isRemoved = true`, `removedAt = now()`, and a non-empty `removalReason`). Physical files must not be deleted immediately.
* **BR-12 (Removed File Access Restriction):** Soft-removed attachments remain visible in the UI metadata list (displaying filename, removal timestamp, and reason), but their download and preview endpoints must be permanently disabled (returning HTTP 410 Gone).

---

## 6. UI Specification Summary

* **Design Language:** Zen Green Theme.
  * Primary Green: `#006B3C` (Header, primary buttons, active brand emphasis).
  * Secondary Green: `#0B7A46` (Active tabs, hover states, accents).
  * Pale Green: `#EAF6EF` (Selected cards, success callouts, subtle highlights).
  * Page Background: `#F5F7F6`.
  * Cards / Surfaces: Pure white `#FFFFFF` with `#E2E8F0` border and subtle box-shadow (`0 1px 3px rgba(0,0,0,0.06)`).
  * Text: Dark charcoal `#1A202C` and muted charcoal `#4A5568`.
* **Form Controls & States:**
  * Consistent input height (40px) with `#CBD5E1` neutral border and focus ring in secondary green.
  * Description input has min-height 120px with vertical resize only.
  * Required fields marked with red asterisk `*`.
  * Validation error messages appear immediately below the invalid control in dark red (`#B91C1C`).
  * Submit button displays loading spinner/busy state and is disabled during pending requests to prevent duplicate submission.
* **Responsive Layout Breakpoints:**
  * **Desktop (≥ 992px):** Multi-column layout with centered content container (max-width 1200px).
  * **Tablet (768px – 991px):** Two-column layout; summary and description receive ample width.
  * **Mobile (< 768px):** Single-column stacked vertically, full-width touch-friendly buttons (min height 44px), zero horizontal scrolling.
* **Screen Modes:**
  1. *Development Requester Selector:* Centered card with warning badge clarifying test context, dropdown, and continue button.
  2. *Create Ticket:* System fields read-only at top, dropdowns grouped, description area, attachment drop zone, primary submit button.
  3. *My Tickets:* Search bar and filter ribbon at top, responsive desktop table / mobile cards, pagination controls, and distinct empty ("No tickets submitted yet") vs no-results ("No matching tickets found") states.
  4. *Ticket Detail:* Read-only header card with status badge, problem description card, and attachment list with download links and soft-remove trigger modal.

---

## 7. Data Changes (Prisma Schema Increment)

### 7.1 New & Extended Models
* **`RequesterUser`:**
  * `id`: Int (Autoincrement PK)
  * `name`: String
  * `email`: String (Unique)
  * `isActive`: Boolean (Default: true)
  * `createdAt`: DateTime (Default: now)
  * Relation: `tickets Ticket[]`
* **`Category` (Extended):**
  * `id`: Int (Autoincrement PK)
  * `name`: String (Unique)
  * `createdAt`: DateTime (Default: now)
  * Relation: `tickets Ticket[]`
* **`RelatedSystem`:**
  * `id`: Int (Autoincrement PK)
  * `name`: String (Unique)
  * `isActive`: Boolean (Default: true)
  * `createdAt`: DateTime (Default: now)
  * Relation: `tickets Ticket[]`
* **`Ticket`:**
  * `id`: Int (Autoincrement PK)
  * `ticketNumber`: String (Unique, Indexed)
  * `summary`: String
  * `description`: String
  * `requestedPriority`: Enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
  * `itPriority`: Enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)? (Optional)
  * `currentStatus`: Enum (`NEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) (Default: `NEW`)
  * `requesterId`: Int (FK -> `RequesterUser.id`)
  * `categoryId`: Int (FK -> `Category.id`)
  * `relatedSystemId`: Int (FK -> `RelatedSystem.id`)
  * `createdAt`: DateTime (Default: now)
  * `updatedAt`: DateTime (Updated on change)
  * Relations: `requester`, `category`, `relatedSystem`, `attachments Attachment[]`
* **`Attachment`:**
  * `id`: Int (Autoincrement PK)
  * `ticketId`: Int (FK -> `Ticket.id`)
  * `originalName`: String
  * `storedName`: String
  * `mimeType`: String
  * `sizeBytes`: Int
  * `isRemoved`: Boolean (Default: false)
  * `removedAt`: DateTime?
  * `removalReason`: String?
  * `createdAt`: DateTime (Default: now)
  * Relation: `ticket Ticket`

### 7.2 Justification of Database Design Decisions
1. **Separation of RequesterUser from Auth:** Keeping `RequesterUser` as a lightweight entity allows seamless migration in Lab 3 to attach credentials, OAuth IDs, or session relations without disrupting existing ticket foreign keys.
2. **Soft-removal Boolean & Reason Columns:** Preserving file records with `isRemoved`, `removedAt`, and `removalReason` satisfies the auditability requirement that Requesters can see who removed an item and why, while immediately breaking download access.
3. **Database Indexing:** Composite index on `Ticket(requesterId, createdAt DESC)` guarantees rapid queries for the My Tickets screen. Unique index on `ticketNumber` ensures absolute integrity for system-generated identifiers.

---

## 8. API Contract Summary

| Method | Path | Description | Query / Body | Success | Error Codes |
|---|---|---|---|---|---|
| `GET` | `/api/requesters` | Fetch active Development Requesters | None | 200 OK (Array) | 500 |
| `GET` | `/api/categories` | Fetch active Categories | None | 200 OK (Array) | 500 |
| `GET` | `/api/related-systems` | Fetch active Related Systems | None | 200 OK (Array) | 500 |
| `POST` | `/api/tickets` | Create a new ticket with optional attachments | Multipart form: `requesterId`, `categoryId`, `relatedSystemId`, `requestedPriority`, `summary`, `description`, `files` | 201 Created | 400, 500 |
| `GET` | `/api/tickets` | List tickets owned by requester | Query: `requesterId`, `search`, `category`, `priority`, `status`, `sort`, `page`, `limit` | 200 OK (Items + Meta) | 400, 500 |
| `GET` | `/api/tickets/:id` | Get ticket detail with attachments | Query: `requesterId` (for ownership check) | 200 OK (Ticket + Attachments) | 400, 403, 404, 500 |
| `POST` | `/api/tickets/:id/attachments` | Upload attachment to existing ticket | Query: `requesterId`, Multipart file | 201 Created | 400, 403, 404, 500 |
| `DELETE` | `/api/tickets/:id/attachments/:attachmentId` | Soft-remove an attachment | Query: `requesterId`, Body: `{ removalReason }` | 200 OK | 400, 403, 404, 500 |
| `GET` | `/api/attachments/:id/download` | Download active attachment | Query: `requesterId` | 200 File Stream | 403, 404, 410 |

---

## 9. Acceptance Criteria (AC)

* **AC-01 (Ticket Creation Success):**
  * *Given* a selected active Development Requester and valid ticket details (Summary 5-100 chars, Description 10-2000 chars, valid Category and Related System),
  * *When* the user submits the Create Ticket form,
  * *Then* the backend persists the ticket with status `New`, generates a unique Ticket Number formatted as `TKT-YYYY-XXXXXX`, and the UI displays a success confirmation showing this number.
* **AC-02 (Requester Context Guard):**
  * *Given* no Development Requester is selected in application state,
  * *When* the user attempts to navigate to Create Ticket or My Tickets,
  * *Then* the system automatically navigates to the Development Requester Selection screen.
* **AC-03 (Ownership Isolation on Listing):**
  * *Given* Requester A has created 2 tickets and Requester B has created 1 ticket,
  * *When* Requester A views the My Tickets screen,
  * *Then* only Requester A's 2 tickets are shown, and switching context to Requester B immediately replaces the list with Requester B's 1 ticket.
* **AC-04 (Ownership Isolation on Direct Detail Access):**
  * *Given* a ticket belonging to Requester A,
  * *When* Requester B attempts to view this ticket via direct URL or API call,
  * *Then* the system denies access with HTTP 403 Forbidden or 404 Not Found, revealing no ticket data.
* **AC-05 (Client & Server Validation):**
  * *Given* a user submits the Create Ticket form with a summary under 5 characters or missing category,
  * *When* submission is attempted,
  * *Then* the client halts submission, highlights the invalid fields with inline messages below the inputs, and the API is not invoked.
* **AC-06 (Attachment File Constraints):**
  * *Given* a user attempts to upload a `.exe` file or a file larger than 5 MB,
  * *When* the file is selected or submitted,
  * *Then* the system rejects the file with an explicit error message stating permitted file types and size limits.
* **AC-07 (Maximum Active Attachments):**
  * *Given* a ticket already containing 5 active attachments,
  * *When* the user attempts to attach a 6th file,
  * *Then* the addition is blocked with a message indicating the 5-attachment maximum.
* **AC-08 (Attachment Soft Removal):**
  * *Given* an active attachment on a ticket owned by the current Requester,
  * *When* the Requester confirms removal and supplies a valid removal reason,
  * *Then* the attachment's `isRemoved` flag is set to true, the UI displays the removal metadata, and subsequent download requests return HTTP 410 Gone.
* **AC-09 (Search and Filtering in My Tickets):**
  * *Given* a Requester with multiple tickets,
  * *When* the Requester filters by Category "Hardware" and searches for "Laptop",
  * *Then* the list displays only matching tickets belonging to that Requester.
* **AC-10 (Responsive Layout Integrity):**
  * *Given* viewports at Desktop (1280px), Tablet (800px), and Mobile (375px),
  * *When* navigating all screens,
  * *Then* no horizontal scrollbars occur, form controls stack properly on mobile, and buttons remain touch-accessible.

---

## 10. Definition of Done (DoD)

### Part 1: Product Completion
- [x] All 5 core functional increments implemented (Requester Context, Create Ticket, My Tickets, Ticket Detail, Attachments).
- [x] All 12 Business Rules (`BR-01` to `BR-12`) enforced in frontend and backend.
- [x] All 10 Acceptance Criteria (`AC-01` to `AC-10`) satisfied and proven by automated tests.
- [x] Database migrations execute cleanly; idempotent seed script populates 4 categories, 7 systems, 4 active requesters, and 1 inactive requester.
- [x] Zen Green theme applied across all screens with verified responsive layout on desktop, tablet, and mobile.
- [x] Automated test suites pass with zero failures and zero skipped/disabled tests:
  - Unit / API tests: `server/tests/lab-02/`
  - UI component tests: `client/tests/lab-02/`
  - E2E flow test: `e2e/lab-02/`
- [x] Responsive screenshots captured for Desktop, Tablet, and Mobile in `artifacts/lab-02/screenshots/`.

### Part 2: Course Delivery Requirements
- [x] All work committed to feature branches and merged into `lab2-staging` via Pull Requests.
- [x] `reviewer.md` completed with peer review identities, PR links, and approval notes.
- [x] `ai-use.md` completed with prompt log, model citations, and reflective summary.
- [x] Release PR opened from `lab2-staging` to `main`.
- [x] Clean commit history and documentation ready for 9-part PDF submission.

---

## 11. Assumptions and Decisions

1. **Ticket Number Sequence:** Implemented using year prefix plus zero-padded database sequence (`TKT-YYYY-000001`) to ensure uniqueness and readability.
2. **Attachment Storage Location:** Stored in `server/uploads/attachments/` on local disk with UUID naming to prevent filename collisions, referenced by database record.
3. **Soft-removal Reason Requirement:** Minimum 3 characters required in removal reason modal to prevent accidental or blank removals.
4. **Development Context Persistence:** Stored in browser `sessionStorage` so refreshing the browser retains the selected Requester during a test session without needing cookie authentication.
