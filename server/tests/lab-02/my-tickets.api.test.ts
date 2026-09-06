import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 2 API: My Tickets Listing & Ownership Isolation", () => {
  let requesterA: any;
  let requesterB: any;

  beforeAll(async () => {
    const prisma = getPrisma();
    requesterA = await prisma.requesterUser.findUnique({ where: { email: "jennifer.anderson@example.edu" } });
    requesterB = await prisma.requesterUser.findUnique({ where: { email: "david.lee@example.edu" } });
  });

  it("API-04: GET /api/tickets returns only tickets owned by current requester", async () => {
    const resA = await request(app).get(`/api/tickets?requesterId=${requesterA.id}`);
    expect(resA.status).toBe(200);
    expect(Array.isArray(resA.body.items)).toBe(true);
    expect(resA.body.items.length).toBeGreaterThan(0);

    // Verify items are formatted correctly
    resA.body.items.forEach((item: any) => {
      expect(item.ticketNumber).toBeDefined();
    });

    const resB = await request(app).get(`/api/tickets?requesterId=${requesterB.id}`);
    expect(resB.status).toBe(200);
    expect(Array.isArray(resB.body.items)).toBe(true);
    expect(resB.body.items.length).toBeGreaterThan(0);
    
    // Ensure that A's tickets and B's tickets are isolated
    const aTicketNumbers = resA.body.items.map((i: any) => i.ticketNumber);
    const bTicketNumbers = resB.body.items.map((i: any) => i.ticketNumber);
    
    aTicketNumbers.forEach((tkt: string) => {
      expect(bTicketNumbers).not.toContain(tkt);
    });
  });

  it("API-05: GET /api/tickets filters correctly by search query", async () => {
    const res = await request(app).get(`/api/tickets?requesterId=${requesterA.id}&search=battery`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].summary).toContain("battery");

    const resEmpty = await request(app).get(`/api/tickets?requesterId=${requesterA.id}&search=NonExistentTermXYZ`);
    expect(resEmpty.status).toBe(200);
    expect(resEmpty.body.items.length).toBe(0);
    expect(resEmpty.body.pagination.totalItems).toBe(0);
  });

  it("GET /api/tickets requires requesterId parameter", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("MISSING_REQUESTER");
  });
});
