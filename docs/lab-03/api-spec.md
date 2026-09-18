# Lab 3 API Specification

**Project:** TokTickIT — Users, Roles, IT Staff Ticketing, and Admin Screens  
**Base URL:** `http://localhost:3001`  
**Authentication:** JWT stored in `httpOnly; SameSite=Lax` cookie named `token`  
**Content-Type:** `application/json` unless noted

---

## 1. Authentication Mechanism

- On successful login, the server sets a `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400` header.
- All protected endpoints read the `token` cookie and verify the JWT using `JWT_SECRET` (env var).
- Logout clears the cookie with `Set-Cookie: token=; HttpOnly; Max-Age=0`.
- The JWT payload contains: `{ userId: number, role: string, iat: number, exp: number }`.
- JWT expiry: 24 hours.

---

## 2. Standard Error Response Shape

```json
{
  "error": "HUMAN_READABLE_CODE",
  "message": "Descriptive message for UI display"
}
```

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Bad Request — validation failure |
| 401 | Unauthorized — not authenticated |
| 403 | Forbidden — authenticated but not permitted |
| 404 | Not Found |
| 409 | Conflict — e.g. duplicate email |
| 410 | Gone — soft-removed attachment |
| 422 | Unprocessable Entity — e.g. invalid status transition |
| 500 | Internal Server Error |

---

## 3. Authentication Endpoints

### POST `/api/auth/login`
**Access:** Public

**Request Body:**
```json
{
  "email": "jennifer.anderson@example.edu",
  "password": "SecurePass123"
}
```

**Success Response — 200 OK:**
```json
{
  "id": 1,
  "name": "Jennifer Anderson",
  "email": "jennifer.anderson@example.edu",
  "role": "REQUESTER"
}
```
Sets `Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`

**Error Responses:**
- `401` — Invalid credentials or inactive account (generic message, do not expose which)
- `400` — Missing email or password field

---

### POST `/api/auth/logout`
**Access:** Authenticated (any role)

**Request Body:** None

**Success Response — 200 OK:**
```json
{ "message": "Logged out successfully" }
```
Clears cookie: `Set-Cookie: token=; HttpOnly; Max-Age=0`

---

### GET `/api/auth/me`
**Access:** Authenticated (any role)

**Success Response — 200 OK:**
```json
{
  "id": 1,
  "name": "Jennifer Anderson",
  "email": "jennifer.anderson@example.edu",
  "role": "REQUESTER",
  "mustChangePassword": false
}
```

**Error:** `401` — Not authenticated

---

### POST `/api/auth/change-password`
**Access:** Authenticated (any role)

**Request Body:**
```json
{
  "newPassword": "NewSecurePass456",
  "confirmPassword": "NewSecurePass456"
}
```

**Validation:**
- `newPassword`: required, min 8 characters
- `confirmPassword`: must match `newPassword`

**Success Response — 200 OK:**
```json
{ "message": "Password changed successfully" }
```
Clears `mustChangePassword` flag. Cookie remains valid.

**Error Responses:**
- `400` — Validation failure (too short, mismatch)
- `401` — Not authenticated

---

## 4. Lab 2 Requester Endpoints (Modified)

All Lab 2 endpoints now require authentication. The `requesterId` is derived from the authenticated session; any client-supplied `requesterId` in body/query is **ignored**.

`GET /api/requesters` is **removed**.

### GET `/api/requesters` — REMOVED
This endpoint no longer exists. Returns `404`.

### GET `/api/categories`
**Access:** Authenticated (any role)  
**Unchanged from Lab 2.**

### GET `/api/systems`
**Access:** Authenticated (any role)  
**Unchanged from Lab 2.**

### POST `/api/tickets`
**Access:** REQUESTER only  
**Body and response unchanged from Lab 2.**  
`requesterId` derived from session; client-supplied value ignored.

### GET `/api/tickets`
**Access:** REQUESTER only  
**Query params and response unchanged from Lab 2.**  
Returns only tickets owned by the authenticated Requester.

### GET `/api/tickets/:id`
**Access:** REQUESTER (owner only)  
**Response unchanged from Lab 2.**  
Returns `403` if ticket belongs to another Requester.

### POST `/api/tickets/:id/attachments`
**Access:** REQUESTER (owner only)  
**Unchanged from Lab 2.**

### DELETE `/api/tickets/:id/attachments/:attachmentId`
**Access:** REQUESTER (owner only)  
**Unchanged from Lab 2.**

### GET `/api/attachments/:id/download`
**Access:** Authenticated — REQUESTER (owner only for their tickets), IT_STAFF, ADMINISTRATOR  
**Unchanged from Lab 2 for soft-removal (410 Gone).**

---

## 5. Public Comments & Internal Notes

### POST `/api/tickets/:id/comments`
**Access:** Authenticated (REQUESTER owner, IT_STAFF, ADMINISTRATOR)

**Request Body:**
```json
{ "content": "The issue seems to be related to the VPN certificate." }
```

**Validation:**
- `content`: required, non-empty after trim, max 2,000 characters

**Success Response — 201 Created:**
```json
{
  "id": 1,
  "ticketId": 5,
  "author": { "id": 2, "name": "Alice Staff", "role": "IT_STAFF" },
  "content": "The issue seems to be related to the VPN certificate.",
  "createdAt": "2026-09-01T10:30:00.000Z"
}
```

**Error Responses:**
- `400` — Empty or too-long content
- `403` — Not the ticket owner (for Requester) or not authenticated
- `404` — Ticket not found

---

### GET `/api/tickets/:id/comments`
**Access:** Authenticated (REQUESTER owner, IT_STAFF, ADMINISTRATOR)

**Success Response — 200 OK:**
```json
{
  "comments": [
    {
      "id": 1,
      "author": { "id": 2, "name": "Alice Staff", "role": "IT_STAFF" },
      "content": "The issue seems to be related to the VPN certificate.",
      "createdAt": "2026-09-01T10:30:00.000Z"
    }
  ]
}
```

---

### POST `/api/tickets/:id/notes`
**Access:** IT_STAFF, ADMINISTRATOR only

**Request Body:**
```json
{ "content": "Internal: checked with network team, VPN cert expired." }
```

**Validation:** Same as comments (non-empty, max 2,000 chars)

**Success Response — 201 Created:**
```json
{
  "id": 1,
  "ticketId": 5,
  "author": { "id": 2, "name": "Alice Staff", "role": "IT_STAFF" },
  "content": "Internal: checked with network team, VPN cert expired.",
  "createdAt": "2026-09-01T10:35:00.000Z"
}
```

**Error Responses:**
- `403` — Requester or unauthenticated (no note content disclosed)
- `404` — Ticket not found

---

### GET `/api/tickets/:id/notes`
**Access:** IT_STAFF, ADMINISTRATOR only

**Success Response — 200 OK:**
```json
{
  "notes": [
    {
      "id": 1,
      "author": { "id": 2, "name": "Alice Staff", "role": "IT_STAFF" },
      "content": "Internal: checked with network team, VPN cert expired.",
      "createdAt": "2026-09-01T10:35:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `403` — Requester (no note content, no count disclosed)

---

### POST `/api/tickets/:id/resolve-indication`
**Access:** REQUESTER (owner only)

**Request Body:** None

**Success Response — 200 OK:**
```json
{
  "ticketId": 5,
  "resolveIndicatedAt": "2026-09-01T11:00:00.000Z"
}
```

**Error Responses:**
- `403` — Not the ticket owner, or ticket is RESOLVED/CLOSED/CANCELLED
- `409` — Already indicated

---

## 6. IT Staff Endpoints

### GET `/api/staff/tickets`
**Access:** IT_STAFF, ADMINISTRATOR

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search in ticketNumber and summary (case-insensitive) |
| `status` | string | Filter by currentStatus |
| `itPriority` | string | Filter by itPriority |
| `categoryId` | number | Filter by categoryId |
| `assignedToId` | number | Filter by assignedToId; use `0` for unassigned |
| `sortBy` | string | `ticketNumber`, `createdAt`, `updatedAt`, `itPriority` (default: `createdAt`) |
| `sortOrder` | string | `asc` or `desc` (default: `desc`) |
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page: 10, 25, or 50 (default: 10) |

**Success Response — 200 OK:**
```json
{
  "tickets": [
    {
      "id": 5,
      "ticketNumber": "TKT-2026-000005",
      "summary": "Cannot connect to VPN",
      "category": { "id": 4, "name": "Network" },
      "requestedPriority": "HIGH",
      "itPriority": "HIGH",
      "currentStatus": "IN_PROGRESS",
      "assignedTo": { "id": 2, "name": "Alice Staff" },
      "requester": { "id": 1, "name": "Jennifer Anderson" },
      "createdAt": "2026-09-01T09:00:00.000Z",
      "updatedAt": "2026-09-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

---

### GET `/api/staff/tickets/:id`
**Access:** IT_STAFF, ADMINISTRATOR

**Success Response — 200 OK:**
```json
{
  "id": 5,
  "ticketNumber": "TKT-2026-000005",
  "summary": "Cannot connect to VPN",
  "description": "Since yesterday morning, I cannot connect to the university VPN...",
  "category": { "id": 4, "name": "Network" },
  "relatedSystem": { "id": 3, "name": "VPN" },
  "requestedPriority": "HIGH",
  "itPriority": "HIGH",
  "currentStatus": "IN_PROGRESS",
  "resolveIndicatedAt": null,
  "assignedTo": { "id": 2, "name": "Alice Staff", "role": "IT_STAFF" },
  "requester": { "id": 1, "name": "Jennifer Anderson" },
  "attachments": [...],
  "createdAt": "2026-09-01T09:00:00.000Z",
  "updatedAt": "2026-09-01T10:30:00.000Z"
}
```

---

### PATCH `/api/staff/tickets/:id`
**Access:** IT_STAFF, ADMINISTRATOR

**Request Body (all fields optional — send only what changes):**
```json
{
  "assignedToId": 2,
  "itPriority": "HIGH",
  "currentStatus": "RESOLVED"
}
```

**Validation:**
- `assignedToId`: must be id of active IT_STAFF or ADMINISTRATOR user; `null` to unassign
- `itPriority`: one of LOW, MEDIUM, HIGH, URGENT
- `currentStatus`: must be a permitted transition from current status (see BR-13)

**Success Response — 200 OK:** Updated ticket object (same shape as GET)

**Error Responses:**
- `422` — Invalid status transition
- `400` — Invalid itPriority value or invalid assignedToId
- `403` — Not IT Staff or Admin
- `404` — Ticket not found

---

## 7. Administrator User Management Endpoints

### GET `/api/admin/users`
**Access:** ADMINISTRATOR only

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search in name and email (case-insensitive) |
| `role` | string | Optional role filter: REQUESTER, IT_STAFF, ADMINISTRATOR |

**Success Response — 200 OK:**
```json
{
  "users": [
    {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.edu",
      "role": "REQUESTER",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-09-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/api/admin/users`
**Access:** ADMINISTRATOR only

**Request Body:**
```json
{
  "name": "Bob Technician",
  "email": "bob.tech@example.edu",
  "role": "IT_STAFF",
  "password": "InitialPass789",
  "isActive": true
}
```

**Validation:**
- `name`: required, non-empty
- `email`: required, valid format, unique
- `role`: required, one of REQUESTER, IT_STAFF, ADMINISTRATOR
- `password`: required, min 8 characters
- `isActive`: boolean, default true

**Success Response — 201 Created:**
```json
{
  "id": 10,
  "name": "Bob Technician",
  "email": "bob.tech@example.edu",
  "role": "IT_STAFF",
  "isActive": true,
  "mustChangePassword": true,
  "createdAt": "2026-09-17T10:00:00.000Z"
}
```

**Error Responses:**
- `400` — Validation failure
- `409` — Duplicate email

---

### PATCH `/api/admin/users/:id`
**Access:** ADMINISTRATOR only

**Request Body (all fields optional):**
```json
{
  "name": "Bob T. Technician",
  "email": "bob.t@example.edu",
  "role": "IT_STAFF",
  "isActive": true,
  "newPassword": "NewInitialPass123"
}
```

**Validation:**
- Same as POST for each provided field
- If `newPassword` provided: min 8 chars; sets `mustChangePassword = true`

**Success Response — 200 OK:** Updated user object

**Error Responses:**
- `400` — Validation failure
- `403` — Admin deactivating self, or removing last active admin
- `409` — Duplicate email
- `404` — User not found

---

## 8. Authorization Matrix

| Endpoint | REQUESTER | IT_STAFF | ADMINISTRATOR |
|----------|-----------|---------|---------------|
| POST /api/auth/login | ✓ | ✓ | ✓ |
| POST /api/auth/logout | ✓ | ✓ | ✓ |
| GET /api/auth/me | ✓ | ✓ | ✓ |
| POST /api/auth/change-password | ✓ | ✓ | ✓ |
| GET /api/categories | ✓ | ✓ | ✓ |
| GET /api/systems | ✓ | ✓ | ✓ |
| POST /api/tickets | ✓ | — | — |
| GET /api/tickets (own) | ✓ | — | — |
| GET /api/tickets/:id (own) | ✓ | — | — |
| POST /api/tickets/:id/attachments (own) | ✓ | — | — |
| DELETE /api/tickets/:id/attachments/:aid (own) | ✓ | — | — |
| GET /api/attachments/:id/download | ✓ (own) | ✓ | ✓ |
| POST /api/tickets/:id/comments | ✓ (own) | ✓ | ✓ |
| GET /api/tickets/:id/comments | ✓ (own) | ✓ | ✓ |
| POST /api/tickets/:id/notes | — | ✓ | ✓ |
| GET /api/tickets/:id/notes | — | ✓ | ✓ |
| POST /api/tickets/:id/resolve-indication | ✓ (own) | — | — |
| GET /api/staff/tickets | — | ✓ | ✓ |
| GET /api/staff/tickets/:id | — | ✓ | ✓ |
| PATCH /api/staff/tickets/:id | — | ✓ | ✓ |
| GET /api/admin/users | — | — | ✓ |
| POST /api/admin/users | — | — | ✓ |
| PATCH /api/admin/users/:id | — | — | ✓ |
