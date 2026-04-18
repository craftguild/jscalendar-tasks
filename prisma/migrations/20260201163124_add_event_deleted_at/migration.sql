/*
  Warnings:

  - You are about to drop the column `snapshotNotes` on the `Completion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN "deletedAt" DATETIME;

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
INSERT INTO "new_Completion" ("completedAt", "createdAt", "eventId", "id", "memo", "occurrenceId", "snapshot") SELECT "completedAt", "createdAt", "eventId", "id", "memo", "occurrenceId", "snapshot" FROM "Completion";
DROP TABLE "Completion";
ALTER TABLE "new_Completion" RENAME TO "Completion";
CREATE UNIQUE INDEX "Completion_eventId_occurrenceId_key" ON "Completion"("eventId", "occurrenceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
