/*
  Warnings:

  - You are about to alter the column `options` on the `Quiz` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(150)`.

*/
-- AlterTable
ALTER TABLE "Quiz" ALTER COLUMN "options" SET DATA TYPE VARCHAR(150),
ALTER COLUMN "correctOption" SET DATA TYPE VARCHAR(150);
