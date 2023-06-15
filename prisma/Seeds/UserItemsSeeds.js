const { ShopItemsType } = require("@prisma/client");

const UserItemsSeeding = async (prisma) => {
  const users = await prisma.users.findMany({
    where: {
      is_registered: true,
    },
  });

  const shopItems = await prisma.shopItems.findMany({
    where: {
      type: ShopItemsType.POWERUPS,
    },
  });
  const userItems = [];

  users.forEach((user) => {
    shopItems.forEach((item) => {
      userItems.push({
        user_id: user.id,
        shop_item_id: item.id,
        quantity: 5,
      });
    });
  });

  if (userItems.length > 0) {
    await prisma.userItems.createMany({
      data: userItems,
    });
  }
};

module.exports = { UserItemsSeeding };
