/*
  Warnings:

  - Added the required column `level` to the `UserAchievements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserAchievements" ADD COLUMN     "level" INTEGER NOT NULL;
