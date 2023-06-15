/*
  Warnings:

  - The values [CONMETICS] on the enum `ShopItemsType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ShopItemsType_new" AS ENUM ('PRIZES', 'COSMETICS', 'COINS', 'POWERUPS', 'SPECIAL_OFFER');
ALTER TABLE "ShopItems" ALTER COLUMN "type" TYPE "ShopItemsType_new" USING ("type"::text::"ShopItemsType_new");
ALTER TYPE "ShopItemsType" RENAME TO "ShopItemsType_old";
ALTER TYPE "ShopItemsType_new" RENAME TO "ShopItemsType";
DROP TYPE "ShopItemsType_old";
COMMIT;
