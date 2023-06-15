/*
  Warnings:

  - You are about to drop the `FriendRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FriendRequest" DROP CONSTRAINT "FriendRequest_UserId_fkey";

-- DropTable
DROP TABLE "FriendRequest";

-- CreateTable
CREATE TABLE "Friends" (
    "id" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "FriendUserId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT E'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Friends.UserId_FriendUserId_unique" ON "Friends"("UserId", "FriendUserId");

-- AddForeignKey
ALTER TABLE "Friends" ADD FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friends" ADD FOREIGN KEY ("FriendUserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
