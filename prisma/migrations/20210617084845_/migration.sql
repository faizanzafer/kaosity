-- AlterTable
ALTER TABLE "Matches" ALTER COLUMN "match_status_for_user_id" SET DEFAULT E'ACTIVE',
ALTER COLUMN "match_status_for_friend_user_id" SET DEFAULT E'PENDING';
