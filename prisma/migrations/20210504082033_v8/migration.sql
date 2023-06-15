/*
  Warnings:

  - You are about to drop the column `current_points` on the `Quiz` table. All the data in the column will be lost.
  - Changed the type of `reward_points` on the `Quiz` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "current_points",
DROP COLUMN "reward_points",
ADD COLUMN     "reward_points" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "current_points" INTEGER NOT NULL DEFAULT 0;
