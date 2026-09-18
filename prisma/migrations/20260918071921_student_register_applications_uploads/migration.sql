-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rollNo" TEXT NOT NULL,
    "enrollmentNo" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "motherName" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "photoId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationNo" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "fatherName" TEXT NOT NULL,
    "motherName" TEXT NOT NULL,
    "dob" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "qualificationBoard" TEXT,
    "qualificationYear" INTEGER,
    "qualificationPct" REAL,
    "photoId" TEXT,
    "aadhaarId" TEXT,
    "qualificationDocId" TEXT,
    "aadhaarLast4" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Application_aadhaarId_fkey" FOREIGN KEY ("aadhaarId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Application_qualificationDocId_fkey" FOREIGN KEY ("qualificationDocId") REFERENCES "Upload" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storageKey" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "certificateNo" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "awardYear" INTEGER NOT NULL,
    "enrollmentNo" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "registrarRemarks" TEXT,
    "issuedOn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "rollNo" TEXT,
    "studentId" TEXT,
    CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Certificate" ("awardYear", "certificateNo", "createdAt", "division", "enrollmentNo", "id", "issuedOn", "programme", "registrarRemarks", "status", "studentName", "updatedAt") SELECT "awardYear", "certificateNo", "createdAt", "division", "enrollmentNo", "id", "issuedOn", "programme", "registrarRemarks", "status", "studentName", "updatedAt" FROM "Certificate";
DROP TABLE "Certificate";
ALTER TABLE "new_Certificate" RENAME TO "Certificate";
CREATE UNIQUE INDEX "Certificate_certificateNo_key" ON "Certificate"("certificateNo");
CREATE INDEX "Certificate_certificateNo_idx" ON "Certificate"("certificateNo");
CREATE INDEX "Certificate_rollNo_idx" ON "Certificate"("rollNo");
CREATE TABLE "new_Result" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rollNo" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "programme" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "examSession" TEXT NOT NULL,
    "subjects" TEXT NOT NULL DEFAULT '[]',
    "marksObtained" INTEGER NOT NULL DEFAULT 0,
    "marksMax" INTEGER NOT NULL DEFAULT 0,
    "sgpa" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PASS',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "studentId" TEXT,
    CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Result" ("createdAt", "examSession", "id", "marksMax", "marksObtained", "programme", "published", "publishedAt", "rollNo", "semester", "sgpa", "status", "studentName", "subjects", "updatedAt") SELECT "createdAt", "examSession", "id", "marksMax", "marksObtained", "programme", "published", "publishedAt", "rollNo", "semester", "sgpa", "status", "studentName", "subjects", "updatedAt" FROM "Result";
DROP TABLE "Result";
ALTER TABLE "new_Result" RENAME TO "Result";
CREATE INDEX "Result_rollNo_published_idx" ON "Result"("rollNo", "published");
CREATE UNIQUE INDEX "Result_rollNo_semester_examSession_key" ON "Result"("rollNo", "semester", "examSession");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNo_key" ON "Student"("rollNo");

-- CreateIndex
CREATE UNIQUE INDEX "Student_enrollmentNo_key" ON "Student"("enrollmentNo");

-- CreateIndex
CREATE INDEX "Student_rollNo_dob_idx" ON "Student"("rollNo", "dob");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationNo_key" ON "Application"("applicationNo");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Upload_storageKey_key" ON "Upload"("storageKey");

-- CreateIndex
CREATE INDEX "RateLimit_windowStart_idx" ON "RateLimit"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_bucket_key_key" ON "RateLimit"("bucket", "key");
