import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth.js";

// ---------------------------------------------------------------------------
// actions-taken.api.test.ts — Lab 4 Actions Taken API Tests (Issue 2)
// Tests: API-AT-01 through API-AT-10
// ---------------------------------------------------------------------------

const prisma = getPrisma();

const STAFF_EMAIL = "at_staff@test.local";
const REQUESTER_EMAIL = "at_requester@test.local";
const OTHER_REQUESTER_EMAIL = "at_other_requester@test.local";
const TEST_PASSWORD = "TestPassword123!";

let staffCookie: string;
let requesterCookie: string;
let otherRequesterCookie: string;
let staffUserId: number;
let requesterUserId: number;
let otherRequesterUserId: number;
let testTicketId: number;
let otherTicketId: number;

beforeAll(async () => {
  const hash = await hashPassword(TEST_PASSWORD);

  const staff = await prisma.user.upsert({
    where: { email: STAFF_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "IT_STAFF" },
    create: {
      name: "AT Staff Tester",
      email: STAFF_EMAIL,
      passwordHash: hash,
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
    },
  });
  staffUserId = staff.id;

  const reqUser = await prisma.user.upsert({
    where: { email: REQUESTER_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "REQUESTER" },
    create: {
      name: "AT Requester Tester",
      email: REQUESTER_EMAIL,
      passwordHash: hash,
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    },
  });
  requesterUserId = reqUser.id;

  const otherReqUser = await prisma.user.upsert({
    where: { email: OTHER_REQUESTER_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "REQUESTER" },
    create: {
      name: "AT Other Requester",
      email: OTHER_REQUESTER_EMAIL,
      passwordHash: hash,
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    },
  });
  otherRequesterUserId = otherReqUser.id;

  const cat = await prisma.category.upsert({
    where: { name: "Software" },
    update: {},
    create: { name: "Software" },
  });

  const sys = await prisma.relatedSystem.upsert({
    where: { name: "Email" },
    update: { isActive: true },
    create: { name: "Email", isActive: true },
  });

  const ticket = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-AT-TEST-001" },
    update: { userId: requesterUserId },
    create: {
      ticketNumber: "TKT-AT-TEST-001",
      summary: "Actions Taken testing ticket",
      description: "Testing actions taken foundation APIs",
      requestedPriority: "MEDIUM",
      currentStatus: "OPEN",
      userId: requesterUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
    },
  });
  testTicketId = ticket.id;

  const otherTicket = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-AT-TEST-002" },
    update: { userId: otherRequesterUserId },
    create: {
      ticketNumber: "TKT-AT-TEST-002",
      summary: "Other requester ticket",
      description: "Testing ownership isolation for actions taken",
      requestedPriority: "LOW",
      currentStatus: "OPEN",
      userId: otherRequesterUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
    },
  });
  otherTicketId = otherTicket.id;

  const sLogin = await request(app).post("/api/auth/login").send({ email: STAFF_EMAIL, password: TEST_PASSWORD });
  staffCookie = sLogin.headers["set-cookie"];

  const rLogin = await request(app).post("/api/auth/login").send({ email: REQUESTER_EMAIL, password: TEST_PASSWORD });
  requesterCookie = rLogin.headers["set-cookie"];

  const oLogin = await request(app).post("/api/auth/login").send({ email: OTHER_REQUESTER_EMAIL, password: TEST_PASSWORD });
  otherRequesterCookie = oLogin.headers["set-cookie"];
});

afterAll(async () => {
  await prisma.actionTaken.deleteMany({ where: { ticketId: { in: [testTicketId, otherTicketId] } } });
});

describe("Lab 4 API: Actions Taken Foundation (Issue 2)", () => {
  let createdActionId: number;

  it("API-AT-01 (AC-01): IT Staff creates valid Action Taken with authenticated creator", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/actions`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Rebooted application services and cleared cache.",
        result: "Services returned to healthy operational state.",
        followUpRequired: false,
        attachmentNotes: "server_status.log",
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.ticketId).toBe(testTicketId);
    expect(res.body.performedById).toBe(staffUserId);
    expect(res.body.performedByName).toBe("AT Staff Tester");
    expect(res.body.actionDescription).toBe("Rebooted application services and cleared cache.");
    expect(res.body.result).toBe("Services returned to healthy operational state.");
    expect(res.body.followUpRequired).toBe(false);
    expect(res.body.version).toBe(1);

    createdActionId = res.body.id;
  });

  it("API-AT-02 (AC-02): Requester attempts POST to create Action Taken returns 403 Forbidden", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/actions`)
      .set("Cookie", requesterCookie)
      .send({
        actionDescription: "Requester trying to record action.",
        result: "Should be forbidden.",
      });

    expect(res.status).toBe(403);
  });

  it("API-AT-03 (AC-03): Create Action Taken with followUpRequired=true and empty followUpNote returns 400", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/actions`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Applied temporary patch.",
        result: "Temporary fix applied.",
        followUpRequired: true,
        followUpNote: "", // empty note
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("VALIDATION_FAILED");
    expect(res.body.field).toBe("followUpNote");
  });

  it("API-AT-04 (AC-01): Create Action Taken with followUpRequired=true and valid followUpNote succeeds", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/actions`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Applied temporary patch.",
        result: "Temporary fix applied.",
        followUpRequired: true,
        followUpNote: "Deploy permanent fix on next sprint maintenance window.",
      });

    expect(res.status).toBe(201);
    expect(res.body.followUpRequired).toBe(true);
    expect(res.body.followUpNote).toBe("Deploy permanent fix on next sprint maintenance window.");
  });

  it("API-AT-05: GET /api/tickets/:id/actions returns list of actions for permitted user", async () => {
    const res = await request(app)
      .get(`/api/tickets/${testTicketId}/actions`)
      .set("Cookie", staffCookie);

    expect(res.status).toBe(200);
    expect(res.body.ticketId).toBe(testTicketId);
    expect(Array.isArray(res.body.actions)).toBe(true);
    expect(res.body.actions.length).toBeGreaterThanOrEqual(2);
    expect(res.body.actions[0].performedByName).toBeDefined();
  });

  it("API-AT-06: Unauthenticated request to Actions endpoints returns 401 Unauthorized", async () => {
    const getRes = await request(app).get(`/api/tickets/${testTicketId}/actions`);
    expect(getRes.status).toBe(401);

    const postRes = await request(app)
      .post(`/api/tickets/${testTicketId}/actions`)
      .send({ actionDescription: "No auth", result: "Fail" });
    expect(postRes.status).toBe(401);
  });

  it("API-AT-07: IT Staff updates an existing Action Taken with correct version", async () => {
    const res = await request(app)
      .put(`/api/tickets/${testTicketId}/actions/${createdActionId}`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Rebooted application services and verified logs thoroughly.",
        result: "Fully resolved without pending errors.",
        version: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.actionDescription).toBe("Rebooted application services and verified logs thoroughly.");
    expect(res.body.version).toBe(2);
  });

  it("API-AT-08 (AC-07): Concurrent update with stale version returns 409 Conflict", async () => {
    // Current version is now 2, but client provides version 1
    const res = await request(app)
      .put(`/api/tickets/${testTicketId}/actions/${createdActionId}`)
      .set("Cookie", staffCookie)
      .send({
        actionDescription: "Stale update attempt.",
        result: "Should fail with conflict.",
        version: 1,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("conflict");
  });

  it("API-AT-09: Client supplying different performedById in body is ignored and uses authenticated user", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/actions`)
      .set("Cookie", staffCookie)
      .send({
        performedById: 999999, // spoof attempt
        actionDescription: "Security check.",
        result: "Actor identity preserved.",
        followUpRequired: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.performedById).toBe(staffUserId); // must match authenticated user
  });

  it("API-AT-10: Requester cannot view actions on a ticket they do not own", async () => {
    // testTicketId belongs to requesterUserId
    // otherRequesterCookie belongs to otherRequesterUserId
    const res = await request(app)
      .get(`/api/tickets/${testTicketId}/actions`)
      .set("Cookie", otherRequesterCookie);

    expect(res.status).toBe(403);
  });
});
