import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 2 API: Ticket Detail Access Control", () => {
  let requesterA: any;
  let requesterB: any;
  let ticketA: any;

  beforeAll(async () => {
    const prisma = getPrisma();
    requesterA = await prisma.requesterUser.findUnique({ where: { email: "jennifer.anderson@example.edu" } });
    requesterB = await prisma.requesterUser.findUnique({ where: { email: "david.lee@example.edu" } });
    ticketA = await prisma.ticket.findFirst({ where: { requesterId: requesterA.id } });
  });

  it("API-06: Authorized requester can view owned ticket detail", async () => {
    const res = await request(app).get(`/api/tickets/${ticketA.id}?requesterId=${requesterA.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ticketA.id);
    expect(res.body.ticketNumber).toBe(ticketA.ticketNumber);
    expect(res.body.requester.id).toBe(requesterA.id);
    expect(res.body.category).toBeDefined();
    expect(res.body.relatedSystem).toBeDefined();
    expect(Array.isArray(res.body.attachments)).toBe(true);
  });

  it("API-06 (AC-04): Requester B is forbidden from accessing Requester A's ticket", async () => {
    const res = await request(app).get(`/api/tickets/${ticketA.id}?requesterId=${requesterB.id}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.summary).toBeUndefined(); // Guarantees no ticket details leaked
  });

  it("Returns 404 for nonexistent ticket ID", async () => {
    const res = await request(app).get(`/api/tickets/999999?requesterId=${requesterA.id}`);
    expect(res.status).toBe(404);
  });
});
