-- CreateEnum
CREATE TYPE "SellerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "SellerProfile" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "status" "SellerStatus" NOT NULL DEFAULT 'PENDING';
