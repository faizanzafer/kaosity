-- AlterTable
ALTER TABLE "Matches" ALTER COLUMN "winner_points" DROP NOT NULL,
ALTER COLUMN "winner_points" DROP DEFAULT;
