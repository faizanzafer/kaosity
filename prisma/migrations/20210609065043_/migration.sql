/*
  Warnings:

  - You are about to drop the column `quizId` on the `QuizQuestions` table. All the data in the column will be lost.
  - You are about to drop the `QuizCategories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuizQuestions" DROP CONSTRAINT "QuizQuestions_quizId_fkey";

-- AlterTable
ALTER TABLE "QuizQuestions" DROP COLUMN "quizId";

-- DropTable
DROP TABLE "QuizCategories";
