-- CreateTable
CREATE TABLE "Counselling" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL,
    "counsellorName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "photoId" TEXT,
    "aadhaarId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Counselling_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Counselling_aadhaarId_fkey" FOREIGN KEY ("aadhaarId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Counselling_reference_key" ON "Counselling"("reference");

-- CreateIndex
CREATE INDEX "Counselling_createdAt_idx" ON "Counselling"("createdAt");

-- CreateIndex
CREATE INDEX "Counselling_status_idx" ON "Counselling"("status");
