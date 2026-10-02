import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth.js";

// ---------------------------------------------------------------------------
// staff-queue.api.test.ts — Lab 3 IT Staff Queue API Tests
// Tests: API-QUEUE-01 through API-QUEUE-09
// ---------------------------------------------------------------------------

const prisma = getPrisma();

const STAFF_EMAIL = "queue_staff@test.local";
const REQUESTER_EMAIL = "queue_requester@test.local";
const TEST_PASSWORD = "TestPass123!";

let staffCookie: string;
let requesterId: number;
let categoryId: number;
let relatedSystemId: number;

beforeAll(async () => {
  const hash = await hashPassword(TEST_PASSWORD);

  const requester = await prisma.user.upsert({
    where: { email: REQUESTER_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "REQUESTER" },
    create: {
      name: "Queue Test Requester",
      email: REQUESTER_EMAIL,
      passwordHash: hash,
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    },
  });
  requesterId = requester.id;

  await prisma.user.upsert({
    where: { email: STAFF_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "IT_STAFF" },
    create: {
      name: "Queue Test Staff",
      email: STAFF_EMAIL,
      passwordHash: hash,
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
    },
  });

  // Ensure category and system exist
  const cat = await prisma.category.upsert({
    where: { name: "Hardware" },
    update: {},
    create: { name: "Hardware" },
  });
  categoryId = cat.id;

  const sys = await prisma.relatedSystem.upsert({
    where: { name: "Corporate Laptop" },
    update: { isActive: true },
    create: { name: "Corporate Laptop", isActive: true },
  });
  relatedSystemId = sys.id;

  // Seed test tickets
  await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-QUEUE-TEST-001" },
    update: {},
    create: {
      ticketNumber: "TKT-QUEUE-TEST-001",
      summary: "Queue API test ticket battery issue",
      description: "Test description for queue search",
      requestedPriority: "HIGH",
      currentStatus: "NEW",
      userId: requesterId,
      categoryId,
      relatedSystemId,
    },
  });

  await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-QUEUE-TEST-002" },
    update: {},
    create: {
      ticketNumber: "TKT-QUEUE-TEST-002",
      summary: "Queue API test ticket in progress",
      description: "Test description for status filter",
      requestedPriority: "MEDIUM",
      currentStatus: "IN_PROGRESS",
      userId: requesterId,
      categoryId,
      relatedSystemId,
    },
  });

  // Login staff
  const sLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: STAFF_EMAIL, password: TEST_PASSWORD });
  staffCookie = sLogin.headers["set-cookie"];
});

afterAll(async () => {
  await prisma.ticket.deleteMany({
    where: { ticketNumber: { in: ["TKT-QUEUE-TEST-001", "TKT-QUEUE-TEST-002"] } },
  });
  await prisma.user.deleteMany({
    where: { email: { in: [STAFF_EMAIL, REQUESTER_EMAIL] } },
  });
});

// ---------------------------------------------------------------------------
// API-QUEUE-01: Returns paginated list
// ---------------------------------------------------------------------------
describe("IT Staff Ticket Queue", () => {
  it("API-QUEUE-01: GET /api/staff/tickets returns paginated list with tickets array and pagination", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("tickets");
    expect(res.body).toHaveProperty("pagination");
    expect(res.body.pagination).toHaveProperty("total");
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });

  // API-QUEUE-02: Search by ticket number fragment
  it("API-QUEUE-02: search by ticket number fragment returns matching tickets", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?search=TKT-QUEUE-TEST-001")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    expect(res.body.tickets.length).toBeGreaterThanOrEqual(1);
    expect(res.body.tickets[0].ticketNumber).toContain("TKT-QUEUE-TEST-001");
  });

  // API-QUEUE-03: Search by summary keyword
  it("API-QUEUE-03: search by summary keyword returns matching tickets", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?search=battery")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    expect(res.body.tickets.length).toBeGreaterThanOrEqual(1);
    const summaries = res.body.tickets.map((t: any) => t.summary.toLowerCase());
    expect(summaries.some((s: string) => s.includes("battery"))).toBe(true);
  });

  // API-QUEUE-04: Filter by status=IN_PROGRESS
  it("API-QUEUE-04: filter by status=IN_PROGRESS returns only IN_PROGRESS tickets", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?status=IN_PROGRESS")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    const statuses = res.body.tickets.map((t: any) => t.currentStatus);
    expect(statuses.every((s: string) => s === "IN_PROGRESS")).toBe(true);
  });

  // API-QUEUE-05: Filter by itPriority=HIGH
  it("API-QUEUE-05: filter by itPriority=HIGH returns only HIGH priority tickets", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?itPriority=HIGH")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    // Each ticket returned should have itPriority=HIGH (if any)
    if (res.body.tickets.length > 0) {
      const priorities = res.body.tickets.map((t: any) => t.itPriority);
      expect(priorities.every((p: string) => p === "HIGH")).toBe(true);
    }
  });

  // API-QUEUE-06: Filter by assignedToId=0 (unassigned)
  it("API-QUEUE-06: filter by assignedToId=0 returns only unassigned tickets", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?assignedToId=0")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    const owners = res.body.tickets.map((t: any) => t.assignedTo);
    expect(owners.every((o: any) => o === null)).toBe(true);
  });

  // API-QUEUE-07: Sort by createdAt asc
  it("API-QUEUE-07: sort by createdAt asc returns oldest ticket first", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?sortBy=createdAt&sortOrder=asc")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    if (res.body.tickets.length >= 2) {
      const dates = res.body.tickets.map((t: any) => new Date(t.createdAt).getTime());
      expect(dates[0]).toBeLessThanOrEqual(dates[1]);
    }
  });

  // API-QUEUE-08: Pagination page=2 pageSize=1
  it("API-QUEUE-08: pagination query params are accepted and response includes pagination metadata", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?page=2&pageSize=1")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("pagination");
    // page=2 with pageSize=1 — pagination metadata should reflect the params
    expect(res.body.pagination).toHaveProperty("page");
  });

  // API-QUEUE-09: No matching tickets → empty results
  it("API-QUEUE-09: no matching search returns empty array with pagination.total=0", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?search=ZZZNOMATCH99999999")
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    expect(res.body.tickets).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });
});
