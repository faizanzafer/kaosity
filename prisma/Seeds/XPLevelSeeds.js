const XPLevelSeeding = async (prisma) => {
  await prisma.xPLevel.createMany({
    data: [
      {
        level: 1,
        xp_required: 100,
      },
      {
        level: 2,
        xp_required: 300,
      },
      {
        level: 3,
        xp_required: 300,
      },
      {
        level: 4,
        xp_required: 400,
      },
      {
        level: 5,
        xp_required: 500,
      },
      {
        level: 6,
        xp_required: 600,
      },
      {
        level: 7,
        xp_required: 700,
      },
      {
        level: 8,
        xp_required: 800,
      },
      {
        level: 9,
        xp_required: 900,
      },
      {
        level: 10,
        xp_required: 1000,
      },
      {
        level: 11,
        xp_required: 1200,
      },
      {
        level: 12,
        xp_required: 1400,
      },
      {
        level: 13,
        xp_required: 1600,
      },
      {
        level: 14,
        xp_required: 1800,
      },
      {
        level: 14,
        xp_required: 2000,
      },
    ],
    skipDuplicates: true,
  });
};

module.exports = { XPLevelSeeding };
