-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN "verifyToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_verifyToken_key" ON "Certificate"("verifyToken");
