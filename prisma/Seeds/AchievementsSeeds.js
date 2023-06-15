const achievements = require("../dumped_data/achievements");

const AchievementsSeeding = async (prisma) => {
  for await (const achievement of achievements) {
    const achievement_conditions = achievement.achievement_conditions.map(
      (ac) => {
        return {
          condition_type: ac.condition_type,
          condition_qty: ac.condition_qty,
          reward_type: ac.reward_type,
          reward_qty: ac.reward_qty,
          reward: ac.reward,
        };
      }
    );

    await prisma.achievements.create({
      data: {
        level: achievement.level,
        achievement_conditions: {
          createMany: {
            data: achievement_conditions,
          },
        },
      },
    });
  }
};

module.exports = { AchievementsSeeding };
