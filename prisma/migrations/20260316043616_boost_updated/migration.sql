/*
  Warnings:

  - You are about to drop the column `price` on the `AdBoost` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `AdBoost` table. All the data in the column will be lost.
  - Added the required column `packageId` to the `AdBoost` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AdBoost" DROP COLUMN "price",
DROP COLUMN "type",
ADD COLUMN     "packageId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "AdBoostPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "type" "BoostType" NOT NULL DEFAULT 'BASIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdBoostPackage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdBoost" ADD CONSTRAINT "AdBoost_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "AdBoostPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
