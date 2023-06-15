/*
  Warnings:

  - You are about to drop the column `UserId` on the `Quiz` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Quiz" DROP CONSTRAINT "Quiz_UserId_fkey";

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "UserId";
