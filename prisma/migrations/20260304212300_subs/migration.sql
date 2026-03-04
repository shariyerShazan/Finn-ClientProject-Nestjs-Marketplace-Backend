-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "usedAdIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
