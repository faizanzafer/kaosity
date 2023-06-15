/*
  Warnings:

  - You are about to drop the column `game_closed_at` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "game_closed_at",
ADD COLUMN     "app_closed_at" TIMESTAMP(3);
