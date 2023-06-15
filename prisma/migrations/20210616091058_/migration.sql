/*
  Warnings:

  - Added the required column `match_deficulty` to the `Matches` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MatchDeficulty" AS ENUM ('EASY', 'MEDIUM', 'DEFICULT');

-- AlterTable
ALTER TABLE "Matches" ADD COLUMN     "match_deficulty" "MatchDeficulty" NOT NULL;
