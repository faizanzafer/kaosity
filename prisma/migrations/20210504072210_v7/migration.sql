-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "questions" VARCHAR(255) NOT NULL,
    "answers" VARCHAR(255) NOT NULL,
    "current_points" VARCHAR(150) NOT NULL,
    "reward_points" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);
