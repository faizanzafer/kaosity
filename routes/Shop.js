const router = require("express").Router();
const _ = require("lodash");
const trimRequest = require("trim-request");
const prisma = require("../_Prisma");
const { getEnv } = require("../config");
const { cardToken, chargeCard } = require("../Stripe");
const {
  sendError,
  sendSuccess,
  createToken,
  myInventory,
  CONSTANTS,
} = require("../helpers");
const { ShopItemsType } = require("@prisma/client");
const { purchaseValidation, usedItemsValidation } = require("./validate");

//
//
//
//

router.get("/get_inventory_items", async (req, res) => {
  try {
    const inventory_items = await prisma.shopItems.findMany({
      where: {
        type: ShopItemsType.POWERUPS,
      },
    });

    return sendSuccess(res, { inventory_items });
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.get("/get_shop_items", async (req, res) => {
  try {
    const shop_items = await prisma.shopItems.findMany();

    const prizes_shop = shop_items
      .filter((_) => _.type == ShopItemsType.PRIZES)
      .map((_) => {
        if (_.description) _.description = JSON.parse(_.description);
        return _;
      });

    const cosmetics_shop = shop_items.filter(
      (_) => _.type == ShopItemsType.COSMETICS
    );

    const coins_shop = shop_items.filter((_) => _.type == ShopItemsType.COINS);

    const power_ups = shop_items.filter(
      (_) => _.type == ShopItemsType.POWERUPS
    );

    const special_offers = shop_items
      .filter((_) => _.type == ShopItemsType.SPECIAL_OFFER)
      .map((_) => {
        if (_.description) _.description = JSON.parse(_.description);
        return _;
      });

    return sendSuccess(res, {
      prizes_shop,
      cosmetics_shop,
      coins_shop,
      power_ups,
      special_offers,
    });
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.post("/purchase_item", trimRequest.all, async (req, res) => {
  try {
    const { value, error } = purchaseValidation(req.body);
    if (error) return sendError(res, error.details[0].message);

    const { card_number, exp_month, exp_year, cvc_number, item_id } = value;
    const { _id: my_id, user_name, current_points } = req.user;

    const shopItem = await prisma.shopItems.findUnique({
      where: {
        id: item_id,
      },
    });
    if (!shopItem) return sendError(res, "Shop item do not exist.");

    if (shopItem.type == ShopItemsType.COINS) {
      if (!card_number) return sendError(res, "card_number is required.");

      const card_token = await cardToken({
        card_number,
        exp_month,
        exp_year,
        cvc_number,
      });

      await chargeCard({
        card_token: card_token.id,
        amount: shopItem.price * 100,
        description: `${user_name} purchased ${shopItem.quantity} coins pack.`,
      });

      const updatedUser = await prisma.users.update({
        where: {
          id: my_id,
        },
        data: {
          current_points: current_points + shopItem.quantity,
        },
      });
      return sendSuccess(res, { user_token: await createToken(updatedUser) });
    } else if (shopItem.type == ShopItemsType.SPECIAL_OFFER) {
      if (!card_number) return sendError(res, "card_number is required.");

      const card_token = await cardToken({
        card_number,
        exp_month,
        exp_year,
        cvc_number,
      });

      await chargeCard({
        card_token: card_token.id,
        amount: shopItem.price * 100,
        description: `${user_name} purchased ${shopItem.quantity} special offer bundle.`,
      });

      let updatedUser = req.user;
      const offer_description = JSON.parse(shopItem.description);

      for (const obj of offer_description) {
        if (obj.type == CONSTANTS.SpecialOfferItems.DIAMONDS) {
          updatedUser = await prisma.users.update({
            where: {
              id: my_id,
            },
            data: {
              diamonds: {
                increment: parseInt(obj.qty),
              },
            },
          });
        } else if (obj.type == CONSTANTS.SpecialOfferItems.CROWN) {
          updatedUser = await prisma.users.update({
            where: {
              id: my_id,
            },
            data: {
              crowns: {
                increment: parseInt(obj.qty),
              },
            },
          });
        } else if (obj.type == CONSTANTS.SpecialOfferItems.COINS) {
          updatedUser = await prisma.users.update({
            where: {
              id: my_id,
            },
            data: {
              current_points: {
                increment: parseInt(obj.qty),
              },
            },
          });
        } else if (obj.type == CONSTANTS.SpecialOfferItems.PROFILE_PICTURE) {
          const profile_picture = _.snakeCase(obj.picture);
          const offerName = "The diamond is unbreakable pack";
          const special = "The main contender pack";
          const isAvatar = await prisma.userAvatars.findFirst({
            where: {
              user_id: my_id,
              name: offerName,
            },
          });
          const isAvatarExist = await prisma.userAvatars.findFirst({
            where: {
              user_id: my_id,
              name: special,
            },
          });
          if (!isAvatar) {
            if (shopItem.name == "The diamond is unbreakable pack") {
              await prisma.userAvatars.create({
                data: {
                  user_id: my_id,
                  name: offerName,
                  url: `${getEnv(
                    "APP_URL"
                  )}/assets/avatars/${profile_picture}.png`,
                },
              });
            }
          }
          if (!isAvatarExist) {
            if (shopItem.name == special) {
              await prisma.userAvatars.create({
                data: {
                  user_id: my_id,
                  name: special,
                  url: `${getEnv(
                    "APP_URL"
                  )}/assets/avatars/${profile_picture}.png`,
                },
              });
            }
          }
          updatedUser = await prisma.users.update({
            where: {
              id: my_id,
            },
            data: {
              avatar_url: `${getEnv(
                "APP_URL"
              )}/assets/avatars/${profile_picture}.png`,
            },
          });
        } else if (obj.type == CONSTANTS.SpecialOfferItems.TITLE) {
          const alreadyHave = await prisma.userTitles.findFirst({
            where: {
              user_id: my_id,
              title: obj.title,
            },
          });
          if (!alreadyHave) {
            await prisma.userTitles.create({
              data: {
                user_id: my_id,
                title: obj.title,
              },
            });
          }
        } else if (obj.type == CONSTANTS.SpecialOfferItems.ALL_ITEMS) {
          const userItems = await prisma.userItems.findMany({
            where: {
              user_id: my_id,
            },
          });

          for (const userItem of userItems) {
            await prisma.userItems.update({
              where: {
                id: userItem.id,
              },
              data: {
                quantity: { increment: parseInt(obj.qty) },
              },
            });
          }
        }
      }

      return sendSuccess(res, { user_token: await createToken(updatedUser) });
    } else if (shopItem.type == ShopItemsType.POWERUPS) {
      if (shopItem.price > current_points)
        return sendError(
          res,
          "You do not have enough coins to purchase this item."
        );

      const userItem = await prisma.userItems.findFirst({
        where: {
          shop_item_id: shopItem.id,
          user_id: my_id,
        },
      });

      if (userItem) {
        if (userItem.quantity >= 16)
          return sendError(res, "Only 16 of each item can be purchased.");

        await prisma.userItems.update({
          where: {
            id: userItem.id,
          },
          data: {
            quantity: userItem.quantity + shopItem.quantity,
          },
        });
      } else {
        await prisma.userItems.create({
          data: {
            shop_item_id: shopItem.id,
            user_id: my_id,
            quantity: shopItem.quantity,
          },
        });
      }

      const updatedUser = await prisma.users.update({
        where: {
          id: my_id,
        },
        data: {
          current_points: current_points - shopItem.price,
        },
      });

      return sendSuccess(res, {
        user_token: await createToken(updatedUser),
        my_inventory: await myInventory(my_id),
      });
    } else if (shopItem.type == ShopItemsType.PRIZES) {
      if (shopItem.price > current_points)
        return sendError(
          res,
          "You do not have enough coins to purchase this item."
        );

      await prisma.userPrizes.create({
        data: {
          shop_item_id: shopItem.id,
          user_id: my_id,
        },
      });

      const updatedUser = await prisma.users.update({
        where: {
          id: my_id,
        },
        data: {
          current_points: current_points - shopItem.price,
        },
      });

      return sendSuccess(res, {
        user_token: await createToken(updatedUser),
      });
    } else {
      return sendError(res, {
        internal_error:
          "Only coins and Powerups can be purchased at this time.",
      });
    }
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

module.exports = router;
