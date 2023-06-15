/*
  Warnings:

  - You are about to drop the column `questions` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `reward_points` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `answers` on the `Quiz` table. All the data in the column will be lost.
  - Added the required column `questionBody` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `options` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correctOption` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "questions",
DROP COLUMN "reward_points",
DROP COLUMN "answers",
ADD COLUMN     "questionBody" VARCHAR(255) NOT NULL,
ADD COLUMN     "options" TEXT NOT NULL,
ADD COLUMN     "correctOption" VARBIT(150) NOT NULL;
