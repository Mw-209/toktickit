import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import cookieParser from "cookie-parser";
import { getPrisma } from "./prisma.js";
import { hashPassword, verifyPassword, generateToken, verifyToken } from "./auth.js";

// ---------------------------------------------------------------------------
// Lab 3 Auth Types — extend Express Request
// ---------------------------------------------------------------------------
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; role: string };
    }
  }
}

// ---------------------------------------------------------------------------
// Lab 3 Auth Middleware
// ---------------------------------------------------------------------------

/** requireAuth: verifies JWT cookie; sets req.user; returns 401 if missing/invalid */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required." });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or expired session. Please log in again." });
    return;
  }
  req.user = payload;
  next();
}

/** requireRole: must be used after requireAuth; returns 403 if role not permitted */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "FORBIDDEN", message: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
}

export const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
// Lab 3 — Auth Endpoints
// ---------------------------------------------------------------------------

// POST /api/auth/login — BR-01, AC-01, AC-13
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "Email and password are required." });
    }
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    // BR-01: Generic error — do not expose whether account exists or is inactive
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid credentials or inactive account." });
    }
    const valid = await verifyPassword(String(password), user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid credentials or inactive account." });
    }
    const token = generateToken(user.id, user.role);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 h
      path: "/",
    });
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Internal Server Error" });
  }
});

// POST /api/auth/logout — BR-22
app.post("/api/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", { path: "/" });
  return res.status(200).json({ message: "Logged out successfully" });
});

// GET /api/auth/me — AC-10
app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, mustChangePassword: true },
    });
    if (!user) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Session user not found." });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("GET /me error:", error);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Internal Server Error" });
  }
});

// POST /api/auth/change-password — BR-02, BR-08, AC-02
app.post("/api/auth/change-password", requireAuth, async (req: Request, res: Response) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: "MISSING_FIELDS", message: "newPassword and confirmPassword are required." });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: "PASSWORD_TOO_SHORT", message: "Password must be at least 8 characters." });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "PASSWORD_MISMATCH", message: "Passwords do not match." });
    }
    const prisma = getPrisma();
    const passwordHash = await hashPassword(String(newPassword));
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash, mustChangePassword: false },
    });
    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Internal Server Error" });
  }
});

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
// Lab 3: requireAuth — session userId used as ticket owner
app.post(
  "/api/tickets",
  requireAuth,
  requireRole("REQUESTER"),
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
      const userId = req.user!.userId; // AC-03: always from session
      const {
        categoryId,
        relatedSystemId,
        requestedPriority = "MEDIUM",
        summary,
        description,
      } = req.body;

      const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
      const trimmedDescription = typeof description === "string" ? description.trim() : "";
      const catId = parseInt(categoryId, 10);
      const sysId = parseInt(relatedSystemId, 10);

      // Validation
      const errors: { field: string; issue: string }[] = [];
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

      const ticketNumber = await generateTicketNumber();
      const files = (req.files as Express.Multer.File[]) || [];

      // Create Ticket — userId from session (AC-03)
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber,
          summary: trimmedSummary,
          description: trimmedDescription,
          requestedPriority,
          currentStatus: "NEW",
          userId,
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
          user: { select: { id: true, name: true, email: true } },
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


// GET /api/tickets: Retrieve paginated ticket list (AC-03) — uses session userId
app.get("/api/tickets", requireAuth, requireRole("REQUESTER"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const userId = req.user!.userId; // AC-03: session identity, ignore any requesterId query param

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

    // Support both Lab 3 new tickets (userId) and Lab 2 legacy tickets (matched by email)
    const sessionUser = await prisma.user.findUnique({ where: { id: userId } });
    const legacyRequester = sessionUser ? await prisma.requesterUser.findUnique({ where: { email: sessionUser.email } }) : null;

    const baseCondition = legacyRequester 
      ? { OR: [{ userId }, { requesterId: legacyRequester.id }] }
      : { userId };

    const where: any = { ...baseCondition };

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
app.get("/api/tickets/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);
    const userId = req.user!.userId;

    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: { message: "Invalid ticket ID." } });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        user: { select: { id: true, name: true, email: true } },
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
    const sessionUser = await prisma.user.findUnique({ where: { id: userId } });
    const isLab3Owner = ticket.userId === userId;
    const isLegacyOwner = !!(ticket.requesterId && sessionUser && ticket.requester?.email === sessionUser.email);

    if (!isLab3Owner && !isLegacyOwner) {
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
  requireAuth,
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
      const userId = req.user!.userId;

      if (!ticketId || isNaN(ticketId)) {
        return res.status(400).json({ error: { message: "Invalid ticket ID." } });
      }
      if (!req.file) {
        return res.status(400).json({ error: { message: "File is required." } });
      }

      // Check ticket ownership
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          requester: true, // Legacy
          attachments: { where: { isRemoved: false } },
        },
      });

      if (!ticket) {
        return res.status(404).json({ error: { message: "Ticket not found." } });
      }

      const sessionUser = await prisma.user.findUnique({ where: { id: userId } });
      const isLab3Owner = ticket.userId === userId;
      const isLegacyOwner = !!(ticket.requesterId && sessionUser && ticket.requester?.email === sessionUser.email);
      const isITStaff = sessionUser?.role === "IT_STAFF" || sessionUser?.role === "ADMINISTRATOR";

      if (!isLab3Owner && !isLegacyOwner && !isITStaff) {
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
app.delete("/api/tickets/:id/attachments/:attachmentId", requireAuth, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);
    const attachmentId = parseInt(req.params.attachmentId, 10);
    const userId = req.user!.userId;
    const { removalReason } = req.body;

    if (!ticketId || !attachmentId) {
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
    const ticket = await prisma.ticket.findUnique({ 
      where: { id: ticketId },
      include: { requester: true }
    });
    if (!ticket) return res.status(404).json({ error: { message: "Ticket not found." } });
    
    const sessionUser = await prisma.user.findUnique({ where: { id: userId } });
    const isLab3Owner = ticket.userId === userId;
    const isLegacyOwner = !!(ticket.requesterId && sessionUser && ticket.requester?.email === sessionUser.email);
    const isITStaff = sessionUser?.role === "IT_STAFF" || sessionUser?.role === "ADMINISTRATOR";

    if (!isLab3Owner && !isLegacyOwner && !isITStaff) {
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
app.get("/api/attachments/:id/download", requireAuth, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const attachmentId = parseInt(req.params.id, 10);
    const userId = req.user!.userId;

    if (!attachmentId) {
      return res.status(400).json({ error: { message: "Missing required parameters." } });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { 
        ticket: {
          include: { requester: true }
        } 
      },
    });

    if (!attachment) return res.status(404).json({ error: { message: "Attachment not found." } });

    const sessionUser = await prisma.user.findUnique({ where: { id: userId } });
    const isLab3Owner = attachment.ticket.userId === userId;
    const isLegacyOwner = !!(attachment.ticket.requesterId && sessionUser && attachment.ticket.requester?.email === sessionUser.email);
    const isITStaff = sessionUser?.role === "IT_STAFF" || sessionUser?.role === "ADMINISTRATOR";

    if (!isLab3Owner && !isLegacyOwner && !isITStaff) {
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

// ---------------------------------------------------------------------------
// 4. Stubs for Authorization Tests (Lab 3)
// ---------------------------------------------------------------------------

// GET /api/staff/assignees: Fetch list of active IT Staff and Admin for dropdown filters
app.get("/api/staff/assignees", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const assignees = await prisma.user.findMany({
      where: {
        role: { in: ["IT_STAFF", "ADMINISTRATOR"] },
        isActive: true,
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });
    return res.status(200).json({ assignees });
  } catch (error) {
    console.error("Failed to fetch staff assignees:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// GET /api/staff/tickets: Fetch IT Staff Ticket Queue with search, filter, sort, and pagination
app.get("/api/staff/tickets", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    
    // Parse query params
    const search = req.query.search as string || "";
    const status = req.query.status as string;
    const itPriority = req.query.itPriority as string;
    const categoryIdStr = req.query.categoryId as string;
    const assignedToIdStr = req.query.assignedToId as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? "asc" : "desc";
    const page = Math.max(1, parseInt(req.query.page as string || "1", 10));
    const pageSize = parseInt(req.query.pageSize as string || "10", 10);
    const limit = [10, 25, 50].includes(pageSize) ? pageSize : 10;
    const offset = (page - 1) * limit;

    // Build Prisma where clause
    const whereClause: any = {};

    if (search.trim()) {
      whereClause.OR = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } }
      ];
    }
    if (status) {
      whereClause.currentStatus = status;
    }
    if (itPriority) {
      whereClause.itPriority = itPriority;
    }
    if (categoryIdStr && !isNaN(parseInt(categoryIdStr, 10))) {
      whereClause.categoryId = parseInt(categoryIdStr, 10);
    }
    if (assignedToIdStr) {
      const parsedId = parseInt(assignedToIdStr, 10);
      if (parsedId === 0) {
        whereClause.assignedToId = null; // Unassigned
      } else if (!isNaN(parsedId)) {
        whereClause.assignedToId = parsedId;
      }
    }

    // Define valid sort fields to prevent injection or invalid queries
    const validSortFields = ["ticketNumber", "createdAt", "updatedAt", "itPriority"];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    let orderBy: any;
    if (orderByField === "itPriority") {
      // Since itPriority is a string, sorting alphabetically might not match severity order (URGENT > HIGH > MEDIUM > LOW).
      // If we sort alphabetically: HIGH, LOW, MEDIUM, URGENT.
      // But for simplicity in Lab 3, we just pass it to DB. A real implementation might use an ENUM or mapped value.
      orderBy = { itPriority: sortOrder };
    } else {
      orderBy = { [orderByField]: sortOrder };
    }

    // Execute queries
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where: whereClause }),
      prisma.ticket.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          category: true,
          assignedTo: { select: { id: true, name: true, role: true } },
          requester: { select: { id: true, name: true, email: true } },
        }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      tickets,
      pagination: {
        total,
        page,
        pageSize: limit,
        totalPages
      }
    });
  } catch (error) {
    console.error("Failed to fetch staff tickets:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// GET /api/staff/tickets/:id: Fetch full ticket detail for IT Staff
app.get("/api/staff/tickets/:id", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        assignedTo: { select: { id: true, name: true, role: true } },
        requester: { select: { id: true, name: true, email: true } },
        attachments: {
          select: {
            id: true,
            ticketId: true,
            originalName: true,
            storedName: true,
            mimeType: true,
            sizeBytes: true,
            isRemoved: true,
            removedAt: true,
            removalReason: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket) return res.status(404).json({ error: { message: "Ticket not found." } });
    return res.status(200).json(ticket);
  } catch (error) {
    console.error("Failed to fetch ticket detail:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// PATCH /api/staff/tickets/:id: Update Ticket (Claim, Priority, Status)
app.patch("/api/staff/tickets/:id", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { assignedToId, itPriority, currentStatus } = req.body;
    const prisma = getPrisma();

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: { message: "Ticket not found." } });

    const updateData: any = {};

    if (assignedToId !== undefined) {
      if (assignedToId === null) {
        updateData.assignedToId = null;
      } else {
        const staff = await prisma.user.findUnique({ where: { id: assignedToId } });
        if (!staff || (staff.role !== "IT_STAFF" && staff.role !== "ADMINISTRATOR")) {
          return res.status(400).json({ error: { message: "Invalid assignedToId. Must be IT_STAFF or ADMINISTRATOR." } });
        }
        updateData.assignedToId = assignedToId;
      }
    }

    if (itPriority !== undefined) {
      if (!["LOW", "MEDIUM", "HIGH", "URGENT"].includes(itPriority)) {
        return res.status(400).json({ error: { message: "Invalid itPriority." } });
      }
      updateData.itPriority = itPriority;
    }

    if (currentStatus !== undefined) {
      // BR-13: Status Transition Rules Validation
      const validTransitions: Record<string, string[]> = {
        NEW: ["IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"],
        OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "CANCELLED"], // legacy OPEN support if needed
        IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "CANCELLED"],
        WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"],
        RESOLVED: ["REOPENED", "CLOSED"],
        CLOSED: ["REOPENED"],
        REOPENED: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "CANCELLED"],
        CANCELLED: ["REOPENED"],
      };

      const allowed = validTransitions[ticket.currentStatus] || [];
      if (!allowed.includes(currentStatus) && ticket.currentStatus !== currentStatus) {
        return res.status(422).json({ error: { message: `Invalid status transition from ${ticket.currentStatus} to ${currentStatus}.` } });
      }
      updateData.currentStatus = currentStatus;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        category: true,
        relatedSystem: true,
        assignedTo: { select: { id: true, name: true, role: true } },
        requester: { select: { id: true, name: true, email: true } },
        attachments: true,
      },
    });

    return res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Failed to update ticket:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// GET /api/tickets/:id/comments: Fetch public comments
app.get("/api/tickets/:id/comments", requireAuth, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const prisma = getPrisma();
    const sessionUser = req.user as any;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: { message: "Ticket not found." } });

    // Requester can only access their own tickets
    if (sessionUser.role === "REQUESTER" && ticket.userId !== sessionUser.userId && ticket.requesterId !== sessionUser.userId) {
      return res.status(403).json({ error: { message: "Forbidden" } });
    }

    const comments = await prisma.publicComment.findMany({
      where: { ticketId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({ comments });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// POST /api/tickets/:id/comments: Add public comment
app.post("/api/tickets/:id/comments", requireAuth, async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const content = (req.body.content || "").trim();
    const sessionUser = req.user as any;

    if (!content || content.length > 2000) {
      return res.status(400).json({ error: { message: "Content must be between 1 and 2000 characters." } });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: { message: "Ticket not found." } });

    if (sessionUser.role === "REQUESTER" && ticket.userId !== sessionUser.userId && ticket.requesterId !== sessionUser.userId) {
      return res.status(403).json({ error: { message: "Forbidden" } });
    }

    const comment = await prisma.publicComment.create({
      data: { 
        ticket: { connect: { id: ticketId } }, 
        author: { connect: { id: sessionUser.userId } }, 
        content 
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    return res.status(201).json(comment);
  } catch (error: any) {
    console.error("Failed to create comment:", error);
    return res.status(500).json({ error: { message: error.message || "Internal Server Error" } });
  }
});

// GET /api/tickets/:id/notes: Fetch internal notes
app.get("/api/tickets/:id/notes", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const prisma = getPrisma();
    
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: { message: "Ticket not found." } });

    const notes = await prisma.internalNote.findMany({
      where: { ticketId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({ notes });
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// POST /api/tickets/:id/notes: Add internal note
app.post("/api/tickets/:id/notes", requireAuth, requireRole("IT_STAFF", "ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const content = (req.body.content || "").trim();
    const sessionUser = req.user as any;

    if (!content || content.length > 2000) {
      return res.status(400).json({ error: { message: "Content must be between 1 and 2000 characters." } });
    }

    const prisma = getPrisma();
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: { message: "Ticket not found." } });

    const note = await prisma.internalNote.create({
      data: { 
        ticket: { connect: { id: ticketId } }, 
        author: { connect: { id: sessionUser.userId } }, 
        content 
      },
      include: { author: { select: { id: true, name: true, role: true } } },
    });

    return res.status(201).json(note);
  } catch (error: any) {
    console.error("Failed to create note:", error);
    return res.status(500).json({ error: { message: error.message || "Internal Server Error" } });
  }
});

// POST /api/tickets/:id/resolve-indication: Requester indicates ticket appears resolved
app.post("/api/tickets/:id/resolve-indication", requireAuth, requireRole("REQUESTER"), async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const sessionUser = req.user as any;
    const prisma = getPrisma();

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: { message: "Ticket not found." } });

    if (ticket.userId !== sessionUser.userId && ticket.requesterId !== sessionUser.userId) {
      return res.status(403).json({ error: { message: "Forbidden" } });
    }

    if (["RESOLVED", "CLOSED", "CANCELLED"].includes(ticket.currentStatus)) {
      return res.status(403).json({ error: { message: "Cannot indicate resolved on a closed/resolved ticket." } });
    }

    if (ticket.resolveIndicatedAt) {
      return res.status(409).json({ error: { message: "Already indicated resolved." } });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { resolveIndicatedAt: new Date() },
    });

    return res.status(200).json({ ticketId: updated.id, resolveIndicatedAt: updated.resolveIndicatedAt });
  } catch (error) {
    console.error("Failed to indicate resolved:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// GET /api/admin/users: List users
app.get("/api/admin/users", requireAuth, requireRole("ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const { search, role } = req.query;
    const prisma = getPrisma();

    const where: any = {};

    if (role && typeof role === "string") {
      where.role = role.toUpperCase();
    }

    if (search && typeof search === "string") {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// POST /api/admin/users: Create new user
app.post("/api/admin/users", requireAuth, requireRole("ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const { name, email, role, password, isActive } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: { message: "Name, email, role, and password are required." } });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: { message: "Password must be at least 8 characters." } });
    }

    const validRoles = ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: { message: "Invalid role." } });
    }

    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: { message: "Email already in use." } });
    }

    const hashedPassword = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        role,
        passwordHash: hashedPassword,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      }
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error("Failed to create user:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

// PATCH /api/admin/users/:id: Edit user
app.patch("/api/admin/users/:id", requireAuth, requireRole("ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const userIdToEdit = parseInt(req.params.id, 10);
    const { name, email, role, isActive, newPassword } = req.body;
    
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userIdToEdit } });
    if (!user) {
      return res.status(404).json({ error: { message: "User not found." } });
    }

    const data: any = {};

    if (name !== undefined) {
      if (!name) return res.status(400).json({ error: { message: "Name cannot be empty." } });
      data.name = String(name).trim();
    }

    if (email !== undefined) {
      if (!email) return res.status(400).json({ error: { message: "Email cannot be empty." } });
      const emailLower = String(email).trim().toLowerCase();
      
      if (emailLower !== user.email) {
        const existing = await prisma.user.findUnique({ where: { email: emailLower } });
        if (existing) {
          return res.status(409).json({ error: { message: "Email already in use." } });
        }
        data.email = emailLower;
      }
    }

    if (role !== undefined) {
      const validRoles = ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: { message: "Invalid role." } });
      }
      data.role = role;
    }

    if (isActive !== undefined) {
      data.isActive = Boolean(isActive);
    }

    if (newPassword !== undefined && newPassword !== "") {
      if (newPassword.length < 8) {
        return res.status(400).json({ error: { message: "Password must be at least 8 characters." } });
      }
      data.passwordHash = await hashPassword(newPassword);
      data.mustChangePassword = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdToEdit },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      }
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
});

export default app;
