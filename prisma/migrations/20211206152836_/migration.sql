-- CreateEnum
CREATE TYPE "NotificationRequestStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MATCH_REQUEST', 'RESULT');

-- CreateTable
CREATE TABLE "Notifications" (
    "id" TEXT NOT NULL,
    "status" "NotificationRequestStatus" NOT NULL DEFAULT E'PENDING',
    "user_id" TEXT NOT NULL,
    "friend_user_id" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "match_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_friend_user_id_fkey" FOREIGN KEY ("friend_user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
