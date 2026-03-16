-- CreateEnum
CREATE TYPE "BoostType" AS ENUM ('BASIC', 'PREMIUM', 'ULTRA');

-- CreateEnum
CREATE TYPE "BoostStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- AlterTable
ALTER TABLE "Ad" ADD COLUMN     "isBoosted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AdBoost" (
    "id" TEXT NOT NULL,
    "type" "BoostType" NOT NULL DEFAULT 'BASIC',
    "status" "BoostStatus" NOT NULL DEFAULT 'ACTIVE',
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "adId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdBoost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdBoost_adId_key" ON "AdBoost"("adId");

-- AddForeignKey
ALTER TABLE "AdBoost" ADD CONSTRAINT "AdBoost_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdBoost" ADD CONSTRAINT "AdBoost_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
