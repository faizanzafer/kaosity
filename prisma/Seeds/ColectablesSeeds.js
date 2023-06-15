const { getEnv } = require("../../config");
const { CONSTANTS } = require("../../helpers");

const ColectablesSeeding = async (prisma) => {
  await prisma.districts.create({
    data: {
      name: "Kaos City",
      complete_picture_url: `${getEnv(
        "APP_URL"
      )}/assets/collectables/kaos_city.png`,
      collectables: {
        createMany: {
          data: [
            {
              picture_url: `${getEnv("APP_URL")}/assets/collectables/1.png`,
            },
            {
              picture_url: `${getEnv("APP_URL")}/assets/collectables/2.png`,
            },
            {
              picture_url: `${getEnv("APP_URL")}/assets/collectables/3.png`,
            },
            {
              picture_url: `${getEnv("APP_URL")}/assets/collectables/4.png`,
            },
            {
              picture_url: `${getEnv("APP_URL")}/assets/collectables/5.png`,
            },
            {
              picture_url: `${getEnv("APP_URL")}/assets/collectables/6.png`,
            },
            {
              picture_url: `${getEnv("APP_URL")}/assets/collectables/7.png`,
            },
            {
              picture_url: `${getEnv("APP_URL")}/assets/collectables/8.png`,
            },
            {
              picture_url: `${getEnv("APP_URL")}/assets/collectables/9.png`,
            },
            {
              picture_url: `${getEnv("APP_URL")}/assets/collectables/10.png`,
            },
          ],
        },
      },
    },
  });
};

module.exports = { ColectablesSeeding };
