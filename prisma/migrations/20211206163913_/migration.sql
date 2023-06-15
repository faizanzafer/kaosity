-- CreateEnum
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'FRIEND';

-- AlterTable
ALTER TABLE "Notifications" ADD COLUMN     "friend_request_id" TEXT;

-- CreateTable
CREATE TABLE "FriendUsers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "friend_user_id" TEXT NOT NULL,
    "status" "FriendRequestStatus" NOT NULL DEFAULT E'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendUsers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FriendUsers" ADD CONSTRAINT "FriendUsers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendUsers" ADD CONSTRAINT "FriendUsers_friend_user_id_fkey" FOREIGN KEY ("friend_user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_friend_request_id_fkey" FOREIGN KEY ("friend_request_id") REFERENCES "FriendUsers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
