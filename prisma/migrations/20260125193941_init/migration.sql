/*
  Warnings:

  - You are about to drop the column `isSuspend` on the `Auth` table. All the data in the column will be lost.
  - You are about to drop the column `isSeller` on the `SellerProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Auth" DROP COLUMN "isSuspend",
ADD COLUMN     "isSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profilePicture" TEXT;

-- AlterTable
ALTER TABLE "SellerProfile" DROP COLUMN "isSeller";
