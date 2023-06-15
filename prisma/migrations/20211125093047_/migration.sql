/*
  Warnings:

  - You are about to drop the column `complete_picture_url` on the `Districts` table. All the data in the column will be lost.
  - You are about to drop the column `district_collectable_id` on the `UserCollectables` table. All the data in the column will be lost.
  - Added the required column `collectable_id` to the `UserCollectables` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserCollectables" DROP CONSTRAINT "UserCollectables_district_collectable_id_fkey";

-- AlterTable
ALTER TABLE "Districts" DROP COLUMN "complete_picture_url";

-- AlterTable
ALTER TABLE "UserCollectables" DROP COLUMN "district_collectable_id",
ADD COLUMN     "collectable_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "UserCollectables" ADD CONSTRAINT "UserCollectables_collectable_id_fkey" FOREIGN KEY ("collectable_id") REFERENCES "DistrictCollectables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
