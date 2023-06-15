-- CreateTable
CREATE TABLE "Districts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistrictCollectables" (
    "id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "picture_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistrictCollectables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCollectables" (
    "id" TEXT NOT NULL,
    "collectable_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCollectables_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DistrictCollectables" ADD CONSTRAINT "DistrictCollectables_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "Districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCollectables" ADD CONSTRAINT "UserCollectables_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCollectables" ADD CONSTRAINT "UserCollectables_collectable_id_fkey" FOREIGN KEY ("collectable_id") REFERENCES "DistrictCollectables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
