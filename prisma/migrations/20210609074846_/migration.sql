/*
  Warnings:

  - You are about to drop the column `match_status` on the `Matches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Matches" DROP COLUMN "match_status",
ADD COLUMN     "match_status_for_user_id" "MatchStatus" NOT NULL DEFAULT E'ACTIVE',
ADD COLUMN     "match_status_for_friend_user_id" "MatchStatus" NOT NULL DEFAULT E'ACTIVE';
