/*
  Warnings:

  - You are about to drop the column `created_at` on the `Quiz` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "created_at",
ADD COLUMN     "name" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
