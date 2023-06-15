/*
  Warnings:

  - The values [DEFICULT] on the enum `MatchDeficulty` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MatchDeficulty_new" AS ENUM ('EASY', 'MEDIUM', 'HARD');
ALTER TABLE "Matches" ALTER COLUMN "match_deficulty" TYPE "MatchDeficulty_new" USING ("match_deficulty"::text::"MatchDeficulty_new");
ALTER TYPE "MatchDeficulty" RENAME TO "MatchDeficulty_old";
ALTER TYPE "MatchDeficulty_new" RENAME TO "MatchDeficulty";
DROP TYPE "MatchDeficulty_old";
COMMIT;
