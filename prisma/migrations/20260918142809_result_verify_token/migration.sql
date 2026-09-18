-- AlterTable
ALTER TABLE "Result" ADD COLUMN "verifyToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Result_verifyToken_key" ON "Result"("verifyToken");
