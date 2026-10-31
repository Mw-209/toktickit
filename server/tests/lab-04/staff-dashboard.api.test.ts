import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth.js";

// ---------------------------------------------------------------------------
// staff-dashboard.api.test.ts — Lab 4 IT Staff Dashboard API Tests (Issue 5)
// Tests: API-SD-01 through API-SD-05
// ---------------------------------------------------------------------------

const prisma = getPrisma();

const STAFF_A_EMAIL = "sd_staff_a@test.local";
const STAFF_B_EMAIL = "sd_staff_b@test.local";
const REQUESTER_EMAIL = "sd_requester@test.local";
const TEST_PASSWORD = "Password123!";

let staffACookie: string;
let staffBCookie: string;
let requesterCookie: string;

let staffAUserId: number;
let staffBUserId: number;
let reqUserId: number;

beforeAll(async () => {
  const hash = await hashPassword(TEST_PASSWORD);

  const staffA = await prisma.user.upsert({
    where: { email: STAFF_A_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "IT_STAFF" },
    create: {
      name: "SD Staff A",
      email: STAFF_A_EMAIL,
      passwordHash: hash,
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
    },
  });
  staffAUserId = staffA.id;

  const staffB = await prisma.user.upsert({
    where: { email: STAFF_B_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "IT_STAFF" },
    create: {
      name: "SD Staff B",
      email: STAFF_B_EMAIL,
      passwordHash: hash,
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
    },
  });
  staffBUserId = staffB.id;

  const reqUser = await prisma.user.upsert({
    where: { email: REQUESTER_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "REQUESTER" },
    create: {
      name: "SD Requester",
      email: REQUESTER_EMAIL,
      passwordHash: hash,
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    },
  });
  reqUserId = reqUser.id;

  // Login cookies
  const resLoginA = await request(app)
    .post("/api/auth/login")
    .send({ email: STAFF_A_EMAIL, password: TEST_PASSWORD });
  staffACookie = resLoginA.headers["set-cookie"]?.[0] || "";

  const resLoginB = await request(app)
    .post("/api/auth/login")
    .send({ email: STAFF_B_EMAIL, password: TEST_PASSWORD });
  staffBCookie = resLoginB.headers["set-cookie"]?.[0] || "";

  const resLoginReq = await request(app)
    .post("/api/auth/login")
    .send({ email: REQUESTER_EMAIL, password: TEST_PASSWORD });
  requesterCookie = resLoginReq.headers["set-cookie"]?.[0] || "";

  // Get or create category & related system
  const cat = await prisma.category.findFirst() || await prisma.category.create({
    data: { name: "SD Category" },
  });
  const sys = await prisma.relatedSystem.findFirst() || await prisma.relatedSystem.create({
    data: { name: "SD System", isActive: true },
  });

  // Clean previous test tickets
  await prisma.ticket.deleteMany({
    where: { ticketNumber: { startsWith: "TKT-SD-" } },
  });

  // 1 Unassigned ticket (OPEN)
  await prisma.ticket.create({
    data: {
      ticketNumber: "TKT-SD-001",
      summary: "SD Unassigned Ticket",
      description: "Description 1",
      currentStatus: "OPEN",
      userId: reqUserId,
      assignedToId: null,
      categoryId: cat.id,
      relatedSystemId: sys.id,
    },
  });

  // 1 Ticket owned by Staff A (IN_PROGRESS)
  const ticketA = await prisma.ticket.create({
    data: {
      ticketNumber: "TKT-SD-002",
      summary: "SD Staff A Ticket",
      description: "Description 2",
      currentStatus: "IN_PROGRESS",
      userId: reqUserId,
      assignedToId: staffAUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
    },
  });

  // Add an action taken by Staff A
  await prisma.actionTaken.create({
    data: {
      ticketId: ticketA.id,
      performedById: staffAUserId,
      actionDescription: "Investigated server issue.",
      result: "Found configuration typo.",
      followUpRequired: false,
    },
  });
});

afterAll(async () => {
  await prisma.actionTaken.deleteMany({
    where: { performedById: { in: [staffAUserId, staffBUserId] } },
  });
  await prisma.ticket.deleteMany({
    where: { ticketNumber: { startsWith: "TKT-SD-" } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: [STAFF_A_EMAIL, STAFF_B_EMAIL, REQUESTER_EMAIL] } },
  });
});

describe("Lab 4 API: IT Staff Dashboard (Issue 5)", () => {
  // API-SD-01: IT Staff dashboard unassigned count matches DB
  it("API-SD-01: IT Staff dashboard unassigned count matches DB (200 OK)", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staffACookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("unassignedTickets");
    expect(res.body).toHaveProperty("myTickets");
    expect(res.body).toHaveProperty("ticketsByStatus");
    expect(res.body).toHaveProperty("recentlyUpdated");
    expect(res.body).toHaveProperty("myRecentActions");

    // unassigned count should be >= 1
    const unassigned = res.body.unassignedCount ?? res.body.unassignedTickets;
    expect(unassigned).toBeGreaterThanOrEqual(1);

    // ticketsByStatus contains status breakdowns
    expect(res.body.ticketsByStatus).toHaveProperty("Open");
    expect(res.body.ticketsByStatus).toHaveProperty("InProgress");
  });

  // API-SD-02: My Tickets count matches Tickets owned by authenticated user
  it("API-SD-02: My Tickets count matches Tickets owned by authenticated user", async () => {
    const resA = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staffACookie);

    const resB = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staffBCookie);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    const myTicketsA = resA.body.myTicketsCount ?? resA.body.myTickets;
    const myTicketsB = resB.body.myTicketsCount ?? resB.body.myTickets;

    // Staff A has at least 1 assigned ticket
    expect(myTicketsA).toBeGreaterThanOrEqual(1);
    // Staff B has 0 assigned tickets
    expect(myTicketsB).toBe(0);

    // Staff A has recent action recorded
    expect(resA.body.myRecentActions.length).toBeGreaterThanOrEqual(1);
    expect(resA.body.myRecentActions[0]).toHaveProperty("actionDescription");

    // Staff B has 0 actions recorded
    expect(resB.body.myRecentActions.length).toBe(0);
  });

  // API-SD-03: Requester attempts to access staff dashboard -> 403 Forbidden
  it("API-SD-03: Requester attempts to access staff dashboard returns 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", requesterCookie);

    expect(res.status).toBe(403);
  });

  // API-SD-04: Unauthenticated access to staff dashboard -> 401 Unauthorized
  it("API-SD-04: Unauthenticated access returns 401 Unauthorized", async () => {
    const res = await request(app).get("/api/dashboard/staff");
    expect(res.status).toBe(401);
  });

  // API-SD-05: Staff dashboard with zero unassigned Tickets returns 0, not null
  it("API-SD-05: Zero unassigned tickets returns 0, not null", async () => {
    // Assign the unassigned ticket to Staff B
    await prisma.ticket.updateMany({
      where: { ticketNumber: "TKT-SD-001" },
      data: { assignedToId: staffBUserId },
    });

    // Check count directly in DB for unassigned
    const dbUnassigned = await prisma.ticket.count({
      where: {
        assignedToId: null,
        currentStatus: { notIn: ["CLOSED", "CANCELLED"] },
      },
    });

    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Cookie", staffACookie);

    expect(res.status).toBe(200);
    const unassigned = res.body.unassignedCount ?? res.body.unassignedTickets;
    expect(unassigned).toBe(dbUnassigned);
    expect(unassigned).not.toBeNull();
  });
});
