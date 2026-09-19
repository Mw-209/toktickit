-- CreateEnum (Lab 3 Role)
CREATE TYPE "Role" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

-- AlterTable: Add Lab 3 columns to Ticket (use IF NOT EXISTS to be safe with partial applies)
ALTER TABLE "Ticket"
ADD COLUMN IF NOT EXISTS "userId"              INTEGER,
ADD COLUMN IF NOT EXISTS "assignedToId"       INTEGER,
ADD COLUMN IF NOT EXISTS "resolveIndicatedAt" TIMESTAMP(3);

-- CreateTable: User
CREATE TABLE IF NOT EXISTS "User" (
    "id"                 SERIAL NOT NULL,
    "name"               TEXT NOT NULL,
    "email"              TEXT NOT NULL,
    "passwordHash"       TEXT NOT NULL,
    "role"               "Role" NOT NULL DEFAULT 'REQUESTER',
    "isActive"           BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PublicComment
CREATE TABLE IF NOT EXISTS "PublicComment" (
    "id"        SERIAL NOT NULL,
    "ticketId"  INTEGER NOT NULL,
    "authorId"  INTEGER NOT NULL,
    "content"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InternalNote
CREATE TABLE IF NOT EXISTS "InternalNote" (
    "id"        SERIAL NOT NULL,
    "ticketId"  INTEGER NOT NULL,
    "authorId"  INTEGER NOT NULL,
    "content"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (use DO blocks to skip if already exists)
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_isActive_idx" ON "User"("role", "isActive");
CREATE INDEX IF NOT EXISTS "Ticket_userId_createdAt_idx" ON "Ticket"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Ticket_assignedToId_currentStatus_idx" ON "Ticket"("assignedToId", "currentStatus");
CREATE INDEX IF NOT EXISTS "Ticket_currentStatus_idx" ON "Ticket"("currentStatus");
CREATE INDEX IF NOT EXISTS "PublicComment_ticketId_createdAt_idx" ON "PublicComment"("ticketId", "createdAt");
CREATE INDEX IF NOT EXISTS "InternalNote_ticketId_createdAt_idx" ON "InternalNote"("ticketId", "createdAt");

-- AddForeignKey (conditional)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Ticket_userId_fkey') THEN
    ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Ticket_assignedToId_fkey') THEN
    ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey"
      FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PublicComment_ticketId_fkey') THEN
    ALTER TABLE "PublicComment" ADD CONSTRAINT "PublicComment_ticketId_fkey"
      FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PublicComment_authorId_fkey') THEN
    ALTER TABLE "PublicComment" ADD CONSTRAINT "PublicComment_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InternalNote_ticketId_fkey') THEN
    ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_ticketId_fkey"
      FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InternalNote_authorId_fkey') THEN
    ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
