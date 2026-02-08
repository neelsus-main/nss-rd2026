-- AlterTable
ALTER TABLE "Account" ADD COLUMN "hubspotRecordId" TEXT;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "hubspotRecordId" TEXT;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN "hubspotRecordId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Account_hubspotRecordId_key" ON "Account"("hubspotRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_hubspotRecordId_key" ON "Contact"("hubspotRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Deal_hubspotRecordId_key" ON "Deal"("hubspotRecordId");
