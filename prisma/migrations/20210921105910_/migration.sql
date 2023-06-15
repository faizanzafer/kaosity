/*
  Warnings:

  - Made the column `is_registered` on table `Users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `Users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `Users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "achievement_level" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "is_registered" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "updated_at" SET NOT NULL;

-- CreateTable
CREATE TABLE "UserAchievements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "condition_type" "AchievementConditionTypes" NOT NULL,
    "condition_qty_done" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_seen" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAchievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTitles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTitles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserAchievements" ADD CONSTRAINT "UserAchievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTitles" ADD CONSTRAINT "UserTitles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
