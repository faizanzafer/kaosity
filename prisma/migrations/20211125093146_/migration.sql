/*
  Warnings:

  - Added the required column `complete_picture_url` to the `Districts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Districts" ADD COLUMN     "complete_picture_url" TEXT NOT NULL;
