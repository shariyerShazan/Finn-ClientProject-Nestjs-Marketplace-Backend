-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "blockedById" TEXT,
ADD COLUMN     "isBlocked" BOOLEAN NOT NULL DEFAULT false;
