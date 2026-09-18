-- CreateTable
CREATE TABLE "CorrectionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "currentValue" TEXT NOT NULL,
    "requestedValue" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "staffRemarks" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CorrectionRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rollNo" TEXT NOT NULL,
    "enrollmentNo" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "motherName" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "photoId" TEXT,
    "pendingPhotoId" TEXT,
    "pendingPhotoAt" DATETIME,
    "mobile" TEXT,
    "email" TEXT,
    "addressLine" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Student_pendingPhotoId_fkey" FOREIGN KEY ("pendingPhotoId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("createdAt", "dob", "enrollmentNo", "failedLogins", "fatherName", "fullName", "id", "lastLoginAt", "lockedUntil", "motherName", "photoId", "programme", "rollNo", "status", "updatedAt") SELECT "createdAt", "dob", "enrollmentNo", "failedLogins", "fatherName", "fullName", "id", "lastLoginAt", "lockedUntil", "motherName", "photoId", "programme", "rollNo", "status", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_rollNo_key" ON "Student"("rollNo");
CREATE UNIQUE INDEX "Student_enrollmentNo_key" ON "Student"("enrollmentNo");
CREATE INDEX "Student_rollNo_dob_idx" ON "Student"("rollNo", "dob");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CorrectionRequest_status_createdAt_idx" ON "CorrectionRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CorrectionRequest_studentId_idx" ON "CorrectionRequest"("studentId");
