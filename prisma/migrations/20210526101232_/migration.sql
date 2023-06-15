/*
  Warnings:

  - You are about to drop the column `UserId` on the `Friends` table. All the data in the column will be lost.
  - You are about to drop the column `FriendUserId` on the `Friends` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,friend_user_id]` on the table `Friends` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `Friends` table without a default value. This is not possible if the table is not empty.
  - Added the required column `friend_user_id` to the `Friends` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('SOLO', 'VSFRIEND');

-- DropForeignKey
ALTER TABLE "Friends" DROP CONSTRAINT "Friends_FriendUserId_fkey";

-- DropForeignKey
ALTER TABLE "Friends" DROP CONSTRAINT "Friends_UserId_fkey";

-- DropIndex
DROP INDEX "Friends.UserId_FriendUserId_unique";

-- AlterTable
ALTER TABLE "Friends" DROP COLUMN "UserId",
DROP COLUMN "FriendUserId",
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "friend_user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Matches" (
    "id" TEXT NOT NULL,
    "match_type" "MatchType" NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "friend_user_id" VARCHAR(150) NOT NULL,
    "winner_id" VARCHAR(150) NOT NULL,
    "winner_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Friends.user_id_friend_user_id_unique" ON "Friends"("user_id", "friend_user_id");

-- AddForeignKey
ALTER TABLE "Friends" ADD FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friends" ADD FOREIGN KEY ("friend_user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
