/*
  Warnings:

  - You are about to drop the column `friend_user_id` on the `Notifications` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Notifications` table. All the data in the column will be lost.
  - Added the required column `reciever_id` to the `Notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender` to the `Notifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Notifications" DROP CONSTRAINT "Notifications_friend_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Notifications" DROP CONSTRAINT "Notifications_user_id_fkey";

-- AlterTable
ALTER TABLE "Notifications" DROP COLUMN "friend_user_id",
DROP COLUMN "user_id",
ADD COLUMN     "reciever_id" TEXT NOT NULL,
ADD COLUMN     "sender" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_sender_fkey" FOREIGN KEY ("sender") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_reciever_id_fkey" FOREIGN KEY ("reciever_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
