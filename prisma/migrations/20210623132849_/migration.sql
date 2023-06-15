/*
  Warnings:

  - You are about to drop the column `country` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `dob` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `firstname` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `lastname` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Users" DROP COLUMN "country",
DROP COLUMN "dob",
DROP COLUMN "firstname",
DROP COLUMN "lastname",
DROP COLUMN "phone";
