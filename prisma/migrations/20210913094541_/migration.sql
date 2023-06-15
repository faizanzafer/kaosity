/*
  Warnings:

  - You are about to drop the column `achievement_level_id` on the `Achievements` table. All the data in the column will be lost.
  - You are about to drop the `AchievementLevels` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `level` to the `Achievements` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Achievements" DROP CONSTRAINT "Achievements_achievement_level_id_fkey";

-- AlterTable
ALTER TABLE "Achievements" DROP COLUMN "achievement_level_id",
ADD COLUMN     "level" INTEGER NOT NULL;

-- DropTable
DROP TABLE "AchievementLevels";
