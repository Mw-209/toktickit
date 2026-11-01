# Lab 4 API Specification

**Project:** TokTickIT — Actions Taken, Dashboards, and Final Regression  
**Base URL:** `/api`  
**Authentication:** JWT via httpOnly cookie (established in Lab 3)

---

## 1. General Conventions

- All request and response bodies are JSON (`Content-Type: application/json`).
- Authenticated endpoints return `401 Unauthorized` when no valid session exists.
- Unauthorized role access returns `403 Forbidden`.
- Invalid input returns `400 Bad Request` with a body: `{ "error": "<message>", "field": "<fieldName>" }`.
- Not-found resources return `404 Not Found`.
- Stale/concurrent update returns `409 Conflict` with a body: `{ "error": "conflict", "message": "Resource was modified by another user." }`.
- All timestamps are ISO 8601 UTC strings.

---

## 2. Actions Taken Endpoints

### 2.1 Create Action Taken

**POST** `/api/tickets/:ticketId/actions`

**Roles:** IT Staff, Administrator

**Request Body:**
```json
{
  "actionDateTime": "2026-11-01T09:00:00Z",
  "actionDescription": "Checked server logs and identified root cause.",
  "result": "Root cause identified as expired SSL certificate.",
  "followUpRequired": true,
  "followUpNote": "Renew SSL certificate by 2026-11-05.",
  "attachmentNotes": "See screenshot_01.png for the error log."
}
```

**Validation:**
- `actionDescription`, `result`: required, non-empty string.
- `followUpNote`: required and non-empty when `followUpRequired = true`.
- `performedById` is ignored from the body; always set from the authenticated session.

**Response 201 Created:**
```json
{
  "id": "uuid",
  "ticketId": "uuid",
  "performedById": "uuid",
  "performedByName": "Jane Doe",
  "actionDateTime": "2026-11-01T09:00:00Z",
  "actionDescription": "...",
  "result": "...",
  "followUpRequired": true,
  "followUpNote": "...",
  "attachmentNotes": "...",
  "version": 1,
  "createdAt": "2026-11-01T09:01:00Z",
  "updatedAt": "2026-11-01T09:01:00Z"
}
```

---

### 2.2 Update Action Taken

**PUT** `/api/tickets/:ticketId/actions/:actionId`

**Roles:** IT Staff, Administrator

**Request Body:** Same fields as Create plus `version` (required for optimistic concurrency).

```json
{
  "actionDateTime": "2026-11-01T09:00:00Z",
  "actionDescription": "Updated description.",
  "result": "Updated result.",
  "followUpRequired": false,
  "followUpNote": "",
  "attachmentNotes": "",
  "version": 1
}
```

**Response 200 OK:** Updated Action Taken object (same shape as Create response, with incremented `version`).

**Response 409 Conflict:** When supplied `version` does not match the stored `version`.

---

### 2.3 List Actions Taken for a Ticket

**GET** `/api/tickets/:ticketId/actions`

**Roles:** All authenticated roles (Requester sees only actions on their own Tickets)

**Response 200 OK:**
```json
{
  "ticketId": "uuid",
  "actions": [
    {
      "id": "uuid",
      "performedByName": "Jane Doe",
      "actionDateTime": "2026-11-01T09:00:00Z",
      "actionDescription": "...",
      "result": "...",
      "followUpRequired": true,
      "followUpNote": "...",
      "attachmentNotes": "...",
      "version": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

Ordered by `actionDateTime` descending.

---

## 3. Ticket Status Transition

### 3.1 PATCH Ticket Status

**PATCH** `/api/tickets/:ticketId/status`

**Roles:** Role-dependent (see transition matrix in specification.md)

**Request Body:**
```json
{
  "status": "InProgress",
  "version": 3
}
```

**Validation:**
- `status` must be one of: `New`, `Open`, `InProgress`, `WaitingForRequester`, `Resolved`, `Closed`, `Cancelled`, `Reopened`.
- Transition must be permitted for the current status and current user's role (see matrix).
- `version` is required; returns 409 if stale.

**Response 200 OK:**
```json
{
  "id": "uuid",
  "status": "InProgress",
  "version": 4,
  "updatedAt": "..."
}
```

---

### 3.2 Requester "Appears Resolved" Flag

**POST** `/api/tickets/:ticketId/requester-resolved`

**Roles:** Requester (own Tickets only)

**Request Body:** (empty or `{}`)

**Response 200 OK:**
```json
{
  "ticketId": "uuid",
  "requesterIndicatedResolved": true
}
```

Note: This does **not** change the Ticket `status` field. IT Staff must formally set status to Resolved.

---

## 4. Requester Dashboard

### 4.1 GET Requester Dashboard

**GET** `/api/dashboard/requester`

**Roles:** Requester only

**Response 200 OK:**
```json
{
  "totalOpenTickets": 4,
  "waitingForRequester": 1,
  "recentlyUpdated": 3,
  "recentlyResolved": 2
}
```

**Calculation Rules:**
- `totalOpenTickets`: count of own Tickets where status NOT IN (Resolved, Closed, Cancelled).
- `waitingForRequester`: count of own Tickets where status = WaitingForRequester.
- `recentlyUpdated`: count of own Tickets where `updatedAt >= NOW() - 7 days`.
- `recentlyResolved`: count of own Tickets where status = Resolved AND `updatedAt >= NOW() - 7 days`.

All calculations use UTC. Zero values are returned as `0`, never `null`.

---

## 5. IT Staff Dashboard

### 5.1 GET IT Staff Dashboard

**GET** `/api/dashboard/staff`

**Roles:** IT Staff, Administrator

**Response 200 OK:**
```json
{
  "unassignedTickets": 5,
  "myTickets": 3,
  "ticketsByStatus": {
    "New": 2,
    "Open": 1,
    "InProgress": 3,
    "WaitingForRequester": 1,
    "Resolved": 0,
    "Closed": 0,
    "Cancelled": 0,
    "Reopened": 0
  },
  "recentlyUpdated": 7,
  "myRecentActions": [
    {
      "actionId": "uuid",
      "ticketId": "uuid",
      "ticketTitle": "Cannot access email",
      "actionDateTime": "2026-11-01T09:00:00Z",
      "actionDescription": "..."
    }
  ]
}
```

**Calculation Rules:**
- `unassignedTickets`: count of Tickets where `ownerId IS NULL` and status NOT IN (Closed, Cancelled).
- `myTickets`: count of Tickets where `ownerId = authenticated user id` and status NOT IN (Closed, Cancelled).
- `ticketsByStatus`: count of all Tickets grouped by status.
- `recentlyUpdated`: count of all Tickets where `updatedAt >= NOW() - 7 days`.
- `myRecentActions`: up to 5 most recent Actions Taken performed by the authenticated user, ordered by `actionDateTime` desc.

All calculations use UTC. Zero counts are returned as `0`, never `null`.

---

## 6. Existing Endpoints (Unchanged from Labs 2 & 3)

All endpoints from Labs 2 and 3 remain unchanged in path, method, request shape, and response shape. Lab 4 migrations must not break any existing endpoint behavior.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user identity |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/tickets` | Requester: list own Tickets |
| POST | `/api/tickets` | Requester: create Ticket |
| GET | `/api/tickets/:id` | Requester: get Ticket detail |
| GET | `/api/staff/tickets` | IT Staff: Ticket Queue |
| PATCH | `/api/staff/tickets/:id` | IT Staff: update Ticket |
| POST | `/api/tickets/:id/comments` | Create Public Comment |
| GET | `/api/tickets/:id/comments` | List Public Comments |
| POST | `/api/tickets/:id/notes` | IT Staff: create Internal Note |
| GET | `/api/tickets/:id/notes` | IT Staff: list Internal Notes |
| POST | `/api/tickets/:id/attachments` | Upload Attachment |
| GET | `/api/tickets/:id/attachments` | List Attachments |
| GET | `/api/admin/users` | Admin: list users |
| POST | `/api/admin/users` | Admin: create user |
| PUT | `/api/admin/users/:id` | Admin: update user |
