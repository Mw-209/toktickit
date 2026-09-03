import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 2 API: Ticket Creation & Reference Data", () => {
  let activeRequesterId: number;
  let categoryId: number;
  let relatedSystemId: number;

  beforeAll(async () => {
    const prisma = getPrisma();
    const requester = await prisma.requesterUser.findFirst({ where: { isActive: true } });
    const category = await prisma.category.findFirst();
    const system = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    if (!requester || !category || !system) {
      throw new Error("Seed data missing for tests");
    }

    activeRequesterId = requester.id;
    categoryId = category.id;
    relatedSystemId = system.id;
  });

  it("API-10: GET /api/requesters returns only active requesters", async () => {
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4);
    // Ensure inactive requester is NOT present
    const inactive = res.body.find((r: any) => r.isActive === false);
    expect(inactive).toBeUndefined();
  });

  it("API-01: POST /api/tickets creates valid ticket with unique Ticket Number", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({
        requesterId: activeRequesterId,
        categoryId,
        relatedSystemId,
        requestedPriority: "HIGH",
        summary: "Cannot access grading portal",
        description: "Whenever I click submit grade, the page hangs and returns 504 gateway timeout.",
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.currentStatus).toBe("NEW"); // BR-02
    expect(res.body.summary).toBe("Cannot access grading portal");
    expect(res.body.requesterId).toBe(activeRequesterId);
  });

  it("API-02: POST /api/tickets rejects summary shorter than 5 chars", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({
        requesterId: activeRequesterId,
        categoryId,
        relatedSystemId,
        requestedPriority: "LOW",
        summary: "Fail", // 4 chars
        description: "This description is sufficiently long to pass the length rule.",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    const summaryError = res.body.error.details.find((d: any) => d.field === "summary");
    expect(summaryError).toBeDefined();
  });

  it("API-02: POST /api/tickets rejects description shorter than 10 chars", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({
        requesterId: activeRequesterId,
        categoryId,
        relatedSystemId,
        summary: "Valid summary line",
        description: "Short", // < 10 chars
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    const descError = res.body.error.details.find((d: any) => d.field === "description");
    expect(descError).toBeDefined();
  });
});
