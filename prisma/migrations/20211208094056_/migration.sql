/*
  Warnings:

  - You are about to drop the `Avatars` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Avatars";

-- CreateTable
CREATE TABLE "UserAvatars" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAvatars_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserAvatars" ADD CONSTRAINT "UserAvatars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
