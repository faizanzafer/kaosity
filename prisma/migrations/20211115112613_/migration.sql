-- CreateTable
CREATE TABLE "UserPrizes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shop_item_id" TEXT NOT NULL,
    "is_prize_given" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPrizes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserPrizes" ADD CONSTRAINT "UserPrizes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrizes" ADD CONSTRAINT "UserPrizes_shop_item_id_fkey" FOREIGN KEY ("shop_item_id") REFERENCES "ShopItems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
