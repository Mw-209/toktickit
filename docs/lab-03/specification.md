# Lab 3 Sprint Engineering Specification

**Project:** TokTickIT — Users, Roles, IT Staff Ticketing, and Admin Screens  
**Target Delivery:** Sprint 3 (`lab3-staging`)  
**Methodology:** Spec-Driven Development (Spec DD) & Test-Driven Development (TDD)

---

## 1. Sprint Goal

Deliver real authentication and role-based authorization to replace the temporary Development Requester selector, introduce a professional IT Staff Ticket Queue and Detail workflow, and provide a minimalist Administrator User Management screen — all while preserving every Lab 2 Requester function intact and extending the Zen Green design language to the new screens.

---

## 2. Stakeholder Request Interpretation

The IT department requires replacing the temporary Requester selector with a real login system so that users authenticate with email and password. Users who have an initial password must change it before entering the application. Requesters continue using their ticket functions, but their identity now comes from the authenticated session. IT Staff need a Ticket Queue to find and prioritize work, open Ticket Detail to claim or reassign ownership, set IT Priority, update ticket status through a defined workflow, post Public Comments visible to everyone, and write Internal Notes visible only to staff. Administrators need a simple User Management screen to view users, create accounts with one role, edit basic information, activate or deactivate accounts, and set a new initial password. Every API and screen must be protected by server-side role and ownership checks.

---

## 3. Scope

### 3.1 Included Scope
1. **Authentication:** Email/password login, JWT httpOnly cookie session, logout, current-user retrieval.
2. **First-Login Password Change:** Mandatory change screen for users with `mustChangePassword = true`.
3. **Role-Based Authorization:** Server-side enforcement for Requester, IT Staff, and Administrator roles.
4. **Requester Regression:** All Lab 2 Requester screens continue to work; identity comes from authenticated session, not a Dev Selector.
5. **IT Staff Ticket Queue:** Searchable, filterable, sortable, paginated queue of all tickets.
6. **IT Staff Ticket Detail:** Claim/reassign ownership, set IT Priority, permitted status transitions, Public Comments, Internal Notes, Attachment continuity.
7. **Public Comments:** Append-only comments on a Ticket visible to all authenticated roles.
8. **Internal Notes:** Append-only notes on a Ticket visible only to IT Staff and Administrator.
9. **Requester "Problem Appears Resolved" Action:** Requester can flag a ticket as appearing resolved (does not formally change status to Resolved).
10. **Administrator User Management:** User list, search, optional role filter, create user, edit user, set initial password, safety rules.
11. **Data Migration:** Evolve Lab 2 `RequesterUser` records into the real `User` model without losing existing Ticket or Attachment data.
12. **Zen Green UI Extension:** New screens follow the same design tokens, components, and responsive rules from Lab 2.

### 3.2 Excluded Scope
1. Email invitations, password-reset email, multi-factor authentication, social login, SSO.
2. Self-registration and Requester-created accounts.
3. Actions Taken by IT Staff.
4. Formal SLA calculation, escalation rules, and notification services.
5. Dashboards and KPI analytics beyond simple queue counts.
6. Multiple roles assigned to one user.
7. User deletion, bulk operations, import/export, account-history screens.
8. Department, organization, profile-photo, and extended user-profile management.
9. Email delivery of initial passwords or reset links.
10. Account unlocking, administrator approval workflows, advanced identity management.
11. Advanced user-list features: mandatory pagination, multi-column sorting, multiple simultaneous filters.
12. Production-grade deployment or cloud infrastructure changes.

---

## 4. Functional Requirements

* **FR-01 (Login):** The system shall authenticate a user by email and password, establish a server-side JWT session via httpOnly cookie, and return the permitted user identity and role.
* **FR-02 (Mandatory Password Change):** A user with `mustChangePassword = true` shall be redirected to the Change Password screen after login; normal application screens shall remain unavailable until a valid new password is saved.
* **FR-03 (Logout):** The system shall provide a Logout action that clears the authenticated session and redirects to the Login screen.
* **FR-04 (Current User):** The system shall provide a `GET /api/auth/me` endpoint returning the authenticated user's id, name, email, and role.
* **FR-05 (Role-Based Navigation):** The client shall display only the navigation destinations permitted for the authenticated user's role.
* **FR-06 (Server-Side Authorization):** Every protected endpoint shall enforce role and ownership checks on the server; client-side hiding of controls is supplementary feedback only.
* **FR-07 (Requester Identity from Session):** All Requester Ticket and Attachment operations shall derive the Requester identity from the authenticated session, not from a client-supplied `requesterId`.
* **FR-08 (IT Staff Ticket Queue):** IT Staff and Administrator shall access a paginated queue of all tickets with search, filter, sort, and ownership visibility.
* **FR-09 (IT Staff Ticket Detail):** IT Staff and Administrator shall open a Ticket Detail screen that exposes claim/reassign, IT Priority, permitted status changes, Public Comments, Internal Notes, and Attachments.
* **FR-10 (Claim/Reassign Ownership):** IT Staff and Administrator shall claim an unassigned ticket or reassign ownership to another active IT Staff or Administrator user.
* **FR-11 (IT Priority):** IT Staff and Administrator shall set or update the IT Priority of a ticket independently from the Requested Priority submitted by the Requester.
* **FR-12 (Status Transition):** IT Staff and Administrator shall update a Ticket's status according to the permitted transition matrix.
* **FR-13 (Public Comments):** All authenticated users shall be able to post and view Public Comments on a Ticket they have access to.
* **FR-14 (Internal Notes):** IT Staff and Administrator shall create and view Internal Notes on a Ticket; Requesters shall be forbidden from accessing note content.
* **FR-15 (Requester Problem Appears Resolved):** An authenticated Requester shall be able to flag their own Ticket as "problem appears resolved" without formally setting the status to Resolved.
* **FR-16 (Administrator User List):** Administrators shall view a list of all users showing Name, Email, Role, Status, and an Edit action; search by name or email; optionally filter by role.
* **FR-17 (Administrator Create User):** Administrators shall create a new user account with name, email, one permitted role, activation state, and an initial password that must be changed at first login.
* **FR-18 (Administrator Edit User):** Administrators shall edit a user's name, email, role, and activation state, and set a new initial password.
* **FR-19 (Administrator Safety Rules):** The system shall prevent an Administrator from deactivating their own account and prevent the last active Administrator account from being deactivated or role-changed.

---

## 5. Business Rules

* **BR-01 (Active Users Only):** Only an active user (`isActive = true`) with valid credentials may authenticate. Inactive accounts shall receive a safe error response without exposing account existence.
* **BR-02 (Mandatory Password Change):** A user with `mustChangePassword = true` cannot access any application screen other than the Change Password screen until a valid new password is saved.
* **BR-03 (Authenticated Identity):** The authenticated user identity from the session, not a `requesterId` supplied by the client, determines ownership of all Requester operations.
* **BR-04 (Comment and Note Visibility):** Public Comments are visible to Requester, IT Staff, and Administrator. Internal Notes are visible only to IT Staff and Administrator.
* **BR-05 (Requester Cannot Formally Resolve):** A Requester may flag a ticket as "problem appears resolved" but cannot set the status to Resolved or Closed. IT Staff remain responsible for formal resolution.
* **BR-06 (Password Hashing):** User passwords must be stored as bcrypt hashes. Plaintext passwords must never be persisted or logged.
* **BR-07 (JWT httpOnly Cookie):** The JWT access token is issued as an httpOnly cookie to prevent client-side JavaScript access. The token must have a defined expiry.
* **BR-08 (Password Rules):** A new password must be at least 8 characters long. Students must confirm any additional rules in the specification agent review.
* **BR-09 (Unique Email):** Each user account must have a unique email address. Duplicate email creation or update attempts shall be rejected with a clear conflict error.
* **BR-10 (One Role Per User):** Each user is assigned exactly one role in Lab 3: REQUESTER, IT_STAFF, or ADMINISTRATOR.
* **BR-11 (Ticket Ownership — IT Staff):** Each Ticket may have zero or one primary Ticket Owner who is an active IT Staff or Administrator user. The owner can be reassigned.
* **BR-12 (IT Priority):** IT Priority initially copies Requested Priority when a ticket is first claimed or assigned. IT Priority may subsequently be changed only by IT Staff or Administrator.
* **BR-13 (Status Transition Matrix):** Permitted status transitions are:
  - `NEW` → `OPEN`, `CANCELLED`
  - `OPEN` → `IN_PROGRESS`, `CANCELLED`
  - `IN_PROGRESS` → `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `WAITING_FOR_REQUESTER` → `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
  - `RESOLVED` → `CLOSED`, `REOPENED`
  - `REOPENED` → `IN_PROGRESS`, `CANCELLED`
  - `CLOSED` → (terminal, no transitions)
  - `CANCELLED` → (terminal, no transitions)
  - IT Staff and Administrator may perform all transitions. Requesters may only trigger `REOPENED` via "Problem Appears Resolved" action (which sets a flag, not a direct status change).
* **BR-14 (Append-Only Comments and Notes):** Public Comments and Internal Notes are append-only in Lab 3. Editing and deletion are excluded.
* **BR-15 (Comment/Note Validation):** Empty or whitespace-only content must be rejected. Maximum length is 2,000 characters for both Public Comments and Internal Notes.
* **BR-16 (One Role Assignment):** When creating or editing a user, exactly one role must be assigned from: REQUESTER, IT_STAFF, ADMINISTRATOR.
* **BR-17 (Admin Cannot Deactivate Self):** An Administrator may not deactivate their own account.
* **BR-18 (Last Active Admin Protection):** The system must prevent any operation that would result in zero active Administrator accounts.
* **BR-19 (Initial Password):** When an Administrator sets a new initial password for a user, the system sets `mustChangePassword = true` for that user. The initial password follows the same password-length rules.
* **BR-20 (Requester Ownership Isolation):** A Requester may only view, manage, and post comments on their own Tickets. Accessing another Requester's ticket returns HTTP 403/404.
* **BR-21 (Internal Note Isolation):** A Requester requesting an Internal Note endpoint shall receive a 403 Forbidden response without any note content being disclosed.
* **BR-22 (Logout Invalidation):** Logout clears the httpOnly cookie on the client. Token-based invalidation behavior must be documented in the specification.

---

## 6. UI Specification Summary

See `docs/lab-03/ui-spec.md` for full screen layouts, component states, badge definitions, and responsive rules.

### 6.1 New Screens
* **Login Screen:** Email + password fields, validation, busy state, safe failure feedback, inactive-account message (generic), link to nothing (no self-registration).
* **Change Password Screen:** New password + confirm fields, password-length validation, success redirect.
* **IT Staff Ticket Queue:** Desktop responsive table + mobile card; search bar; filter dropdowns (Status, Priority, Category, Owner); sort headers; pagination with range text; status/priority/owner badges.
* **IT Staff Ticket Detail:** Read-only header with Ticket info; editable panel for IT Priority + Status + Owner; Public Comments section; Internal Notes section (visually distinct, IT Staff/Admin only); Attachments section (from Lab 2).
* **Administrator User Management:** User list table (Name, Email, Role badge, Status badge, Edit); search input; optional role-filter dropdown; Create User button → modal; Edit User modal.

### 6.2 Modified Screens
* **Global Header:** Replace Dev Requester dropdown with authenticated user name + role badge + Logout button.
* **Requester Ticket Detail:** Add Public Comments section; add "Problem Appears Resolved" button (Requester only).
* **Requester screens generally:** Remove Dev Requester selector; identity comes from session.

### 6.3 Design Tokens (from Lab 2 — unchanged)
* Primary Green: `#006B3C`
* Secondary Green: `#0B7A46`
* Pale Green: `#EAF6EF`
* Page Background: `#F5F7F6`
* Cards/Surfaces: `#FFFFFF` with `#E2E8F0` border

---

## 7. Data Changes

### 7.1 New Models

```
User {
  id                Int           PK autoincrement
  name              String
  email             String        UNIQUE
  passwordHash      String
  role              Role          enum (REQUESTER, IT_STAFF, ADMINISTRATOR)
  isActive          Boolean       default true
  mustChangePassword Boolean      default false
  createdAt         DateTime      default now()
  updatedAt         DateTime      updatedAt
  tickets           Ticket[]      (as Requester owner)
  assignedTickets   Ticket[]      (as IT Staff assignee)
  publicComments    PublicComment[]
  internalNotes     InternalNote[]
}

PublicComment {
  id        Int      PK autoincrement
  ticketId  Int      FK -> Ticket
  authorId  Int      FK -> User
  content   String
  createdAt DateTime default now()
}

InternalNote {
  id        Int      PK autoincrement
  ticketId  Int      FK -> Ticket
  authorId  Int      FK -> User
  content   String
  createdAt DateTime default now()
}
```

### 7.2 Modified Models

```
Ticket {
  ...existing Lab 2 fields...
  requesterId    Int    FK -> User (migrated from RequesterUser)
  assignedToId   Int?   FK -> User (IT Staff/Admin owner, optional)
  itPriority     String? (LOW, MEDIUM, HIGH, URGENT)
  currentStatus  String  (extended: NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER,
                           RESOLVED, CLOSED, REOPENED, CANCELLED)
  resolveIndicatedAt DateTime? (set when Requester flags "problem appears resolved")
}
```

### 7.3 Migration Strategy
1. Create `User` table with REQUESTER role.
2. For each `RequesterUser` record: create a corresponding `User` record with the same `name` and `email`, role = `REQUESTER`, a securely hashed initial password, `mustChangePassword = true`.
3. Update `Ticket.requesterId` FK to reference `User.id` (matched by email).
4. Keep `RequesterUser` table intact as a historical reference (or remove after migration is confirmed — document the decision).
5. All existing Ticket and Attachment data remains valid.

### 7.4 Seed Data (Lab 3)
* ≥4 active REQUESTER accounts (matching existing Lab 2 names/emails where possible)
* ≥1 inactive REQUESTER account
* ≥3 active IT_STAFF accounts
* ≥1 inactive IT_STAFF account
* ≥1 active ADMINISTRATOR account
* Realistic tickets distributed across statuses, priorities, and owners
* Example Public Comments and Internal Notes
* Seeded credentials documented in `README.md` (for local development only)

---

## 8. API Contract

See `docs/lab-03/api-spec.md` for full endpoint definitions.

### 8.1 New Endpoints
| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Login with email+password, set JWT cookie |
| POST | `/api/auth/logout` | Authenticated | Clear JWT cookie |
| GET | `/api/auth/me` | Authenticated | Return current user identity |
| POST | `/api/auth/change-password` | Authenticated | Change password, clear mustChangePassword |
| GET | `/api/staff/tickets` | IT_STAFF, ADMIN | IT Staff queue with search/filter/sort/page |
| GET | `/api/staff/tickets/:id` | IT_STAFF, ADMIN | Full ticket detail for staff |
| PATCH | `/api/staff/tickets/:id` | IT_STAFF, ADMIN | Claim/reassign, IT Priority, status |
| POST | `/api/tickets/:id/comments` | All Authenticated | Post public comment |
| GET | `/api/tickets/:id/comments` | All Authenticated | List public comments |
| POST | `/api/tickets/:id/notes` | IT_STAFF, ADMIN | Post internal note |
| GET | `/api/tickets/:id/notes` | IT_STAFF, ADMIN | List internal notes |
| POST | `/api/tickets/:id/resolve-indication` | REQUESTER (owner) | Flag "problem appears resolved" |
| GET | `/api/admin/users` | ADMINISTRATOR | List users with search/role filter |
| POST | `/api/admin/users` | ADMINISTRATOR | Create user |
| PATCH | `/api/admin/users/:id` | ADMINISTRATOR | Edit user or set initial password |

### 8.2 Modified Endpoints (Lab 2 Requester APIs)
* All Lab 2 endpoints now require `requireAuth` middleware.
* `requesterId` is derived from `req.user.id` (session), not from client body/query.
* `GET /api/requesters` is **removed** (Development Requester selector is gone).

### 8.3 Authentication Mechanism
JWT signed with `JWT_SECRET` (env var), stored as `httpOnly; SameSite=Lax` cookie. Token expiry: 24 hours. Logout clears the cookie. Middleware verifies token on every protected route.

---

## 9. Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-01 | Given an active user with valid credentials, when POST /api/auth/login is called, then the backend sets an httpOnly JWT cookie and returns `{ id, name, email, role }`. |
| AC-02 | Given a user with mustChangePassword = true, when login succeeds, then the client redirects to Change Password and all other screens remain inaccessible until a valid new password is saved. |
| AC-03 | Given an authenticated Requester, when the client supplies a different requesterId in the body, then the backend ignores it and applies the session identity. |
| AC-04 | Given a Requester account, when GET /api/tickets/:id/notes is requested, then the response is 403 Forbidden with no note content. |
| AC-05 | Given an authenticated IT Staff user, when PATCH /api/staff/tickets/:id is called with a valid status transition, then the ticket status is updated and the response is 200 OK. |
| AC-06 | Given an invalid status transition (e.g., CLOSED → IN_PROGRESS), when PATCH /api/staff/tickets/:id is called, then the response is 422 Unprocessable Entity with a clear error message. |
| AC-07 | Given an Administrator, when POST /api/admin/users is called with a duplicate email, then the response is 409 Conflict. |
| AC-08 | Given an Administrator, when PATCH /api/admin/users/:id is called to deactivate their own account, then the response is 403 Forbidden. |
| AC-09 | Given the last active Administrator account, when an operation would remove or deactivate it, then the response is 403 Forbidden. |
| AC-10 | Given a logged-out user, when any protected endpoint is requested, then the response is 401 Unauthorized. |
| AC-11 | Given a Requester account, when GET /api/staff/tickets is requested, then the response is 403 Forbidden. |
| AC-12 | Given an active IT Staff user, when POST /api/tickets/:id/comments is called with valid content, then the comment is saved with author and timestamp and returned in subsequent GET. |
| AC-13 | Given an inactive user with otherwise valid credentials, when POST /api/auth/login is called, then the response is 401 Unauthorized without exposing account status. |
| AC-14 | Given an authenticated Requester, when they click "Problem Appears Resolved" on their own ticket, then `resolveIndicatedAt` is set and the indicator is shown in the Ticket Detail. |

---

## 10. Definition of Done

- [ ] All Lab 3 documentation files exist in `docs/lab-03/` before implementation PRs begin.
- [ ] All planned tests in `docs/lab-03/tests.md` have corresponding test files.
- [ ] All server tests in `server/tests/lab-03/` pass on the final `main` branch.
- [ ] All client tests in `client/tests/lab-03/` pass on the final `main` branch.
- [ ] All E2E tests in `e2e/lab-03/` pass on the final `main` branch.
- [ ] Screenshots in `artifacts/lab-03/screenshots/` cover all major screens.
- [ ] Login, Change Password, Logout work correctly for all roles.
- [ ] Inactive account login returns a safe error without exposing account status.
- [ ] All Lab 2 Requester functions work without the Development Requester selector.
- [ ] IT Staff Ticket Queue with search, filter, sort, and pagination works correctly.
- [ ] IT Staff Ticket Detail with claim, IT Priority, status transition, comments, and notes works correctly.
- [ ] Administrator User Management with create, view, edit, activate/deactivate operations and safety rules works correctly. (Note: user deletion is explicitly excluded from Lab 3 scope — see Section 3.2)
- [ ] Direct API authorization tests demonstrate server-side enforcement (not just UI hiding).
- [ ] All screens are responsive across desktop, tablet, and mobile.
- [ ] All screens follow the Zen Green design language.
- [ ] `reviewer.md` contains peer-review evidence with PR links, comments, and approvals.
- [ ] `ai-use.md` names the LLM and documents 6–10 key prompts with reflection.
- [ ] `README.md` documents seeded credentials for local development.
- [ ] All feature branches are merged into `lab3-staging` via Pull Requests.
- [ ] Final release PR from `lab3-staging` to `main` is merged by the student (not the AI agent).

---

## 11. Assumptions and Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | JWT in httpOnly cookie | Prevents XSS token theft; stateless server; suitable for this course stack. |
| 2 | bcrypt with cost factor 12 | Secure password hashing; industry standard for Node.js. |
| 3 | Keep RequesterUser table during migration | Preserve Lab 2 FK relationships during transition; deprecate after migration confirmed. |
| 4 | IT Staff can Cancel tickets | Lab 3 explicitly includes Cancelled status; IT Staff manage the full workflow. |
| 5 | resolveIndicatedAt field (not status change) | Lab sheet BR-05: Requesters cannot formally set Resolved; flag field keeps workflow control with IT Staff. |
| 6 | Token expiry: 24 hours | Reasonable for a lab environment; no refresh token needed. |
| 7 | Password minimum: 8 characters | Common baseline; lab sheet defers specific rules to student specification. |
