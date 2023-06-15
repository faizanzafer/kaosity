/*
  Warnings:

  - You are about to drop the column `options` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `correctOption` on the `Quiz` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "options",
DROP COLUMN "correctOption";

-- CreateTable
CREATE TABLE "QuizQuestions" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionBody" VARCHAR(255) NOT NULL,
    "options" VARCHAR(150) NOT NULL,
    "correctOption" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuizQuestions" ADD FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
