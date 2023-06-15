-- CreateTable
CREATE TABLE "XPLevel" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "xp_required" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);
