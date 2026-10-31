import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth.js";

// ---------------------------------------------------------------------------
// requester-dashboard.api.test.ts — Lab 4 Requester Dashboard API Tests (Issue 5)
// Tests: API-RD-01 through API-RD-05
// ---------------------------------------------------------------------------

const prisma = getPrisma();

const REQ_A_EMAIL = "rd_requester_a@test.local";
const REQ_B_EMAIL = "rd_requester_b@test.local";
const STAFF_EMAIL = "rd_staff@test.local";
const TEST_PASSWORD = "Password123!";

let reqACookie: string;
let reqBCookie: string;
let staffCookie: string;

let reqAUserId: number;
let reqBUserId: number;

beforeAll(async () => {
  const hash = await hashPassword(TEST_PASSWORD);

  const reqA = await prisma.user.upsert({
    where: { email: REQ_A_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "REQUESTER" },
    create: {
      name: "RD Requester A",
      email: REQ_A_EMAIL,
      passwordHash: hash,
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    },
  });
  reqAUserId = reqA.id;

  const reqB = await prisma.user.upsert({
    where: { email: REQ_B_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "REQUESTER" },
    create: {
      name: "RD Requester B",
      email: REQ_B_EMAIL,
      passwordHash: hash,
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    },
  });
  reqBUserId = reqB.id;

  await prisma.user.upsert({
    where: { email: STAFF_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "IT_STAFF" },
    create: {
      name: "RD Staff User",
      email: STAFF_EMAIL,
      passwordHash: hash,
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
    },
  });

  // Login cookies
  const resLoginA = await request(app)
    .post("/api/auth/login")
    .send({ email: REQ_A_EMAIL, password: TEST_PASSWORD });
  reqACookie = resLoginA.headers["set-cookie"]?.[0] || "";

  const resLoginB = await request(app)
    .post("/api/auth/login")
    .send({ email: REQ_B_EMAIL, password: TEST_PASSWORD });
  reqBCookie = resLoginB.headers["set-cookie"]?.[0] || "";

  const resLoginStaff = await request(app)
    .post("/api/auth/login")
    .send({ email: STAFF_EMAIL, password: TEST_PASSWORD });
  staffCookie = resLoginStaff.headers["set-cookie"]?.[0] || "";

  // Get or create category & related system
  const cat = await prisma.category.findFirst() || await prisma.category.create({
    data: { name: "RD Category" },
  });
  const sys = await prisma.relatedSystem.findFirst() || await prisma.relatedSystem.create({
    data: { name: "RD System", isActive: true },
  });

  // Clean previous test tickets
  await prisma.ticket.deleteMany({
    where: { ticketNumber: { startsWith: "TKT-RD-" } },
  });

  // Seed tickets for Requester A
  // 1 OPEN ticket
  await prisma.ticket.create({
    data: {
      ticketNumber: "TKT-RD-001",
      summary: "Req A Open Ticket",
      description: "Description 1",
      currentStatus: "OPEN",
      userId: reqAUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
    },
  });

  // 1 WAITING_FOR_REQUESTER ticket
  await prisma.ticket.create({
    data: {
      ticketNumber: "TKT-RD-002",
      summary: "Req A Waiting Ticket",
      description: "Description 2",
      currentStatus: "WAITING_FOR_REQUESTER",
      userId: reqAUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
    },
  });

  // 1 RESOLVED ticket (recently resolved)
  await prisma.ticket.create({
    data: {
      ticketNumber: "TKT-RD-003",
      summary: "Req A Resolved Ticket",
      description: "Description 3",
      currentStatus: "RESOLVED",
      userId: reqAUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
    },
  });

  // Seed ticket for Requester B: 1 IN_PROGRESS ticket
  await prisma.ticket.create({
    data: {
      ticketNumber: "TKT-RD-004",
      summary: "Req B InProgress Ticket",
      description: "Description 4",
      currentStatus: "IN_PROGRESS",
      userId: reqBUserId,
      categoryId: cat.id,
      relatedSystemId: sys.id,
    },
  });
});

afterAll(async () => {
  await prisma.ticket.deleteMany({
    where: { ticketNumber: { startsWith: "TKT-RD-" } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: [REQ_A_EMAIL, REQ_B_EMAIL, STAFF_EMAIL] } },
  });
});

describe("Lab 4 API: Requester Dashboard (Issue 5)", () => {
  // API-RD-01: Requester gets their own dashboard
  it("API-RD-01: Requester gets their own dashboard with 200 OK and metrics", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", reqACookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalOpenTickets");
    expect(res.body).toHaveProperty("waitingForRequester");
    expect(res.body).toHaveProperty("recentlyUpdated");
    expect(res.body).toHaveProperty("recentlyResolved");

    // Open tickets: OPEN + WAITING_FOR_REQUESTER = at least 2
    expect(res.body.totalOpenTickets).toBeGreaterThanOrEqual(2);
    expect(res.body.waitingForRequester).toBeGreaterThanOrEqual(1);
    expect(res.body.recentlyResolved).toBeGreaterThanOrEqual(1);
  });

  // API-RD-02: Requester A cannot see Requester B's data
  it("API-RD-02: Requester A cannot see Requester B's data (isolated metrics)", async () => {
    const resA = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", reqACookie);

    const resB = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", reqBCookie);

    expect(resA.status).toBe(200);
    expect(resB.status).toBe(200);

    // Requester B has 0 waiting for requester, 0 resolved
    expect(resB.body.waitingForRequester).toBe(0);
    expect(resB.body.recentlyResolved).toBe(0);
    expect(resB.body.totalOpenTickets).toBe(1); // Only their 1 IN_PROGRESS ticket
  });

  // API-RD-03: IT Staff attempts to access requester dashboard endpoint
  it("API-RD-03: IT Staff attempts to access requester dashboard endpoint returns 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", staffCookie);

    expect(res.status).toBe(403);
  });

  // API-RD-04: Unauthenticated access to requester dashboard
  it("API-RD-04: Unauthenticated access returns 401 Unauthorized", async () => {
    const res = await request(app).get("/api/dashboard/requester");
    expect(res.status).toBe(401);
  });

  // API-RD-05: Requester dashboard with zero open Tickets returns 0, not null
  it("API-RD-05: Requester with zero open tickets returns 0, not null", async () => {
    // Delete Req B's tickets to test zero counts
    await prisma.ticket.deleteMany({
      where: { userId: reqBUserId },
    });

    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Cookie", reqBCookie);

    expect(res.status).toBe(200);
    expect(res.body.totalOpenTickets).toBe(0);
    expect(res.body.totalOpen).toBe(0);
    expect(res.body.waitingForRequester).toBe(0);
    expect(res.body.recentlyResolved).toBe(0);
    expect(res.body.recentlyUpdated).toBe(0);
  });
});
