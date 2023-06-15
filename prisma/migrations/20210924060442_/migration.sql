/*
  Warnings:

  - The values [COMPLETE_SOLO_GAMES] on the enum `AchievementConditionTypes` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AchievementConditionTypes_new" AS ENUM ('PLAY_SOLO_GAMES', 'COLLECT_COMIC_PIECES', 'FIND_COLLECTABLE_PIECES', 'ANSWERS_CORRECTLY', 'ANSWERS_CORRECTLY_IN_ROW', 'LEVEL_REACH', 'CHALLENGE_MATCHES', 'WIN_CHALLENGE_MATCHES', 'WIN_CHALLENGE_MATCHES_WITHOUT_ITEM_USE', 'COINS_EARN', 'COINS_SPEND', 'MONTHLY_BONUS_CLAIMS', 'ITEMS_USE', 'KAOS_VISIOS_ITEM_USE', 'MICROPHONE_ITEM_USE', 'DO_OVER_ITEM_USE', 'TIME_ZONE_ITEM_USE', 'COMPLETE_CHAPTER_2_OF_STEVE_STORY');
ALTER TABLE "AchievementConditions" ALTER COLUMN "condition_type" TYPE "AchievementConditionTypes_new" USING ("condition_type"::text::"AchievementConditionTypes_new");
ALTER TABLE "UserAchievements" ALTER COLUMN "condition_type" TYPE "AchievementConditionTypes_new" USING ("condition_type"::text::"AchievementConditionTypes_new");
ALTER TYPE "AchievementConditionTypes" RENAME TO "AchievementConditionTypes_old";
ALTER TYPE "AchievementConditionTypes_new" RENAME TO "AchievementConditionTypes";
DROP TYPE "AchievementConditionTypes_old";
COMMIT;
