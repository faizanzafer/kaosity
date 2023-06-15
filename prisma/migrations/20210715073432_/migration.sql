/*
  Warnings:

  - Added the required column `type` to the `ShopItems` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShopItemsType" AS ENUM ('PRIZES', 'CONMETICS', 'COINS');

-- AlterTable
ALTER TABLE "ShopItems" ADD COLUMN     "type" "ShopItemsType" NOT NULL;
