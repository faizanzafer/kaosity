/*
  Warnings:

  - You are about to drop the `Quiz` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuizQuestions" DROP CONSTRAINT "QuizQuestions_quizId_fkey";

-- DropTable
DROP TABLE "Quiz";

-- CreateTable
CREATE TABLE "QuizCategories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "image" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuizQuestions" ADD FOREIGN KEY ("quizId") REFERENCES "QuizCategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
