-- CreateTable
CREATE TABLE "SellerBank" (
    "id" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT NOT NULL,
    "routingNumber" TEXT,
    "sellerProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerBank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerBank_sellerProfileId_key" ON "SellerBank"("sellerProfileId");

-- AddForeignKey
ALTER TABLE "SellerBank" ADD CONSTRAINT "SellerBank_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "SellerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
