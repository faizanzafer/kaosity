-- CreateEnum
CREATE TYPE "DailyBonusRewardType" AS ENUM ('TITLE', 'COINS', 'DIAMONDS', 'PROFILE_PICTURE', 'ALL_ITEMS', 'ITEMS_DO_OVER_TIME_ZONE', 'ITEMS_KAOS_VISION_MICROPHONE', 'KAOS_VISION_REWARD', 'DO_OVER_REWARD');

-- CreateTable
CREATE TABLE "DailyBonus" (
    "id" TEXT NOT NULL,
    "reward_type" "DailyBonusRewardType" NOT NULL,
    "reward_qty" INTEGER NOT NULL,
    "day_no" INTEGER,
    "pic_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyBonus_pkey" PRIMARY KEY ("id")
);
