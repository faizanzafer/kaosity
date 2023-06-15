/*
  Warnings:

  - Added the required column `quantity` to the `ShopItems` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ShopItems" ADD COLUMN     "quantity" INTEGER NOT NULL,
ALTER COLUMN "picture_url" DROP NOT NULL;
