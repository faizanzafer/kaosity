const { ShopItemsType } = require("@prisma/client");

const { getEnv } = require("../../config");
const { CONSTANTS } = require("../../helpers");

const ShopItemsSeeding = async (prisma) => {
  await prisma.shopItems.createMany({
    data: [
      //ShopItemsType.COINS
      {
        type: ShopItemsType.COINS,
        quantity: 1600,
        price: 4.99,
        picture_url: `${getEnv("APP_URL")}/assets/coins_bundles/1600.png`,
      },
      {
        type: ShopItemsType.COINS,
        quantity: 20000,
        price: 59.99,
        picture_url: `${getEnv("APP_URL")}/assets/coins_bundles/20000.png`,
      },
      {
        type: ShopItemsType.COINS,
        quantity: 300,
        price: 0.99,
        picture_url: `${getEnv("APP_URL")}/assets/coins_bundles/300.png`,
      },
      {
        type: ShopItemsType.COINS,
        quantity: 3500,
        price: 9.99,
        picture_url: `${getEnv("APP_URL")}/assets/coins_bundles/3500.png`,
      },
      {
        type: ShopItemsType.COINS,
        quantity: 8000,
        price: 24.99,
        picture_url: `${getEnv("APP_URL")}/assets/coins_bundles/8000.png`,
      },
      //ShopItemsType.POWERUPS
      {
        name: "Kaos Vision",
        description:
          "that allows players to see a wrong answer. When used, one of the incorrect answers will reveal itself, narrowing down the possible answers to 3.",
        quantity: 1,
        price: 25,
        type: ShopItemsType.POWERUPS,
        picture_url: `${getEnv("APP_URL")}/assets/inventory/Group_1183.png`,
      },
      {
        name: "Microphone",
        description:
          "Microphone will have an “ask the audience” like mechanic. When used, each answer will display a percentage possibility of being the correct answer.",
        quantity: 1,
        price: 15,
        type: ShopItemsType.POWERUPS,
        picture_url: `${getEnv("APP_URL")}/assets/inventory/Group_1192.png`,
      },
      {
        name: "Do-Over",
        description:
          "Do-Over is an item that lets players swap out a question when they are unaware of the answer. When a player uses this item, the question will be replaced and the 10 second timer will reset.",
        quantity: 1,
        price: 10,
        type: ShopItemsType.POWERUPS,
        picture_url: `${getEnv("APP_URL")}/assets/inventory/Group_1194.png`,
      },
      {
        name: "Time Zone",
        description:
          "Time Zone is an item that adds time to the question timer based on how many questions have already been answered. Questions 1 to 5 add 5 seconds. Questions 6 to 10 add 10 seconds. Questions 11 to 15 add 15 seconds.",
        quantity: 1,
        price: 10,
        type: ShopItemsType.POWERUPS,
        picture_url: `${getEnv("APP_URL")}/assets/inventory/Group_1202.png`,
      },
      // ShopItemsType.SPECIAL_OFFER
      {
        name: "The trivia master Pack",
        description: JSON.stringify([
          {
            type: CONSTANTS.SpecialOfferItems.DIAMONDS,
            qty: 10,
            picture_url: `${getEnv(
              "APP_URL"
            )}/assets/special_bundles/diamond_special_bundle.png`,
          },
          {
            type: CONSTANTS.SpecialOfferItems.ALL_ITEMS,
            qty: 2,
            picture_url: `${getEnv(
              "APP_URL"
            )}/assets/special_bundles/all_items_special_bundle.png`,
          },
          {
            type: CONSTANTS.SpecialOfferItems.COINS,
            qty: 3500,
            picture_url: `${getEnv(
              "APP_URL"
            )}/assets/special_bundles/coins_special_bundle.png`,
          },
        ]),
        price: 14.99,
        quantity: 1,
        type: ShopItemsType.SPECIAL_OFFER,
      },
      {
        name: "The diamond is unbreakable pack",
        description: JSON.stringify([
          {
            type: CONSTANTS.SpecialOfferItems.DIAMONDS,
            qty: 20,
            picture_url: `${getEnv(
              "APP_URL"
            )}/assets/special_bundles/diamond_special_bundle.png`,
          },
          {
            type: CONSTANTS.SpecialOfferItems.PROFILE_PICTURE,
            picture: "Diamond",
            qty: 1,
            picture_url: `${getEnv(
              "APP_URL"
            )}/assets/special_bundles/diamond_profile_picture_special_bundle.png`,
          },
          {
            type: CONSTANTS.SpecialOfferItems.TITLE,
            title: "Ice baby",
            qty: 1,
            picture_url: `${getEnv(
              "APP_URL"
            )}/assets/special_bundles/title_special_bundle.png`,
          },
        ]),
        price: 11.99,
        quantity: 1,
        type: ShopItemsType.SPECIAL_OFFER,
      },
      {
        name: "The main contender pack",
        description: JSON.stringify([
          {
            type: CONSTANTS.SpecialOfferItems.CROWN,
            qty: 10,
            picture_url: `${getEnv(
              "APP_URL"
            )}/assets/special_bundles/crown_special_bundle.png`,
          },
          {
            type: CONSTANTS.SpecialOfferItems.TITLE,
            title: "Main Contender",
            qty: 1,
            picture_url: `${getEnv(
              "APP_URL"
            )}/assets/special_bundles/title_special_bundle.png`,
          },
          {
            type: CONSTANTS.SpecialOfferItems.PROFILE_PICTURE,
            picture: "Trivia Champ",
            qty: 1,
            picture_url: `${getEnv(
              "APP_URL"
            )}/assets/special_bundles/trivia_champ_profile_picture_special_bundle.png`,
          },
          {
            type: CONSTANTS.SpecialOfferItems.ALL_ITEMS,
            qty: 3,
            picture_url: `${getEnv(
              "APP_URL"
            )}/assets/special_bundles/all_items_special_bundle.png`,
          },
        ]),
        price: 7.99,
        quantity: 1,
        type: ShopItemsType.SPECIAL_OFFER,
      },
      // ShopItemsType.PRIZES
      // ShopItemsType.PRIZES for 9000 coins
      {
        name: "Google play $10 gift card",
        description: JSON.stringify([
          {
            type: CONSTANTS.Prizes.GOOGLE_PLAY,
          },
        ]),
        picture_url: `${getEnv("APP_URL")}/assets/prizes/google_play.png`,
        price: 9000,
        quantity: 1,
        type: ShopItemsType.PRIZES,
      },
      {
        name: "Amazon $10 gift card",
        description: JSON.stringify([
          {
            type: CONSTANTS.Prizes.AMAZON,
          },
        ]),
        picture_url: `${getEnv("APP_URL")}/assets/prizes/amazon.png`,
        price: 9000,
        quantity: 1,
        type: ShopItemsType.PRIZES,
      },
      {
        name: "Uber $10 gift card",
        description: JSON.stringify([
          {
            type: CONSTANTS.Prizes.UBER,
          },
        ]),
        picture_url: `${getEnv("APP_URL")}/assets/prizes/uber.png`,
        price: 9000,
        quantity: 1,
        type: ShopItemsType.PRIZES,
      },
      {
        name: "Walmart $10 gift card",
        description: JSON.stringify([
          {
            type: CONSTANTS.Prizes.WALMART,
          },
        ]),
        picture_url: `${getEnv("APP_URL")}/assets/prizes/walmart.png`,
        price: 9000,
        quantity: 1,
        type: ShopItemsType.PRIZES,
      },
      // ShopItemsType.PRIZES for 100,000 coins
      {
        name: "XBox 12 months subscription",
        description: JSON.stringify([
          {
            type: CONSTANTS.Prizes.XBOX,
          },
        ]),
        picture_url: `${getEnv("APP_URL")}/assets/prizes/xbox.png`,
        price: 100000,
        quantity: 1,
        type: ShopItemsType.PRIZES,
      },
      {
        name: "Play station 12 months subscription",
        description: JSON.stringify([
          {
            type: CONSTANTS.Prizes.PLAY_STATION,
          },
        ]),
        picture_url: `${getEnv("APP_URL")}/assets/prizes/play_station.png`,
        price: 100000,
        quantity: 1,
        type: ShopItemsType.PRIZES,
      },
    ],
    skipDuplicates: true,
  });
};

module.exports = { ShopItemsSeeding };
