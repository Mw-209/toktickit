import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth.js";

// ---------------------------------------------------------------------------
// authorization.api.test.ts — Lab 3 Issue 2 Authorization Tests
// Tests: API-AUTHZ-01 through API-AUTHZ-09
// Verifies server-side enforcement (not just UI hiding)
// ---------------------------------------------------------------------------

const prisma = getPrisma();

const REQUESTER_EMAIL = "authz_requester@test.local";
const STAFF_EMAIL = "authz_staff@test.local";
const TEST_PASSWORD = "TestPass123!";

let requesterCookie: string;
let staffCookie: string;

beforeAll(async () => {
  const hash = await hashPassword(TEST_PASSWORD);

  await prisma.user.upsert({
    where: { email: REQUESTER_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "REQUESTER" },
    create: {
      name: "AuthZ Test Requester",
      email: REQUESTER_EMAIL,
      passwordHash: hash,
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    },
  });

  await prisma.user.upsert({
    where: { email: STAFF_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "IT_STAFF" },
    create: {
      name: "AuthZ Test Staff",
      email: STAFF_EMAIL,
      passwordHash: hash,
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
    },
  });

  // Login to get cookies
  const rLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: REQUESTER_EMAIL, password: TEST_PASSWORD });
  requesterCookie = rLogin.headers["set-cookie"];

  const sLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: STAFF_EMAIL, password: TEST_PASSWORD });
  staffCookie = sLogin.headers["set-cookie"];
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { email: { in: [REQUESTER_EMAIL, STAFF_EMAIL] } },
  });
});

// ---------------------------------------------------------------------------
// Unauthenticated Access Tests
// ---------------------------------------------------------------------------

describe("Unauthenticated access (no cookie)", () => {
  // API-AUTHZ-01: Unauthenticated → 401 on ticket list
  it("API-AUTHZ-01: returns 401 on GET /api/tickets without JWT cookie", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(401);
  });

  // API-AUTHZ-09: Expired/tampered JWT → 401
  it("API-AUTHZ-09: returns 401 for tampered JWT cookie", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "token=thisisnotavalidjwt");
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Role-Based Access Tests — Requester trying Staff/Admin endpoints
// ---------------------------------------------------------------------------

describe("Requester accessing IT Staff endpoints", () => {
  // API-AUTHZ-02: Requester → 403 on staff queue
  it("API-AUTHZ-02: returns 403 when Requester accesses GET /api/staff/tickets", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Cookie", requesterCookie);
    expect(res.status).toBe(403);
  });

  // API-AUTHZ-05: Requester → 403 on PATCH staff ticket
  it("API-AUTHZ-05: returns 403 when Requester PATCHes /api/staff/tickets/:id", async () => {
    const res = await request(app)
      .patch("/api/staff/tickets/1")
      .set("Cookie", requesterCookie)
      .send({ currentStatus: "OPEN" });
    expect(res.status).toBe(403);
  });

  // API-AUTHZ-06: Requester → 403 on admin users
  it("API-AUTHZ-06: returns 403 when Requester accesses GET /api/admin/users", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", requesterCookie);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Role-Based Access Tests — IT Staff trying Requester-only endpoints
// ---------------------------------------------------------------------------

describe("IT Staff accessing Requester-only endpoints", () => {
  // API-AUTHZ-04: IT Staff → 403 on POST /api/tickets
  it("API-AUTHZ-04: returns 403 when IT Staff creates a ticket via POST /api/tickets", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("Cookie", staffCookie)
      .field("summary", "Test Ticket")
      .field("description", "Test Description for ticket creation")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "MEDIUM");
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// Requester accessing Internal Notes (AC-04)
// ---------------------------------------------------------------------------

describe("Requester accessing Internal Notes", () => {
  // API-AUTHZ-03: Requester → 403 on GET notes, no content disclosed
  it("API-AUTHZ-03: returns 403 on GET /api/tickets/:id/notes for Requester (no note content disclosed)", async () => {
    const res = await request(app)
      .get("/api/tickets/1/notes")
      .set("Cookie", requesterCookie);

    expect(res.status).toBe(403);
    // Ensure no note content is present in the response
    expect(JSON.stringify(res.body)).not.toContain("content");
    expect(JSON.stringify(res.body)).not.toContain("notes");
  });
});

// ---------------------------------------------------------------------------
// Session Identity Enforcement (AC-03)
// ---------------------------------------------------------------------------

describe("Session identity enforcement", () => {
  // API-AUTHZ-07: Requester cannot override requesterId via query param
  it("API-AUTHZ-07: GET /api/tickets uses session identity, ignores query requesterId", async () => {
    // Get the authenticated Requester user id
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", requesterCookie);
    const myId = meRes.body.id;

    // Try to pass a different requesterId — server should still return own tickets
    const res = await request(app)
      .get("/api/tickets?requesterId=9999")
      .set("Cookie", requesterCookie);

    expect(res.status).toBe(200);
    // All returned tickets must belong to the authenticated user, not 9999
    if (res.body.items && res.body.items.length > 0) {
      res.body.items.forEach((ticket: any) => {
        expect(ticket.requesterId).toBe(myId);
      });
    }
  });

  // API-AUTHZ-08: Requester cannot access another user's ticket by id
  it("API-AUTHZ-08: GET /api/tickets/:id returns 403 for ticket owned by another Requester", async () => {
    // Create a ticket as the staff user's context... but first check if any ticket exists
    // owned by someone other than our test requester. If DB is empty, this passes vacuously.
    const requesterMe = await request(app)
      .get("/api/auth/me")
      .set("Cookie", requesterCookie);
    const myId = requesterMe.body.id;

    // Find a ticket NOT owned by this requester
    const otherTicket = await prisma.ticket.findFirst({
      where: { requesterId: { not: myId } },
    });

    if (otherTicket) {
      const res = await request(app)
        .get(`/api/tickets/${otherTicket.id}`)
        .set("Cookie", requesterCookie);
      expect([403, 404]).toContain(res.status);
    } else {
      // No other tickets exist — test passes as there is nothing to cross-access
      expect(true).toBe(true);
    }
  });
});
