/*
  Warnings:

  - Added the required column `snapshot` to the `Completion` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Completion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "occurrenceId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL,
    "memo" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Completion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Completion" ("completedAt", "createdAt", "eventId", "id", "memo", "occurrenceId") SELECT "completedAt", "createdAt", "eventId", "id", "memo", "occurrenceId" FROM "Completion";
DROP TABLE "Completion";
ALTER TABLE "new_Completion" RENAME TO "Completion";
CREATE UNIQUE INDEX "Completion_eventId_occurrenceId_key" ON "Completion"("eventId", "occurrenceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
