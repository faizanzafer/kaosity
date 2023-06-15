-- CreateTable
CREATE TABLE "Avatars" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "is_for_reward" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avatars_pkey" PRIMARY KEY ("id")
);
