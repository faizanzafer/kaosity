const { DailyBonusRewardType } = require(".prisma/client");
const { getEnv } = require("../../config");

const DailyBonusSeeding = async (prisma) => {
  const appUrl = getEnv("APP_URL");

  await prisma.dailyBonus.createMany({
    data: [
      {
        reward_type: DailyBonusRewardType.COINS,
        reward_qty: 500,
        day_no: 1,
        pic_url: appUrl + "/dailybonus/white_outline/coins_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/coins_reward.png",
        un_claimed_pic_url: appUrl + "/dailybonus/un_claimed/coins_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.ITEMS_KAOS_VISION_MICROPHONE,
        reward_qty: 1,
        day_no: 2,
        pic_url: appUrl + "/dailybonus/white_outline/microphone_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/microphone_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/microphone_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.COINS,
        reward_qty: 1000,
        day_no: 3,
        pic_url: appUrl + "/dailybonus/white_outline/coins_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/coins_reward.png",
        un_claimed_pic_url: appUrl + "/dailybonus/un_claimed/coins_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.ITEMS_DO_OVER_TIME_ZONE,
        reward_qty: 1,
        day_no: 4,
        pic_url: appUrl + "/dailybonus/white_outline/time_zone_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/time_zone_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/time_zone_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.DIAMONDS,
        reward_qty: 1,
        day_no: 5,
        pic_url: appUrl + "/dailybonus/white_outline/diamond_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/diamond_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/diamond_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.COINS,
        reward_qty: 1500,
        day_no: 6,
        pic_url: appUrl + "/dailybonus/white_outline/coins_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/coins_reward.png",
        un_claimed_pic_url: appUrl + "/dailybonus/un_claimed/coins_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.DO_OVER_REWARD,
        reward_qty: 1,
        day_no: 7,
        pic_url: appUrl + "/dailybonus/white_outline/do_over_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/do_over_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/do_over_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.COINS,
        reward_qty: 2000,
        day_no: 8,
        pic_url: appUrl + "/dailybonus/white_outline/coins_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/coins_reward.png",
        un_claimed_pic_url: appUrl + "/dailybonus/un_claimed/coins_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.KAOS_VISION_REWARD,
        reward_qty: 1,
        day_no: 9,
        pic_url: appUrl + "/dailybonus/white_outline/kaos_vision_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/kaos_vision_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/kaos_vision_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.DIAMONDS,
        reward_qty: 2,
        day_no: 10,
        pic_url: appUrl + "/dailybonus/white_outline/diamond_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/diamond_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/diamond_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.ITEMS_DO_OVER_TIME_ZONE,
        reward_qty: 2,
        day_no: 11,
        pic_url: appUrl + "/dailybonus/white_outline/time_zone_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/time_zone_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/time_zone_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.COINS,
        reward_qty: 2500,
        day_no: 12,
        pic_url: appUrl + "/dailybonus/white_outline/coins_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/coins_reward.png",
        un_claimed_pic_url: appUrl + "/dailybonus/un_claimed/coins_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.ITEMS_KAOS_VISION_MICROPHONE,
        reward_qty: 2,
        day_no: 13,
        pic_url: appUrl + "/dailybonus/white_outline/microphone_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/microphone_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/microphone_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.COINS,
        reward_qty: 3000,
        day_no: 14,
        pic_url: appUrl + "/dailybonus/white_outline/coins_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/coins_reward.png",
        un_claimed_pic_url: appUrl + "/dailybonus/un_claimed/coins_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.DIAMONDS,
        reward_qty: 3,
        day_no: 15,
        pic_url: appUrl + "/dailybonus/white_outline/diamond_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/diamond_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/diamond_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.COINS,
        reward_qty: 3500,
        day_no: 16,
        pic_url: appUrl + "/dailybonus/white_outline/coins_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/coins_reward.png",
        un_claimed_pic_url: appUrl + "/dailybonus/un_claimed/coins_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.KAOS_VISION_REWARD,
        reward_qty: 2,
        day_no: 17,
        pic_url: appUrl + "/dailybonus/white_outline/kaos_vision_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/kaos_vision_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/kaos_vision_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.COINS,
        reward_qty: 4000,
        day_no: 18,
        pic_url: appUrl + "/dailybonus/white_outline/coins_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/coins_reward.png",
        un_claimed_pic_url: appUrl + "/dailybonus/un_claimed/coins_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.DO_OVER_REWARD,
        reward_qty: 2,
        day_no: 19,
        pic_url: appUrl + "/dailybonus/white_outline/do_over_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/do_over_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/do_over_reward.png",
      },
      {
        reward_type: DailyBonusRewardType.DIAMONDS,
        reward_qty: 4,
        day_no: 20,
        pic_url: appUrl + "/dailybonus/white_outline/diamond_reward.png",
        claimed_pic_url: appUrl + "/dailybonus/claimed/diamond_reward.png",
        un_claimed_pic_url:
          appUrl + "/dailybonus/un_claimed/diamond_reward.png",
      },
    ],
  });
};

module.exports = { DailyBonusSeeding };
