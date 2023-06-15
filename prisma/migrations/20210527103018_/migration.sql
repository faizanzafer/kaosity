-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "Matches" ADD COLUMN     "match_status" "MatchStatus" NOT NULL DEFAULT E'ACTIVE';
