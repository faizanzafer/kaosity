-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "monthly_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weekly_points" INTEGER NOT NULL DEFAULT 0;
