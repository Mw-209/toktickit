# TokTickIT Lab 2 REST API Specification

**Project:** TokTickIT — Requester Ticketing MVP  
**Base URL:** `/api`  
**Data Format:** JSON / Multipart Form-Data  

---

## 1. Global Conventions & Standards

* **Content-Type:** `application/json` for standard requests/responses; `multipart/form-data` for endpoints supporting file uploads.
* **Date-Time Format:** ISO 8601 string (e.g. `2026-09-03T12:00:00.000Z`).
* **Error Response Shape:**
  ```json
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Human-readable description of error",
      "details": [
        { "field": "summary", "issue": "Summary must be at least 5 characters" }
      ]
    }
  }
  ```
* **HTTP Status Codes:**
  * `200 OK`: Successful retrieval or update.
  * `201 Created`: Resource successfully created.
  * `400 Bad Request`: Input validation failed, invalid query parameter, or file size/type violation.
  * `403 Forbidden`: Cross-requester access attempted (access denied).
  * `404 Not Found`: Requested resource does not exist.
  * `410 Gone`: Resource previously existed but is soft-removed (e.g., deleted attachment).
  * `500 Internal Server Error`: Unexpected database or system failure (safe sanitized error message).

---

## 2. Endpoints Contract

### 2.1 Reference Data Endpoints

#### `GET /api/requesters`
* **Purpose:** Retrieve active Development Requesters for the simulated login dropdown.
* **Query Parameters:** None.
* **Response (200 OK):**
  ```json
  [
    {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.edu",
      "isActive": true
    },
    {
      "id": 2,
      "name": "David Lee",
      "email": "david.lee@example.edu",
      "isActive": true
    }
  ]
  ```

#### `GET /api/categories`
* **Purpose:** Retrieve active ticket categories.
* **Response (200 OK):**
  ```json
  [
    { "id": 1, "name": "Account and Access" },
    { "id": 2, "name": "Hardware" },
    { "id": 3, "name": "Software" },
    { "id": 4, "name": "Network" }
  ]
  ```

#### `GET /api/related-systems`
* **Purpose:** Retrieve active related systems affected by issues.
* **Response (200 OK):**
  ```json
  [
    { "id": 1, "name": "Email" },
    { "id": 2, "name": "Campus Wi-Fi" },
    { "id": 3, "name": "VPN" },
    { "id": 4, "name": "LEB2 App" },
    { "id": 5, "name": "Grade Submission App" },
    { "id": 6, "name": "Printer" },
    { "id": 7, "name": "Corporate Laptop" }
  ]
  ```

---

### 2.2 Ticket Management Endpoints

#### `POST /api/tickets`
* **Purpose:** Create a new ticket with optional initial attachments.
* **Content-Type:** `multipart/form-data` or `application/json`.
* **Form Fields / Payload:**
  * `requesterId` (integer, required): ID of active Development Requester.
  * `categoryId` (integer, required): ID of existing Category.
  * `relatedSystemId` (integer, required): ID of existing RelatedSystem.
  * `requestedPriority` (string, required): `LOW` | `MEDIUM` | `HIGH` | `URGENT`.
  * `summary` (string, required): 5–100 characters.
  * `description` (string, required): 10–2000 characters.
  * `files` (file array, optional): Up to 5 files, ≤5 MB each, allowed types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
* **Validation Rules:**
  * Backend trims `summary` and `description`.
  * Checks that `requesterId` exists and is active (`isActive = true`).
  * Backend generates `ticketNumber` formatted as `TKT-YYYY-XXXXXX`.
  * Sets `currentStatus = 'NEW'`.
* **Response (201 Created):**
  ```json
  {
    "id": 101,
    "ticketNumber": "TKT-2026-000101",
    "summary": "Laptop battery drains within 30 minutes",
    "description": "After the recent operating system update, the corporate laptop battery discharges completely within half an hour.",
    "requestedPriority": "MEDIUM",
    "itPriority": null,
    "currentStatus": "NEW",
    "requesterId": 1,
    "categoryId": 2,
    "relatedSystemId": 7,
    "createdAt": "2026-09-03T12:30:00.000Z",
    "updatedAt": "2026-09-03T12:30:00.000Z",
    "attachments": [
      {
        "id": 15,
        "originalName": "battery_report.pdf",
        "mimeType": "application/pdf",
        "sizeBytes": 204800,
        "isRemoved": false,
        "createdAt": "2026-09-03T12:30:00.000Z"
      }
    ]
  }
  ```
* **Error Cases:**
  * `400 Bad Request`: Validation failure (summary too short, file exceeds 5MB, illegal file type).

---

#### `GET /api/tickets`
* **Purpose:** Retrieve a paginated list of tickets owned by the active Requester.
* **Query Parameters:**
  * `requesterId` (integer, required): Current Requester context. Enforces multi-user isolation.
  * `search` (string, optional): Search query matching `summary` or `ticketNumber` (case-insensitive).
  * `categoryId` (integer, optional): Filter by category ID.
  * `priority` (string, optional): Filter by `requestedPriority`.
  * `status` (string, optional): Filter by `currentStatus`.
  * `sortBy` (string, optional): `createdAt` | `updatedAt` | `ticketNumber`. Default `createdAt`.
  * `sortOrder` (string, optional): `asc` | `desc`. Default `desc`.
  * `page` (integer, optional): Page number (1-indexed). Default `1`.
  * `limit` (integer, optional): Records per page. Default `10`, max `50`.
* **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": 101,
        "ticketNumber": "TKT-2026-000101",
        "summary": "Laptop battery drains within 30 minutes",
        "category": { "id": 2, "name": "Hardware" },
        "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
        "requestedPriority": "MEDIUM",
        "currentStatus": "NEW",
        "attachmentCount": 1,
        "createdAt": "2026-09-03T12:30:00.000Z",
        "updatedAt": "2026-09-03T12:30:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

---

#### `GET /api/tickets/:id`
* **Purpose:** Retrieve full details of a specific ticket, including all attachments.
* **Query Parameters:**
  * `requesterId` (integer, required): Used to enforce ownership check.
* **Authorization / Ownership Rule:**
  * If the ticket exists but `ticket.requesterId !== query.requesterId`, the server responds with `403 Forbidden` (`{"error": {"code": "FORBIDDEN", "message": "Access to another requester's ticket is prohibited."}}`).
* **Response (200 OK):**
  ```json
  {
    "id": 101,
    "ticketNumber": "TKT-2026-000101",
    "summary": "Laptop battery drains within 30 minutes",
    "description": "After the recent operating system update...",
    "requestedPriority": "MEDIUM",
    "itPriority": null,
    "currentStatus": "NEW",
    "requester": { "id": 1, "name": "Jennifer Anderson", "email": "jennifer.anderson@example.edu" },
    "category": { "id": 2, "name": "Hardware" },
    "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
    "createdAt": "2026-09-03T12:30:00.000Z",
    "updatedAt": "2026-09-03T12:30:00.000Z",
    "attachments": [
      {
        "id": 15,
        "originalName": "battery_report.pdf",
        "mimeType": "application/pdf",
        "sizeBytes": 204800,
        "isRemoved": false,
        "removedAt": null,
        "removalReason": null,
        "createdAt": "2026-09-03T12:30:00.000Z"
      }
    ]
  }
  ```

---

### 2.3 Attachment Endpoints

#### `POST /api/tickets/:id/attachments`
* **Purpose:** Upload and attach an additional permitted file to an existing owned ticket.
* **Content-Type:** `multipart/form-data`.
* **Query / Form Data:**
  * `requesterId` (integer, required): Ownership verification.
  * `file` (single file, required): Max 5 MB, allowed MIME types.
* **Validation:**
  * Verifies requester ownership of ticket.
  * Checks that active attachments count is `< 5`. If already 5 active attachments, responds with `400 Bad Request` (`{"error": {"code": "ATTACHMENT_LIMIT_REACHED", "message": "Maximum 5 active attachments allowed per ticket."}}`).
* **Response (201 Created):**
  ```json
  {
    "id": 16,
    "ticketId": 101,
    "originalName": "screenshot_error.png",
    "mimeType": "image/png",
    "sizeBytes": 1048576,
    "isRemoved": false,
    "createdAt": "2026-09-03T12:45:00.000Z"
  }
  ```

#### `DELETE /api/tickets/:id/attachments/:attachmentId`
* **Purpose:** Soft-remove an attachment from an owned ticket.
* **Query Parameters:**
  * `requesterId` (integer, required): Ownership verification.
* **Request Body:**
  ```json
  {
    "removalReason": "Uploaded incorrect diagnostic file by mistake."
  }
  ```
* **Validation:**
  * `removalReason` is required and must contain at least 3 characters.
  * Verifies that the attachment belongs to the specified ticket and requester owns the ticket.
* **Response (200 OK):**
  ```json
  {
    "id": 16,
    "ticketId": 101,
    "originalName": "screenshot_error.png",
    "isRemoved": true,
    "removedAt": "2026-09-03T12:50:00.000Z",
    "removalReason": "Uploaded incorrect diagnostic file by mistake."
  }
  ```

#### `GET /api/attachments/:id/download`
* **Purpose:** Stream / download an active attachment file.
* **Query Parameters:**
  * `requesterId` (integer, required): Ownership verification.
* **Behavior:**
  * If the attachment has `isRemoved = true`, immediately respond with `410 Gone` (`{"error": {"code": "FILE_REMOVED", "message": "This attachment was removed and can no longer be downloaded."}}`).
  * If requester does not own the associated ticket, respond with `403 Forbidden`.
  * If active and authorized, stream file content with appropriate `Content-Type` and `Content-Disposition`.
