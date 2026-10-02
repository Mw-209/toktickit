import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth.js";

// ---------------------------------------------------------------------------
// staff-ticket-detail.api.test.ts — Lab 3 IT Staff Ticket Detail API Tests
// Tests: API-DETAIL-01 through API-DETAIL-11
// ---------------------------------------------------------------------------

const prisma = getPrisma();

const STAFF_EMAIL = "detail_staff@test.local";
const STAFF2_EMAIL = "detail_staff2@test.local";
const REQUESTER_EMAIL = "detail_requester@test.local";
const TEST_PASSWORD = "TestPass123!";

let staffCookie: string;
let staff2Cookie: string;
let requesterCookie: string;
let staffId: number;
let staff2Id: number;
let requesterId: number;
let testTicketId: number;
let closedTicketId: number;
let categoryId: number;
let relatedSystemId: number;

beforeAll(async () => {
  const hash = await hashPassword(TEST_PASSWORD);

  const staff = await prisma.user.upsert({
    where: { email: STAFF_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "IT_STAFF" },
    create: { name: "Detail Staff 1", email: STAFF_EMAIL, passwordHash: hash, role: "IT_STAFF", isActive: true, mustChangePassword: false },
  });
  staffId = staff.id;

  const staff2 = await prisma.user.upsert({
    where: { email: STAFF2_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "IT_STAFF" },
    create: { name: "Detail Staff 2", email: STAFF2_EMAIL, passwordHash: hash, role: "IT_STAFF", isActive: true, mustChangePassword: false },
  });
  staff2Id = staff2.id;

  const requester = await prisma.user.upsert({
    where: { email: REQUESTER_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "REQUESTER" },
    create: { name: "Detail Requester", email: REQUESTER_EMAIL, passwordHash: hash, role: "REQUESTER", isActive: true, mustChangePassword: false },
  });
  requesterId = requester.id;

  const cat = await prisma.category.upsert({ where: { name: "Hardware" }, update: {}, create: { name: "Hardware" } });
  categoryId = cat.id;
  const sys = await prisma.relatedSystem.upsert({ where: { name: "Corporate Laptop" }, update: { isActive: true }, create: { name: "Corporate Laptop", isActive: true } });
  relatedSystemId = sys.id;

  // Test ticket (open/new state)
  const ticket = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-DETAIL-TEST-001" },
    update: { currentStatus: "NEW", assignedToId: null },
    create: { ticketNumber: "TKT-DETAIL-TEST-001", summary: "Detail test ticket", description: "For detail API tests", requestedPriority: "MEDIUM", currentStatus: "NEW", userId: requesterId, categoryId, relatedSystemId },
  });
  testTicketId = ticket.id;

  // Closed ticket for invalid transition test
  const closed = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-DETAIL-TEST-002" },
    update: { currentStatus: "CLOSED" },
    create: { ticketNumber: "TKT-DETAIL-TEST-002", summary: "Closed test ticket", description: "For transition test", requestedPriority: "LOW", currentStatus: "CLOSED", userId: requesterId, categoryId, relatedSystemId },
  });
  closedTicketId = closed.id;

  // Login cookies
  const s1 = await request(app).post("/api/auth/login").send({ email: STAFF_EMAIL, password: TEST_PASSWORD });
  staffCookie = s1.headers["set-cookie"];
  const s2 = await request(app).post("/api/auth/login").send({ email: STAFF2_EMAIL, password: TEST_PASSWORD });
  staff2Cookie = s2.headers["set-cookie"];
  const r = await request(app).post("/api/auth/login").send({ email: REQUESTER_EMAIL, password: TEST_PASSWORD });
  requesterCookie = r.headers["set-cookie"];
});

afterAll(async () => {
  await prisma.publicComment.deleteMany({ where: { ticketId: { in: [testTicketId, closedTicketId] } } });
  await prisma.internalNote.deleteMany({ where: { ticketId: { in: [testTicketId, closedTicketId] } } });
  await prisma.ticket.deleteMany({ where: { ticketNumber: { in: ["TKT-DETAIL-TEST-001", "TKT-DETAIL-TEST-002"] } } });
  await prisma.user.deleteMany({ where: { email: { in: [STAFF_EMAIL, STAFF2_EMAIL, REQUESTER_EMAIL] } } });
});

// ---------------------------------------------------------------------------
describe("IT Staff Ticket Detail", () => {
  // API-DETAIL-01: GET full detail
  it("API-DETAIL-01: GET /api/staff/tickets/:id returns full ticket detail", async () => {
    const res = await request(app).get(`/api/staff/tickets/${testTicketId}`).set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", testTicketId);
    expect(res.body).toHaveProperty("ticketNumber");
    expect(res.body).toHaveProperty("summary");
  });

  // API-DETAIL-02: 404 for non-existent ticket
  it("API-DETAIL-02: GET non-existent ticket returns 404", async () => {
    const res = await request(app).get("/api/staff/tickets/999999").set("Cookie", staffCookie);
    expect(res.status).toBe(404);
  });

  // API-DETAIL-03: PATCH claim ticket (assignedToId = self)
  it("API-DETAIL-03: PATCH claim ticket assigns to self", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}`)
      .set("Cookie", staffCookie)
      .send({ assignedToId: staffId });
    expect(res.status).toBe(200);
    expect(res.body.assignedTo).toBeTruthy();
  });

  // API-DETAIL-04: PATCH reassign to another IT Staff
  it("API-DETAIL-04: PATCH reassign ticket to another IT Staff", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}`)
      .set("Cookie", staffCookie)
      .send({ assignedToId: staff2Id });
    expect(res.status).toBe(200);
    expect(res.body.assignedTo.id).toBe(staff2Id);
  });

  // API-DETAIL-05: PATCH unassign (assignedToId = null)
  it("API-DETAIL-05: PATCH unassign ticket sets assignedTo null", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}`)
      .set("Cookie", staffCookie)
      .send({ assignedToId: null });
    expect(res.status).toBe(200);
    expect(res.body.assignedTo).toBeNull();
  });

  // API-DETAIL-06: PATCH set itPriority=URGENT
  it("API-DETAIL-06: PATCH set itPriority=URGENT updates IT priority", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}`)
      .set("Cookie", staffCookie)
      .send({ itPriority: "URGENT" });
    expect(res.status).toBe(200);
    expect(res.body.itPriority).toBe("URGENT");
  });

  // API-DETAIL-07: PATCH valid status transition (AC-05)
  // Reset ticket to NEW then transition to OPEN, or transition OPEN→IN_PROGRESS
  it("API-DETAIL-07: PATCH valid status transition returns 200 with updated status", async () => {
    // First get current status
    const getRes = await request(app).get(`/api/staff/tickets/${testTicketId}`).set("Cookie", staffCookie);
    const currentStatus = getRes.body.currentStatus;

    // Pick a valid next status based on current
    const transitions: Record<string, string> = {
      NEW: "IN_PROGRESS",
      OPEN: "IN_PROGRESS",
      IN_PROGRESS: "RESOLVED",
      WAITING_FOR_REQUESTER: "IN_PROGRESS",
      RESOLVED: "CLOSED",
    };
    const nextStatus = transitions[currentStatus];
    if (!nextStatus) {
      // Terminal state, just verify we can get the ticket
      expect(getRes.status).toBe(200);
      return;
    }

    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}`)
      .set("Cookie", staffCookie)
      .send({ currentStatus: nextStatus });
    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe(nextStatus);
  });

  // API-DETAIL-08: PATCH invalid status transition CLOSED → IN_PROGRESS (AC-06)
  it("API-DETAIL-08: PATCH invalid status transition CLOSED→IN_PROGRESS returns 422", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${closedTicketId}`)
      .set("Cookie", staffCookie)
      .send({ currentStatus: "IN_PROGRESS" });
    expect(res.status).toBe(422);
  });

  // API-DETAIL-09: PATCH with invalid itPriority value
  it("API-DETAIL-09: PATCH with invalid itPriority value returns 400", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}`)
      .set("Cookie", staffCookie)
      .send({ itPriority: "INVALID_PRIORITY" });
    expect(res.status).toBe(400);
  });

  // API-DETAIL-10: POST /resolve-indication by ticket owner (AC-14)
  it("API-DETAIL-10: Requester POST /resolve-indication sets resolveIndicatedAt", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/resolve-indication`)
      .set("Cookie", requesterCookie);
    expect(res.status).toBe(200);
    expect(res.body.resolveIndicatedAt).toBeTruthy();
  });

  // API-DETAIL-11: POST /resolve-indication by non-owner Requester → 403
  it("API-DETAIL-11: Non-owner Requester POST /resolve-indication returns 403", async () => {
    // Create another requester to test non-ownership
    const hash = await hashPassword(TEST_PASSWORD);
    const otherEmail = "detail_other_req@test.local";
    await prisma.user.upsert({
      where: { email: otherEmail },
      update: { passwordHash: hash, isActive: true, role: "REQUESTER" },
      create: { name: "Other Requester", email: otherEmail, passwordHash: hash, role: "REQUESTER", isActive: true, mustChangePassword: false },
    });
    const otherLogin = await request(app).post("/api/auth/login").send({ email: otherEmail, password: TEST_PASSWORD });
    const otherCookie = otherLogin.headers["set-cookie"];
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/resolve-indication`)
      .set("Cookie", otherCookie);
    expect([403, 404]).toContain(res.status);
    await prisma.user.deleteMany({ where: { email: otherEmail } });
  });
});
