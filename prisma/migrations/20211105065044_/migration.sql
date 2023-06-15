-- CreateTable
CREATE TABLE "ClaimDailyBonus" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bonus_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimDailyBonus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClaimDailyBonus" ADD CONSTRAINT "ClaimDailyBonus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDailyBonus" ADD CONSTRAINT "ClaimDailyBonus_bonus_id_fkey" FOREIGN KEY ("bonus_id") REFERENCES "DailyBonus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
