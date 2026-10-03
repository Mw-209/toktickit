# Lab 3 Test Plan

**Project:** TokTickIT — Users, Roles, IT Staff Ticketing, and Admin Screens  
**Methodology:** Test-Driven Development (TDD) — this plan is created before implementation

---

## 1. Test Coverage Overview

| Type | Count (Planned) | Files |
|------|----------------|-------|
| API / Integration | 30+ | `server/tests/lab-03/` (6 files) |
| UI Component | 20+ | `client/tests/lab-03/` (5 files) |
| E2E (Playwright) | 15+ | `e2e/lab-03/` (3 files) |

---

## 2. Test Plan Table

### 2.1 Authentication API Tests (`server/tests/lab-03/auth.api.test.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| API-AUTH-01 | API | AC-01 | Valid login with correct email+password | 200 OK, JWT cookie set, user object returned | Planned |
| API-AUTH-02 | API | AC-13 | Login with wrong password | 401 Unauthorized, generic message, no account exposure | Planned |
| API-AUTH-03 | API | AC-13 | Login with non-existent email | 401 Unauthorized, same generic message | Planned |
| API-AUTH-04 | API | AC-13 | Login with inactive account | 401 Unauthorized, generic message (no status exposure) | Planned |
| API-AUTH-05 | API | AC-02 | Login as mustChangePassword=true user | 200 OK, mustChangePassword flag in response | Planned |
| API-AUTH-06 | API | — | POST /api/auth/logout clears cookie | 200 OK, Set-Cookie clears token | Planned |
| API-AUTH-07 | API | AC-10 | GET /api/auth/me without cookie | 401 Unauthorized | Planned |
| API-AUTH-08 | API | — | GET /api/auth/me with valid cookie | 200 OK, returns id/name/email/role | Planned |
| API-AUTH-09 | API | AC-02 | POST /change-password with valid new password | 200 OK, mustChangePassword cleared | Planned |
| API-AUTH-10 | API | — | POST /change-password with too-short password | 400 Bad Request, validation error | Planned |
| API-AUTH-11 | API | — | POST /change-password passwords don't match | 400 Bad Request | Planned |
| API-AUTH-12 | API | — | POST /api/auth/login missing email field | 400 Bad Request | Planned |

---

### 2.2 Authorization API Tests (`server/tests/lab-03/authorization.api.test.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| API-AUTHZ-01 | API | AC-10 | Unauthenticated GET /api/tickets | 401 Unauthorized | Planned |
| API-AUTHZ-02 | API | AC-11 | Requester GET /api/staff/tickets | 403 Forbidden | Planned |
| API-AUTHZ-03 | API | AC-04 | Requester GET /api/tickets/:id/notes | 403 Forbidden, no note content | Planned |
| API-AUTHZ-04 | API | — | IT Staff POST /api/tickets (create ticket) | 403 Forbidden | Planned |
| API-AUTHZ-05 | API | — | Requester PATCH /api/staff/tickets/:id | 403 Forbidden | Planned |
| API-AUTHZ-06 | API | — | Non-Admin GET /api/admin/users | 403 Forbidden | Planned |
| API-AUTHZ-07 | API | AC-03 | Requester GET /api/tickets with wrong requesterId in query | Returns only own tickets (session identity used) | Planned |
| API-AUTHZ-08 | API | — | Requester viewing another Requester's ticket by id | 403 or 404 | Planned |
| API-AUTHZ-09 | API | — | Expired JWT cookie on protected route | 401 Unauthorized | Planned |

---

### 2.3 IT Staff Queue API Tests (`server/tests/lab-03/staff-queue.api.test.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| API-QUEUE-01 | API | — | GET /api/staff/tickets returns paginated list | 200 OK, tickets array + pagination metadata | Planned |
| API-QUEUE-02 | API | — | Search by ticket number fragment | Returns matching tickets only | Planned |
| API-QUEUE-03 | API | — | Search by summary keyword | Returns matching tickets only | Planned |
| API-QUEUE-04 | API | — | Filter by status=IN_PROGRESS | Returns only IN_PROGRESS tickets | Planned |
| API-QUEUE-05 | API | — | Filter by itPriority=HIGH | Returns only HIGH IT priority tickets | Planned |
| API-QUEUE-06 | API | — | Filter by assignedToId=0 (unassigned) | Returns only unassigned tickets | Planned |
| API-QUEUE-07 | API | — | Sort by createdAt asc | Oldest ticket first | Planned |
| API-QUEUE-08 | API | — | Pagination page=2 pageSize=10 | Returns correct slice | Planned |
| API-QUEUE-09 | API | — | No matching tickets → empty results | 200 OK, empty array, total=0 | Planned |

---

### 2.4 IT Staff Ticket Detail API Tests (`server/tests/lab-03/staff-ticket-detail.api.test.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| API-DETAIL-01 | API | — | GET /api/staff/tickets/:id returns full detail | 200 OK, all fields present | Planned |
| API-DETAIL-02 | API | — | GET /api/staff/tickets/:id non-existent ticket | 404 Not Found | Planned |
| API-DETAIL-03 | API | — | PATCH claim ticket (assignedToId = self) | 200 OK, assignedTo updated | Planned |
| API-DETAIL-04 | API | — | PATCH reassign to another IT Staff | 200 OK, assignedTo changed | Planned |
| API-DETAIL-05 | API | — | PATCH unassign (assignedToId = null) | 200 OK, assignedTo null | Planned |
| API-DETAIL-06 | API | — | PATCH set itPriority=URGENT | 200 OK, itPriority updated | Planned |
| API-DETAIL-07 | API | AC-05 | PATCH valid status transition NEW→OPEN | 200 OK, status updated | Planned |
| API-DETAIL-08 | API | AC-06 | PATCH invalid status transition CLOSED→IN_PROGRESS | 422 Unprocessable Entity | Planned |
| API-DETAIL-09 | API | — | PATCH with invalid itPriority value | 400 Bad Request | Planned |
| API-DETAIL-10 | API | AC-14 | POST /resolve-indication by ticket owner | 200 OK, resolveIndicatedAt set | Planned |
| API-DETAIL-11 | API | — | POST /resolve-indication by non-owner Requester | 403 Forbidden | Planned |

---

### 2.5 Comments & Notes API Tests (`server/tests/lab-03/comments-notes.api.test.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| API-CN-01 | API | AC-12 | IT Staff POST valid public comment | 201 Created, comment with author+timestamp | Planned |
| API-CN-02 | API | — | Requester POST valid public comment on own ticket | 201 Created | Planned |
| API-CN-03 | API | — | POST empty comment | 400 Bad Request | Planned |
| API-CN-04 | API | — | POST comment >2000 chars | 400 Bad Request | Planned |
| API-CN-05 | API | — | GET comments returns all public comments | 200 OK, array sorted by createdAt | Planned |
| API-CN-06 | API | AC-04 | Requester GET /notes endpoint | 403 Forbidden, no note content in body | Planned |
| API-CN-07 | API | — | IT Staff POST valid internal note | 201 Created, note with author+timestamp | Planned |
| API-CN-08 | API | — | IT Staff GET notes returns all internal notes | 200 OK | Planned |
| API-CN-09 | API | — | POST empty internal note | 400 Bad Request | Planned |

---

### 2.6 Administrator User Management API Tests (`server/tests/lab-03/users-admin.api.test.ts`)

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| API-ADMIN-01 | API | — | Admin GET /api/admin/users returns user list | 200 OK, users array | Planned |
| API-ADMIN-02 | API | — | Search by name substring | Returns matching users | Planned |
| API-ADMIN-03 | API | — | Search by email substring | Returns matching users | Planned |
| API-ADMIN-04 | API | — | Filter by role=IT_STAFF | Returns only IT_STAFF users | Planned |
| API-ADMIN-05 | API | — | POST valid new Requester user | 201 Created, mustChangePassword=true | Planned |
| API-ADMIN-06 | API | AC-07 | POST duplicate email | 409 Conflict | Planned |
| API-ADMIN-07 | API | — | POST missing required field | 400 Bad Request | Planned |
| API-ADMIN-08 | API | — | POST password too short | 400 Bad Request | Planned |
| API-ADMIN-09 | API | — | PATCH edit user name and email | 200 OK, updated fields returned | Planned |
| API-ADMIN-10 | API | — | PATCH set newPassword (initial reset) | 200 OK, mustChangePassword=true | Planned |
| API-ADMIN-11 | API | AC-08 | PATCH deactivate own admin account | 403 Forbidden | Planned |
| API-ADMIN-12 | API | AC-09 | PATCH last active admin to inactive | 403 Forbidden | Planned |
| API-ADMIN-13 | API | — | Non-admin GET /api/admin/users | 403 Forbidden | Planned |
| API-ADMIN-14 | API | — | PATCH user with duplicate email | 409 Conflict | Planned |

---

### 2.7 UI Component Tests

#### `client/tests/lab-03/Login.test.tsx`

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| UI-LOGIN-01 | UI | — | Login form renders email+password+submit | All inputs present | Planned |
| UI-LOGIN-02 | UI | — | Submit with empty email shows error | Inline validation shown | Planned |
| UI-LOGIN-03 | UI | — | Submit with empty password shows error | Inline validation shown | Planned |
| UI-LOGIN-04 | UI | — | Loading state while submitting | Button disabled + spinner | Planned |
| UI-LOGIN-05 | UI | — | API error shows generic failure message | Error alert rendered | Planned |

#### `client/tests/lab-03/ChangePassword.test.tsx`

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| UI-CP-01 | UI | AC-02 | Change password form renders correctly | Fields and submit button present | Planned |
| UI-CP-02 | UI | — | Password too short shows validation | Inline error displayed | Planned |
| UI-CP-03 | UI | — | Passwords don't match shows error | Inline error on confirm field | Planned |
| UI-CP-04 | UI | — | Successful change redirects to home | Navigation called | Planned |

#### `client/tests/lab-03/StaffTicketQueue.test.tsx`

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| UI-QUEUE-01 | UI | — | Queue renders table with correct columns | All 9 columns present | Planned |
| UI-QUEUE-02 | UI | — | Status badge renders correct color | Badge matches status color map | Planned |
| UI-QUEUE-03 | UI | — | Empty state renders when no tickets | Empty-state message shown | Planned |
| UI-QUEUE-04 | UI | — | Search input triggers API call | API called with search param | Planned |
| UI-QUEUE-05 | UI | — | Pagination shows "Showing X–Y of Z tickets" | Correct range text rendered | Planned |

#### `client/tests/lab-03/StaffTicketDetail.test.tsx`

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| UI-SDETAIL-01 | UI | — | Ticket info section renders all read-only fields | All fields present | Planned |
| UI-SDETAIL-02 | UI | — | "Claim" button visible when ticket unassigned | Claim button rendered | Planned |
| UI-SDETAIL-03 | UI | — | Status dropdown shows only permitted transitions | Correct options present | Planned |
| UI-SDETAIL-04 | UI | — | Internal Notes section hidden from Requester view | Section not rendered for REQUESTER role | Planned |
| UI-SDETAIL-05 | UI | — | Public Comment post with empty content shows error | Inline validation | Planned |

#### `client/tests/lab-03/UserManagement.test.tsx`

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| UI-ADMIN-01 | UI | — | User list table renders Name/Email/Role/Status columns | All columns present | Planned |
| UI-ADMIN-02 | UI | — | Create User modal opens on button click | Modal visible | Planned |
| UI-ADMIN-03 | UI | — | Create form with missing name shows error | Inline validation | Planned |
| UI-ADMIN-04 | UI | — | Edit modal pre-fills user data | Fields populated correctly | Planned |
| UI-ADMIN-05 | UI | — | Deactivate-self shows inline error without API call | Error message rendered | Planned |

---

### 2.8 E2E Tests

#### `e2e/lab-03/authentication.spec.ts`

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| E2E-AUTH-01 | E2E | AC-01 | Valid login flow | User lands on home screen for their role | Planned |
| E2E-AUTH-02 | E2E | — | Invalid login shows error | Error message visible | Planned |
| E2E-AUTH-03 | E2E | AC-02 | mustChangePassword user login flow | Change password screen shown, then home | Planned |
| E2E-AUTH-04 | E2E | — | Logout clears session | Redirected to login; back nav blocked | Planned |
| E2E-AUTH-05 | E2E | — | Direct URL access after logout | Redirect to login | Planned |

#### `e2e/lab-03/staff-ticket-flow.spec.ts`

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| E2E-STAFF-01 | E2E | — | IT Staff login → Queue loads tickets | Queue visible with data | Planned |
| E2E-STAFF-02 | E2E | — | Search filters queue results | Matching tickets shown | Planned |
| E2E-STAFF-03 | E2E | — | Open ticket detail from queue | Detail screen loads | Planned |
| E2E-STAFF-04 | E2E | AC-05 | Claim ticket + update status | Status badge updated | Planned |
| E2E-STAFF-05 | E2E | AC-12 | Post public comment | Comment appears in thread | Planned |
| E2E-STAFF-06 | E2E | — | Post internal note | Note appears in internal section | Planned |

#### `e2e/lab-03/user-administration.spec.ts`

| Test ID | Type | AC | What It Tests | Expected Result | Status |
|---------|------|----|--------------|-----------------|--------|
| E2E-ADMIN-01 | E2E | — | Admin login → User Management loads | User list visible | Planned |
| E2E-ADMIN-02 | E2E | — | Create new IT Staff user | User appears in list | Planned |
| E2E-ADMIN-03 | E2E | AC-07 | Create user with duplicate email | Conflict error shown | Planned |
| E2E-ADMIN-04 | E2E | — | Edit user name and save | Updated name in list | Planned |
| E2E-ADMIN-05 | E2E | AC-08 | Admin tries to deactivate own account | Error shown, account still active | Planned |

---

## 3. AC-to-Test Traceability Matrix

| AC ID | Test IDs |
|-------|----------|
| AC-01 | API-AUTH-01, E2E-AUTH-01 |
| AC-02 | API-AUTH-05, API-AUTH-09, UI-CP-01, UI-CP-04, E2E-AUTH-03 |
| AC-03 | API-AUTHZ-07 |
| AC-04 | API-AUTHZ-03, API-CN-06, UI-SDETAIL-04 |
| AC-05 | API-DETAIL-07, E2E-STAFF-04 |
| AC-06 | API-DETAIL-08 |
| AC-07 | API-ADMIN-06, E2E-ADMIN-03 |
| AC-08 | API-ADMIN-11, UI-ADMIN-05, E2E-ADMIN-05 |
| AC-09 | API-ADMIN-12 |
| AC-10 | API-AUTHZ-01, API-AUTH-07 |
| AC-11 | API-AUTHZ-02 |
| AC-12 | API-CN-01, E2E-STAFF-05 |
| AC-13 | API-AUTH-02, API-AUTH-03, API-AUTH-04 |
| AC-14 | API-DETAIL-10 |

---

## 4. Required Test Files (Lab Sheet Section 12)

```
server/tests/lab-03/
├── auth.api.test.ts            ← API-AUTH-*
├── authorization.api.test.ts  ← API-AUTHZ-*
├── staff-queue.api.test.ts    ← API-QUEUE-*
├── staff-ticket-detail.api.test.ts ← API-DETAIL-*
├── comments-notes.api.test.ts ← API-CN-*
└── users-admin.api.test.ts    ← API-ADMIN-*

client/tests/lab-03/
├── Login.test.tsx              ← UI-LOGIN-*
├── ChangePassword.test.tsx    ← UI-CP-*
├── StaffTicketQueue.test.tsx  ← UI-QUEUE-*
├── StaffTicketDetail.test.tsx ← UI-SDETAIL-*
└── UserManagement.test.tsx    ← UI-ADMIN-*

e2e/lab-03/
├── authentication.spec.ts     ← E2E-AUTH-*
├── staff-ticket-flow.spec.ts  ← E2E-STAFF-*
└── user-administration.spec.ts ← E2E-ADMIN-*
```
