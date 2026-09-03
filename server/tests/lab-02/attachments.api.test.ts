import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs";
import app from "../../src/app.js";
import { getPrisma } from "../../src/prisma.js";

describe("Lab 2 API: Attachment Management & Soft Removal", () => {
  let requesterA: any;
  let ticketA: any;
  let sampleFilePath: string;

  beforeAll(async () => {
    const prisma = getPrisma();
    requesterA = await prisma.requesterUser.findUnique({ where: { email: "jennifer.anderson@example.edu" } });
    ticketA = await prisma.ticket.findFirst({ where: { requesterId: requesterA.id } });

    // Create a mock image file for upload testing
    sampleFilePath = path.resolve(process.cwd(), "test_evidence.png");
    fs.writeFileSync(sampleFilePath, Buffer.from("dummy PNG file content for testing"));
  });

  it("Uploads a permitted attachment to an owned ticket", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketA.id}/attachments?requesterId=${requesterA.id}`)
      .attach("file", sampleFilePath);

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.originalName).toBe("test_evidence.png");
    expect(res.body.isRemoved).toBe(false);
  });

  it("API-08 (AC-08, BR-11): Soft-removes attachment with mandatory removal reason", async () => {
    const prisma = getPrisma();
    const attachment = await prisma.attachment.findFirst({
      where: { ticketId: ticketA.id, isRemoved: false },
    });
    expect(attachment).toBeDefined();

    // 1. Rejects if removalReason is missing or too short
    const failRes = await request(app)
      .delete(`/api/tickets/${ticketA.id}/attachments/${attachment!.id}?requesterId=${requesterA.id}`)
      .send({ removalReason: "no" }); // 2 chars
    expect(failRes.status).toBe(400);

    // 2. Succeeds with valid reason
    const okRes = await request(app)
      .delete(`/api/tickets/${ticketA.id}/attachments/${attachment!.id}?requesterId=${requesterA.id}`)
      .send({ removalReason: "Uploaded wrong log file by mistake." });

    expect(okRes.status).toBe(200);
    expect(okRes.body.isRemoved).toBe(true);
    expect(okRes.body.removalReason).toBe("Uploaded wrong log file by mistake.");
    expect(okRes.body.removedAt).toBeDefined();

    // 3. API-09 (BR-12): Verify downloading removed file returns 410 Gone
    const downloadRes = await request(app)
      .get(`/api/attachments/${attachment!.id}/download?requesterId=${requesterA.id}`);
    expect(downloadRes.status).toBe(410);
    expect(downloadRes.body.error.code).toBe("FILE_REMOVED");
  });
});
