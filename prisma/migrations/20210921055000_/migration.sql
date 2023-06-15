-- DropForeignKey
ALTER TABLE "AchievementConditions" DROP CONSTRAINT "AchievementConditions_achievement_id_fkey";

-- DropForeignKey
ALTER TABLE "Friends" DROP CONSTRAINT "Friends_friend_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Friends" DROP CONSTRAINT "Friends_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Matches" DROP CONSTRAINT "Matches_friend_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Matches" DROP CONSTRAINT "Matches_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Matches" DROP CONSTRAINT "Matches_winner_id_fkey";

-- DropForeignKey
ALTER TABLE "UserItems" DROP CONSTRAINT "UserItems_shop_item_id_fkey";

-- DropForeignKey
ALTER TABLE "UserItems" DROP CONSTRAINT "UserItems_user_id_fkey";

-- AlterTable
ALTER TABLE "AchievementConditions" ADD COLUMN     "reward" TEXT;

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_friend_user_id_fkey" FOREIGN KEY ("friend_user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matches" ADD CONSTRAINT "Matches_friend_user_id_fkey" FOREIGN KEY ("friend_user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matches" ADD CONSTRAINT "Matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matches" ADD CONSTRAINT "Matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserItems" ADD CONSTRAINT "UserItems_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserItems" ADD CONSTRAINT "UserItems_shop_item_id_fkey" FOREIGN KEY ("shop_item_id") REFERENCES "ShopItems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementConditions" ADD CONSTRAINT "AchievementConditions_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "Achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
