/*
  Warnings:

  - You are about to drop the column `collectable_id` on the `UserCollectables` table. All the data in the column will be lost.
  - Added the required column `district_collectable_id` to the `UserCollectables` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserCollectables" DROP CONSTRAINT "UserCollectables_collectable_id_fkey";

-- AlterTable
ALTER TABLE "UserCollectables" DROP COLUMN "collectable_id",
ADD COLUMN     "district_collectable_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "UserCollectables" ADD CONSTRAINT "UserCollectables_district_collectable_id_fkey" FOREIGN KEY ("district_collectable_id") REFERENCES "DistrictCollectables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
