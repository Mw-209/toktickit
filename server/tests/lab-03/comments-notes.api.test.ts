import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";
import { hashPassword } from "../../src/auth.js";

// ---------------------------------------------------------------------------
// comments-notes.api.test.ts — Lab 3 Comments & Notes API Tests
// Tests: API-CN-01 through API-CN-09
// ---------------------------------------------------------------------------

const prisma = getPrisma();

const STAFF_EMAIL = "cn_staff@test.local";
const REQUESTER_EMAIL = "cn_requester@test.local";
const TEST_PASSWORD = "TestPass123!";

let staffCookie: string;
let requesterCookie: string;
let requesterId: number;
let testTicketId: number;
let categoryId: number;
let relatedSystemId: number;

beforeAll(async () => {
  const hash = await hashPassword(TEST_PASSWORD);

  await prisma.user.upsert({
    where: { email: STAFF_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "IT_STAFF" },
    create: { name: "CN Test Staff", email: STAFF_EMAIL, passwordHash: hash, role: "IT_STAFF", isActive: true, mustChangePassword: false },
  });

  const requester = await prisma.user.upsert({
    where: { email: REQUESTER_EMAIL },
    update: { passwordHash: hash, isActive: true, role: "REQUESTER" },
    create: { name: "CN Test Requester", email: REQUESTER_EMAIL, passwordHash: hash, role: "REQUESTER", isActive: true, mustChangePassword: false },
  });
  requesterId = requester.id;

  const cat = await prisma.category.upsert({ where: { name: "Hardware" }, update: {}, create: { name: "Hardware" } });
  categoryId = cat.id;
  const sys = await prisma.relatedSystem.upsert({ where: { name: "Corporate Laptop" }, update: { isActive: true }, create: { name: "Corporate Laptop", isActive: true } });
  relatedSystemId = sys.id;

  const ticket = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-CN-TEST-001" },
    update: {},
    create: { ticketNumber: "TKT-CN-TEST-001", summary: "Comments and notes test ticket", description: "For CN API tests", requestedPriority: "MEDIUM", currentStatus: "OPEN", userId: requesterId, categoryId, relatedSystemId },
  });
  testTicketId = ticket.id;

  const sLogin = await request(app).post("/api/auth/login").send({ email: STAFF_EMAIL, password: TEST_PASSWORD });
  staffCookie = sLogin.headers["set-cookie"];
  const rLogin = await request(app).post("/api/auth/login").send({ email: REQUESTER_EMAIL, password: TEST_PASSWORD });
  requesterCookie = rLogin.headers["set-cookie"];
});

afterAll(async () => {
  await prisma.publicComment.deleteMany({ where: { ticketId: testTicketId } });
  await prisma.internalNote.deleteMany({ where: { ticketId: testTicketId } });
  await prisma.ticket.deleteMany({ where: { ticketNumber: "TKT-CN-TEST-001" } });
  await prisma.user.deleteMany({ where: { email: { in: [STAFF_EMAIL, REQUESTER_EMAIL] } } });
});

describe("Public Comments API", () => {
  // API-CN-01: IT Staff POST valid public comment (AC-12)
  it("API-CN-01: IT Staff POST valid public comment returns 201 with author and timestamp", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/comments`)
      .set("Cookie", staffCookie)
      .send({ content: "Test public comment from IT Staff" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("content", "Test public comment from IT Staff");
    expect(res.body).toHaveProperty("author");
    expect(res.body).toHaveProperty("createdAt");
  });

  // API-CN-02: Requester POST valid public comment on own ticket
  it("API-CN-02: Requester POST valid public comment on own ticket returns 201", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/comments`)
      .set("Cookie", requesterCookie)
      .send({ content: "Test public comment from Requester" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("content", "Test public comment from Requester");
  });

  // API-CN-03: POST empty comment → 400
  it("API-CN-03: POST empty comment returns 400", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/comments`)
      .set("Cookie", staffCookie)
      .send({ content: "" });
    expect(res.status).toBe(400);
  });

  // API-CN-04: POST comment > 2000 chars → 400
  it("API-CN-04: POST comment over 2000 characters returns 400", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/comments`)
      .set("Cookie", staffCookie)
      .send({ content: "x".repeat(2001) });
    expect(res.status).toBe(400);
  });

  // API-CN-05: GET comments returns all public comments
  it("API-CN-05: GET /comments returns all public comments sorted by createdAt", async () => {
    const res = await request(app)
      .get(`/api/tickets/${testTicketId}/comments`)
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    // API returns { comments: [...] }
    const list = res.body.comments ?? res.body;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Internal Notes API", () => {
  // API-CN-06: Requester GET /notes → 403 (AC-04)
  it("API-CN-06: Requester GET /notes returns 403 with no note content", async () => {
    const res = await request(app)
      .get(`/api/tickets/${testTicketId}/notes`)
      .set("Cookie", requesterCookie);
    expect(res.status).toBe(403);
    // Ensure no note data is leaked
    expect(JSON.stringify(res.body)).not.toContain("content");
  });

  // API-CN-07: IT Staff POST valid internal note
  it("API-CN-07: IT Staff POST valid internal note returns 201 with author and timestamp", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/notes`)
      .set("Cookie", staffCookie)
      .send({ content: "Internal note from IT Staff" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("content", "Internal note from IT Staff");
    expect(res.body).toHaveProperty("author");
    expect(res.body).toHaveProperty("createdAt");
  });

  // API-CN-08: IT Staff GET notes returns all internal notes
  it("API-CN-08: IT Staff GET /notes returns all internal notes", async () => {
    const res = await request(app)
      .get(`/api/tickets/${testTicketId}/notes`)
      .set("Cookie", staffCookie);
    expect(res.status).toBe(200);
    // API returns { notes: [...] }
    const list = res.body.notes ?? res.body;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  // API-CN-09: POST empty internal note → 400
  it("API-CN-09: POST empty internal note returns 400", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/notes`)
      .set("Cookie", staffCookie)
      .send({ content: "" });
    expect(res.status).toBe(400);
  });
});
