import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth.js";

// ---------------------------------------------------------------------------
// ticket-workflow.api.test.ts — Lab 4 Ticket Workflow API Tests (Issue 4)
// Tests: API-WF-01 through API-WF-09
// ---------------------------------------------------------------------------

const prisma = getPrisma();

const STAFF_EMAIL = "wf_staff@test.local";
const REQUESTER_EMAIL = "wf_requester@test.local";
const TEST_PASSWORD = "Password123!";

let staffCookie: string;
let requesterCookie: string;
let requesterUserId: number;

let ticketNewId: number;
let ticketOpenId: number;
let ticketInProgressId: number;
let ticketClosedId: number;
let ticketCancelledId: number;

beforeAll(async () => {
  const hash = await hashPassword(TEST_PASSWORD);

  const staff = await prisma.user.upsert({
    where: { email: STAFF_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "IT_STAFF" },
    create: {
      name: "WF Staff Tester",
      email: STAFF_EMAIL,
      passwordHash: hash,
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
    },
  });

  const reqUser = await prisma.user.upsert({
    where: { email: REQUESTER_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "REQUESTER" },
    create: {
      name: "WF Requester Tester",
      email: REQUESTER_EMAIL,
      passwordHash: hash,
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    },
  });
  requesterUserId = reqUser.id;

  const cat = await prisma.category.upsert({
    where: { name: "Software" },
    update: {},
    create: { name: "Software" },
  });

  const sys = await prisma.relatedSystem.upsert({
    where: { name: "VPN" },
    update: { isActive: true },
    create: { name: "VPN", isActive: true },
  });

  // Create test tickets in different statuses
  const tNew = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-WF-TEST-NEW" },
    update: { currentStatus: "NEW", userId: requesterUserId, version: 1 },
    create: {
      ticketNumber: "TKT-WF-TEST-NEW",
      summary: "New Ticket for Workflow Test",
      description: "Testing transition from NEW",
      currentStatus: "NEW",
      userId: requesterUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
      version: 1,
    },
  });
  ticketNewId = tNew.id;

  const tOpen = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-WF-TEST-OPEN" },
    update: { currentStatus: "OPEN", userId: requesterUserId, version: 1 },
    create: {
      ticketNumber: "TKT-WF-TEST-OPEN",
      summary: "Open Ticket for Workflow Test",
      description: "Testing transition from OPEN",
      currentStatus: "OPEN",
      userId: requesterUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
      version: 1,
    },
  });
  ticketOpenId = tOpen.id;

  const tInProgress = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-WF-TEST-INPROGRESS" },
    update: { currentStatus: "IN_PROGRESS", userId: requesterUserId, version: 1 },
    create: {
      ticketNumber: "TKT-WF-TEST-INPROGRESS",
      summary: "In Progress Ticket for Workflow Test",
      description: "Testing transition from IN_PROGRESS",
      currentStatus: "IN_PROGRESS",
      userId: requesterUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
      version: 1,
    },
  });
  ticketInProgressId = tInProgress.id;

  const tClosed = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-WF-TEST-CLOSED" },
    update: { currentStatus: "CLOSED", userId: requesterUserId, version: 1 },
    create: {
      ticketNumber: "TKT-WF-TEST-CLOSED",
      summary: "Closed Ticket for Workflow Test",
      description: "Testing invalid transition from CLOSED",
      currentStatus: "CLOSED",
      userId: requesterUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
      version: 1,
    },
  });
  ticketClosedId = tClosed.id;

  const tCancelled = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-WF-TEST-CANCELLED" },
    update: { currentStatus: "CANCELLED", userId: requesterUserId, version: 1 },
    create: {
      ticketNumber: "TKT-WF-TEST-CANCELLED",
      summary: "Cancelled Ticket for Workflow Test",
      description: "Testing reopening from CANCELLED",
      currentStatus: "CANCELLED",
      userId: requesterUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
      version: 1,
    },
  });
  ticketCancelledId = tCancelled.id;

  const sLogin = await request(app).post("/api/auth/login").send({ email: STAFF_EMAIL, password: TEST_PASSWORD });
  staffCookie = sLogin.headers["set-cookie"];

  const rLogin = await request(app).post("/api/auth/login").send({ email: REQUESTER_EMAIL, password: TEST_PASSWORD });
  requesterCookie = rLogin.headers["set-cookie"];
});

afterAll(async () => {
  await prisma.ticket.deleteMany({
    where: {
      ticketNumber: {
        in: [
          "TKT-WF-TEST-NEW",
          "TKT-WF-TEST-OPEN",
          "TKT-WF-TEST-INPROGRESS",
          "TKT-WF-TEST-CLOSED",
          "TKT-WF-TEST-CANCELLED",
        ],
      },
    },
  });
});

describe("Lab 4 API: Ticket Workflow (Issue 4)", () => {
  // API-WF-01: IT Staff transitions Ticket from Closed to In Progress -> 400 Bad Request
  it("API-WF-01 (AC-08): IT Staff transitions Ticket from Closed to In Progress returns 400 Bad Request", async () => {
    const res = await request(app)
      .patch(`/api/tickets/${ticketClosedId}/status`)
      .set("Cookie", staffCookie)
      .send({ status: "IN_PROGRESS" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_TRANSITION");
  });

  // API-WF-02: IT Staff transitions Ticket from New to Open -> 200 OK
  it("API-WF-02: IT Staff transitions Ticket from New to Open returns 200 OK", async () => {
    const res = await request(app)
      .patch(`/api/tickets/${ticketNewId}/status`)
      .set("Cookie", staffCookie)
      .send({ status: "OPEN" });

    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("OPEN");
    expect(res.body.version).toBeGreaterThanOrEqual(2);
  });

  // API-WF-03: IT Staff transitions Ticket from In Progress to Resolved -> 200 OK
  it("API-WF-03: IT Staff transitions Ticket from In Progress to Resolved returns 200 OK", async () => {
    const res = await request(app)
      .patch(`/api/tickets/${ticketInProgressId}/status`)
      .set("Cookie", staffCookie)
      .send({ status: "RESOLVED" });

    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("RESOLVED");
  });

  // API-WF-04: Requester flags "problem appears resolved" — status unchanged (Resolution Gate)
  it("API-WF-04 (AC-06): Requester flags problem appears resolved but ticket status does not change to RESOLVED", async () => {
    // Ticket open is in status OPEN
    const res = await request(app)
      .post(`/api/tickets/${ticketOpenId}/requester-resolved`)
      .set("Cookie", requesterCookie)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.requesterIndicatedResolved).toBe(true);

    // Verify in database that ticket status is still OPEN (not changed to RESOLVED)
    const t = await prisma.ticket.findUnique({ where: { id: ticketOpenId } });
    expect(t?.currentStatus).toBe("OPEN");
  });

  // API-WF-05: Requester attempts to directly transition status to Resolved -> 403 Forbidden
  it("API-WF-05: Requester attempts to directly transition status to Resolved returns 403 Forbidden", async () => {
    const res = await request(app)
      .patch(`/api/tickets/${ticketOpenId}/status`)
      .set("Cookie", requesterCookie)
      .send({ status: "RESOLVED" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("FORBIDDEN");
  });

  // API-WF-06: Two concurrent status patches using same ticket version -> Second returns 409 Conflict
  it("API-WF-06 (AC-07): Concurrent status patches with stale version returns 409 Conflict", async () => {
    const currentTicket = await prisma.ticket.findUnique({ where: { id: ticketNewId } });
    const currentVersion = currentTicket!.version;

    // First patch with current version succeeds
    const res1 = await request(app)
      .patch(`/api/tickets/${ticketNewId}/status`)
      .set("Cookie", staffCookie)
      .send({ status: "CANCELLED", version: currentVersion });

    expect(res1.status).toBe(200);
    expect(res1.body.version).toBe(currentVersion + 1);

    // Second patch with the now stale version returns 409 Conflict
    const res2 = await request(app)
      .patch(`/api/tickets/${ticketNewId}/status`)
      .set("Cookie", staffCookie)
      .send({ status: "REOPENED", version: currentVersion });

    expect(res2.status).toBe(409);
    expect(res2.body.error).toBe("conflict");
  });

  // API-WF-07: IT Staff cancels a Ticket from In Progress -> 200 OK
  it("API-WF-07: IT Staff cancels a Ticket returns 200 OK", async () => {
    // Reset ticket to IN_PROGRESS
    await prisma.ticket.update({ where: { id: ticketInProgressId }, data: { currentStatus: "IN_PROGRESS" } });

    const res = await request(app)
      .patch(`/api/tickets/${ticketInProgressId}/status`)
      .set("Cookie", staffCookie)
      .send({ status: "CANCELLED" });

    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("CANCELLED");
  });

  // API-WF-08: IT Staff reopens a Cancelled Ticket -> 200 OK
  it("API-WF-08: IT Staff reopens a Cancelled Ticket returns 200 OK", async () => {
    const res = await request(app)
      .patch(`/api/tickets/${ticketCancelledId}/status`)
      .set("Cookie", staffCookie)
      .send({ status: "REOPENED" });

    expect(res.status).toBe(200);
    expect(res.body.currentStatus).toBe("REOPENED");
  });

  // API-WF-09: Unauthenticated status PATCH -> 401 Unauthorized
  it("API-WF-09: Unauthenticated status PATCH returns 401 Unauthorized", async () => {
    const res = await request(app)
      .patch(`/api/tickets/${ticketOpenId}/status`)
      .send({ status: "IN_PROGRESS" });

    expect(res.status).toBe(401);
  });
});
