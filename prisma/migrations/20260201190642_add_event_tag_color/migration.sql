/*
  Warnings:

  - Added the required column `color` to the `EventTag` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventTag" (
    "eventId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("eventId", "tagId"),
    CONSTRAINT "EventTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventTag" ("createdAt", "eventId", "tagId") SELECT "createdAt", "eventId", "tagId" FROM "EventTag";
DROP TABLE "EventTag";
ALTER TABLE "new_EventTag" RENAME TO "EventTag";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
