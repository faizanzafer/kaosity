/*
  Warnings:

  - You are about to drop the column `app_closed_at` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `crowns` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `diamonds` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "app_closed_at",
DROP COLUMN "crowns",
DROP COLUMN "diamonds";
