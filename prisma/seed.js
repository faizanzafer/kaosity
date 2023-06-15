const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const { UserSeeding } = require("./Seeds/UserSeeds");
const { QuestionsSeeding } = require("./Seeds/QuestionsSeeds");
const { XPLevelSeeding } = require("./Seeds/XPLevelSeeds");
const { ShopItemsSeeding } = require("./Seeds/ShopItemsSeeds");
const { AchievementsSeeding } = require("./Seeds/AchievementsSeeds");
const { UserItemsSeeding } = require("./Seeds/UserItemsSeeds");
const { DailyBonusSeeding } = require("./Seeds/DailyBonusSeeds");
const { ColectablesSeeding } = require("./Seeds/ColectablesSeeds");
const { getEnv } = require("../config");

async function main() {
  // Users Seeding
  await UserSeeding(prisma);

  // Questions Seeding
  await QuestionsSeeding(prisma);

  // XPLevels Seeding
  await XPLevelSeeding(prisma);

  // Shop Items Seeding
  await ShopItemsSeeding(prisma);

  // Achievements Seeding
  await AchievementsSeeding(prisma);

  // Creating default 5 for each shop items
  await UserItemsSeeding(prisma);

  // Daily Bonus Seeding
  await DailyBonusSeeding(prisma);

  // Colectables Seeding
  await ColectablesSeeding(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
