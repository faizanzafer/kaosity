/*
  Warnings:

  - The `answers` column on the `Quiz` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `UserId` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "UserId" TEXT NOT NULL,
DROP COLUMN "answers",
ADD COLUMN     "answers" TEXT[],
ALTER COLUMN "reward_points" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Quiz" ADD FOREIGN KEY ("UserId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
