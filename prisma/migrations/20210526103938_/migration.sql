-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('SOLO', 'VSFRIEND');

-- CreateTable
CREATE TABLE "Matches" (
    "id" TEXT NOT NULL,
    "match_type" "MatchType" NOT NULL,
    "user_id" TEXT NOT NULL,
    "friend_user_id" TEXT NOT NULL,
    "winner_id" VARCHAR(150) NOT NULL,
    "winner_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Matches" ADD FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Matches" ADD FOREIGN KEY ("friend_user_id") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
