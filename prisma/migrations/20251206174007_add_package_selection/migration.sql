-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "resumePath" TEXT,
    "jdPath" TEXT,
    "paymentId" TEXT,
    "orderId" TEXT,
    "packageType" TEXT NOT NULL DEFAULT 'MOCK_INTERVIEW',
    "amountPaid" INTEGER NOT NULL DEFAULT 100,
    "meetingLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "duration" INTEGER NOT NULL DEFAULT 45,
    "scheduledAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Booking" ("course", "createdAt", "duration", "email", "id", "jdPath", "meetingLink", "name", "orderId", "paymentId", "phone", "resumePath", "scheduledAt", "status") SELECT "course", "createdAt", "duration", "email", "id", "jdPath", "meetingLink", "name", "orderId", "paymentId", "phone", "resumePath", "scheduledAt", "status" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
