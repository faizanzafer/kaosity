-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "crowns_refilled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diamonds_refilled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
