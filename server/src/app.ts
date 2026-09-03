import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { getPrisma } from "./prisma.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "attachments");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Allowed attachment constraints (Section 4.5)
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ACTIVE_ATTACHMENTS = 5;

// Configure Multer for disk storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("INVALID_FILE_TYPE"));
      return;
    }
    cb(null, true);
  },
});

// Helper: generate unique Ticket Number (BR-01, e.g. TKT-2026-000001)
async function generateTicketNumber(): Promise<string> {
  const prisma = getPrisma();
  const currentYear = new Date().getFullYear();
  const yearPrefix = `TKT-${currentYear}-`;

  const latestTicket = await prisma.ticket.findFirst({
    where: { ticketNumber: { startsWith: yearPrefix } },
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });

  let nextSeq = 1;
  if (latestTicket) {
    const parts = latestTicket.ticketNumber.split("-");
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }

  const paddedSeq = String(nextSeq).padStart(6, "0");
  return `${yearPrefix}${paddedSeq}`;
}

// ---------------------------------------------------------------------------
// 1. Health & Reference Data Endpoints
// ---------------------------------------------------------------------------

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const systems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      select: { id: true, name: true, isActive: true },
      orderBy: { id: "asc" },
    });
    res.status(200).json(systems);
  } catch (error) {
    console.error("Failed to fetch related systems:", error);
    res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    // BR-03: Inactive requesters must not appear in the selector
    const requesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, isActive: true },
      orderBy: { id: "asc" },
    });
    res.status(200).json(requesters);
  } catch (error) {
    console.error("Failed to fetch requesters:", error);
    res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// ---------------------------------------------------------------------------
// 2. Ticket Endpoints
// ---------------------------------------------------------------------------

// POST /api/tickets: Create a new ticket (AC-01, BR-01, BR-02, BR-05, BR-06, BR-07)
app.post(
  "/api/tickets",
  (req: Request, res: Response, next) => {
    upload.array("files", MAX_ACTIVE_ATTACHMENTS)(req, res, (err) => {
      if (err) {
        if (err.message === "INVALID_FILE_TYPE") {
          return res.status(400).json({
            error: {
              code: "INVALID_FILE_TYPE",
              message: "Permitted file types: JPG, PNG, WEBP, and PDF only.",
            },
          });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: {
              code: "FILE_TOO_LARGE",
              message: "Each attachment file must not exceed 5 MB.",
            },
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            error: {
              code: "TOO_MANY_FILES",
              message: `A ticket can have a maximum of ${MAX_ACTIVE_ATTACHMENTS} attachments.`,
            },
          });
        }
        return res.status(400).json({ error: { message: err.message } });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();
      const {
        requesterId,
        categoryId,
        relatedSystemId,
        requestedPriority = "MEDIUM",
        summary,
        description,
      } = req.body;

      const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
      const trimmedDescription = typeof description === "string" ? description.trim() : "";
      const reqId = parseInt(requesterId, 10);
      const catId = parseInt(categoryId, 10);
      const sysId = parseInt(relatedSystemId, 10);

      // Validation
      const errors: { field: string; issue: string }[] = [];
      if (!reqId || isNaN(reqId)) {
        errors.push({ field: "requesterId", issue: "Valid Development Requester is required." });
      }
      if (!catId || isNaN(catId)) {
        errors.push({ field: "categoryId", issue: "Category selection is required." });
      }
      if (!sysId || isNaN(sysId)) {
        errors.push({ field: "relatedSystemId", issue: "Related System selection is required." });
      }
      if (!trimmedSummary || trimmedSummary.length < 5 || trimmedSummary.length > 100) {
        errors.push({ field: "summary", issue: "Summary is required and must be between 5 and 100 characters." });
      }
      if (!trimmedDescription || trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
        errors.push({ field: "description", issue: "Description is required and must be between 10 and 2,000 characters." });
      }
      const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
      if (!allowedPriorities.includes(requestedPriority)) {
        errors.push({ field: "requestedPriority", issue: "Invalid requested priority value." });
      }

      if (errors.length > 0) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_FAILED",
            message: "Validation failed on ticket submission.",
            details: errors,
          },
        });
      }

      // Verify active requester exists
      const requester = await prisma.requesterUser.findUnique({
        where: { id: reqId },
      });
      if (!requester || !requester.isActive) {
        return res.status(400).json({
          error: { code: "INVALID_REQUESTER", message: "Selected Requester is inactive or does not exist." },
        });
      }

      const ticketNumber = await generateTicketNumber();
      const files = (req.files as Express.Multer.File[]) || [];

      // Create Ticket with attachments in transaction
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber,
          summary: trimmedSummary,
          description: trimmedDescription,
          requestedPriority,
          currentStatus: "NEW", // BR-02
          requesterId: reqId,
          categoryId: catId,
          relatedSystemId: sysId,
          attachments: {
            create: files.map((f) => ({
              originalName: f.originalname,
              storedName: f.filename,
              mimeType: f.mimetype,
              sizeBytes: f.size,
              isRemoved: false,
            })),
          },
        },
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true, email: true } },
          attachments: true,
        },
      });

      return res.status(201).json(ticket);
    } catch (error) {
      console.error("Failed to create ticket:", error);
      return res.status(500).json({ error: { message: "Internal Server Error" } });
    }
  }
);

// GET /api/tickets: Retrieve paginated ticket list for active requester (AC-03, FR-07, FR-08)
app.get("/api/tickets", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const requesterId = parseInt(req.query.requesterId as string, 10);
    if (!requesterId || isNaN(requesterId)) {
      return res.status(400).json({
        error: { code: "MISSING_REQUESTER", message: "Query parameter 'requesterId' is required." },
      });
    }

    const {
      search,
      categoryId,
      priority,
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "10",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Filters scoped strictly to current requester
    const where: any = { requesterId };

    if (categoryId) {
      const catId = parseInt(categoryId as string, 10);
      if (!isNaN(catId)) where.categoryId = catId;
    }

    if (priority && typeof priority === "string" && priority !== "ALL") {
      where.requestedPriority = priority;
    }

    if (status && typeof status === "string" && status !== "ALL") {
      where.currentStatus = status;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const query = search.trim();
      where.OR = [
        { summary: { contains: query, mode: "insensitive" } },
        { ticketNumber: { contains: query, mode: "insensitive" } },
      ];
    }

    // Sort order
    const allowedSortFields = ["createdAt", "updatedAt", "ticketNumber"];
    const sortField = allowedSortFields.includes(sortBy as string) ? (sortBy as string) : "createdAt";
    const orderDirection = sortOrder === "asc" ? "asc" : "desc";

    const [totalItems, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          attachments: {
            where: { isRemoved: false },
            select: { id: true },
          },
        },
        orderBy: { [sortField]: orderDirection },
        skip,
        take: limitNum,
      }),
    ]);

    const items = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      requestedPriority: t.requestedPriority,
      itPriority: t.itPriority,
      currentStatus: t.currentStatus,
      category: t.category,
      relatedSystem: t.relatedSystem,
      attachmentCount: t.attachments.length,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return res.status(200).json({
      items,
      pagination: {
        totalItems,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalItems / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Failed to list tickets:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// GET /api/tickets/:id: Get Ticket Detail with ownership protection (AC-03, AC-04, BR-04)
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);
    const requesterId = parseInt(req.query.requesterId as string, 10);

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: { message: "Invalid ticket ID." } });
    }
    if (!requesterId || isNaN(requesterId)) {
      return res.status(400).json({ error: { message: "Query parameter 'requesterId' is required." } });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        attachments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
    }

    // BR-04 / AC-04: Ownership Isolation
    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Access to another requester's ticket is strictly prohibited.",
        },
      });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error("Failed to fetch ticket details:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// ---------------------------------------------------------------------------
// 3. Attachment Operations
// ---------------------------------------------------------------------------

// POST /api/tickets/:id/attachments: Upload new attachment to existing ticket (BR-08, BR-09, BR-10, AC-07)
app.post(
  "/api/tickets/:id/attachments",
  (req: Request, res: Response, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.message === "INVALID_FILE_TYPE") {
          return res.status(400).json({
            error: { code: "INVALID_FILE_TYPE", message: "Permitted file types: JPG, PNG, WEBP, and PDF only." },
          });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: { code: "FILE_TOO_LARGE", message: "Attachment file must not exceed 5 MB." },
          });
        }
        return res.status(400).json({ error: { message: err.message } });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();
      const ticketId = parseInt(req.params.id, 10);
      const requesterId = parseInt((req.query.requesterId || req.body.requesterId) as string, 10);

      if (!ticketId || isNaN(ticketId)) {
        return res.status(400).json({ error: { message: "Invalid ticket ID." } });
      }
      if (!requesterId || isNaN(requesterId)) {
        return res.status(400).json({ error: { message: "Requester ID is required." } });
      }
      if (!req.file) {
        return res.status(400).json({ error: { message: "File is required." } });
      }

      // Check ticket ownership
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          attachments: { where: { isRemoved: false } },
        },
      });

      if (!ticket) {
        return res.status(404).json({ error: { message: "Ticket not found." } });
      }
      if (ticket.requesterId !== requesterId) {
        return res.status(403).json({ error: { code: "FORBIDDEN", message: "Unauthorized ticket access." } });
      }

      // BR-10 / AC-07: Maximum 5 active attachments per ticket
      if (ticket.attachments.length >= MAX_ACTIVE_ATTACHMENTS) {
        return res.status(400).json({
          error: {
            code: "ATTACHMENT_LIMIT_REACHED",
            message: `A ticket can have a maximum of ${MAX_ACTIVE_ATTACHMENTS} active attachments.`,
          },
        });
      }

      const attachment = await prisma.attachment.create({
        data: {
          ticketId,
          originalName: req.file.originalname,
          storedName: req.file.filename,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          isRemoved: false,
        },
      });

      return res.status(201).json(attachment);
    } catch (error) {
      console.error("Failed to upload attachment:", error);
      return res.status(500).json({ error: { message: "Internal Server Error" } });
    }
  }
);

// DELETE /api/tickets/:id/attachments/:attachmentId: Soft-remove an attachment (BR-11, BR-12, AC-08)
app.delete("/api/tickets/:id/attachments/:attachmentId", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);
    const attachmentId = parseInt(req.params.attachmentId, 10);
    const requesterId = parseInt((req.query.requesterId || req.body.requesterId) as string, 10);
    const { removalReason } = req.body;

    if (!ticketId || !attachmentId || !requesterId) {
      return res.status(400).json({ error: { message: "Missing required parameters." } });
    }

    const trimmedReason = typeof removalReason === "string" ? removalReason.trim() : "";
    if (!trimmedReason || trimmedReason.length < 3) {
      return res.status(400).json({
        error: {
          code: "INVALID_REMOVAL_REASON",
          message: "A valid removal reason (minimum 3 characters) is mandatory for soft-removal.",
        },
      });
    }

    // Verify ticket and ownership
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: { message: "Ticket not found." } });
    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Unauthorized ticket access." } });
    }

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, ticketId },
    });
    if (!attachment) return res.status(404).json({ error: { message: "Attachment not found." } });

    // Perform soft-removal
    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removedAt: new Date(),
        removalReason: trimmedReason,
      },
    });

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Failed to soft-remove attachment:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// GET /api/attachments/:id/download: Download active attachment (BR-12, AC-08)
app.get("/api/attachments/:id/download", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const attachmentId = parseInt(req.params.id, 10);
    const requesterId = parseInt(req.query.requesterId as string, 10);

    if (!attachmentId || !requesterId) {
      return res.status(400).json({ error: { message: "Missing required parameters." } });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment) return res.status(404).json({ error: { message: "Attachment not found." } });

    if (attachment.ticket.requesterId !== requesterId) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Unauthorized attachment access." } });
    }

    // BR-12: Removed files must not be downloadable or previewed
    if (attachment.isRemoved) {
      return res.status(410).json({
        error: {
          code: "FILE_REMOVED",
          message: "This attachment has been removed and is no longer available for download.",
        },
      });
    }

    const filePath = path.join(UPLOAD_DIR, attachment.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { message: "File binary not found on server disk." } });
    }

    return res.download(filePath, attachment.originalName);
  } catch (error) {
    console.error("Failed to download attachment:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

export default app;
