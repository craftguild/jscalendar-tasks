-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventTag" (
    "eventId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("eventId", "tagId"),
    CONSTRAINT "EventTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EventTag" ("color", "createdAt", "eventId", "tagId") SELECT "color", "createdAt", "eventId", "tagId" FROM "EventTag";
DROP TABLE "EventTag";
ALTER TABLE "new_EventTag" RENAME TO "EventTag";
WITH ranked AS (
  SELECT
    rowid,
    ROW_NUMBER() OVER (PARTITION BY "eventId" ORDER BY "createdAt", "tagId") - 1 AS pos
  FROM "EventTag"
)
UPDATE "EventTag"
SET "position" = (SELECT pos FROM ranked WHERE ranked.rowid = "EventTag".rowid);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
