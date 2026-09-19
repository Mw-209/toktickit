-- AlterTable: Make Ticket.requesterId nullable
-- Lab 3: New tickets use userId (authenticated User) instead of requesterId (RequesterUser)
-- Existing Lab 2 tickets retain their requesterId value unchanged.
ALTER TABLE "Ticket" ALTER COLUMN "requesterId" DROP NOT NULL;
