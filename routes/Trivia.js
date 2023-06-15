const router = require("express").Router();
const _ = require("lodash");
const prisma = require("../_Prisma");
const { sendError, sendSuccess, getSuccessData } = require("../helpers");
const {
  RequestStatus,
  UserRole,
  MatchStatus,
  MatchType,
  FriendRequestStatus,
} = require(".prisma/client");
const { getEnv } = require("../config");
const avatars = require("../avatars").avatars;

/** Get Users Lists */
router.get("/categories", async (req, res) => {
  const quizCategories = await prisma.quizCategories.findMany({});
  return sendSuccess(res, quizCategories);
});

/** Get Users Lists */
router.get("/user_list", async (req, res) => {
  try {
    const my_id = req.user._id;

    const userlisting = await prisma.users.findMany({
      where: {
        NOT: [
          {
            id: my_id,
          },
          {
            friend_requests_sender: {
              some: {
                friend_user_id: my_id,
                status: FriendRequestStatus.ACCEPTED,
              },
            },
          },
          {
            friend_requests_reciever: {
              some: {
                user_id: my_id,
                status: FriendRequestStatus.ACCEPTED,
              },
            },
          },
        ],
        role: UserRole.USER,
      },
      select: {
        id: true,
        user_name: true,
        email: true,
        avatar_url: true,
        friend_requests_sender: {
          where: {
            friend_user_id: my_id,
          },
        },
        friend_requests_reciever: {
          where: {
            user_id: my_id,
          },
        },
      },
    });

    const friendList = [];

    userlisting.forEach((user) => {
      if (user.friend_requests_sender.length <= 0) {
        friendList.push(user);
      } else if (user.friend_requests_reciever.length <= 0) {
        friendList.push(user);
      } else if (
        user.friend_requests_sender.length > 0 &&
        user.friend_requests_sender[0]?.status != RequestStatus.ACCEPTED
      )
        friendList.push(user);
      else if (
        user.friend_requests_reciever.length > 0 &&
        user.friend_requests_reciever[0]?.status != RequestStatus.ACCEPTED
      )
        friendList.push(user);
    });

    friendList.forEach((ary) => {
      if (ary.friend_requests_reciever.length > 0) {
        ary.is_request = true;
      } else {
        ary.is_request = false;
      }
      delete ary.friend_requests_reciever;
      delete ary.friend_requests_sender;
    });

    return sendSuccess(res, friendList);
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

/** Friend Listing About Single User */
router.get("/friend_list", async (req, res) => {
  try {
    const user_id = req.user._id;

    const userFriends = await prisma.users.findFirst({
      where: {
        id: user_id,
        role: UserRole.USER,
      },
      select: {
        id: true,
        friend_requests_sender: {
          where: {
            status: RequestStatus.ACCEPTED,
          },
          select: {
            friend_request_send_to_me: {
              select: {
                id: true,
                email: true,
                user_name: true,
                avatar_url: true,
                current_points: true,
                matches_i_starts: {
                  where: {
                    friend_user_id: user_id,
                    match_type: MatchType.VSFRIEND,
                    match_status_for_friend_user_id: MatchStatus.COMPLETED,
                    match_status_for_user_id: MatchStatus.COMPLETED,
                  },
                },
                matches_where_i_invited: {
                  where: {
                    user_id,
                    match_type: MatchType.VSFRIEND,
                    match_status_for_user_id: MatchStatus.COMPLETED,
                    match_status_for_friend_user_id: MatchStatus.COMPLETED,
                  },
                },
              },
            },
          },
        },
        friend_requests_reciever: {
          where: {
            status: RequestStatus.ACCEPTED,
          },
          select: {
            i_send_friend_request: {
              select: {
                id: true,
                email: true,
                user_name: true,
                avatar_url: true,
                current_points: true,
                matches_i_starts: {
                  where: {
                    friend_user_id: user_id,
                    match_type: MatchType.VSFRIEND,
                    match_status_for_user_id: MatchStatus.COMPLETED,
                    match_status_for_friend_user_id: MatchStatus.COMPLETED,
                  },
                },
                matches_where_i_invited: {
                  where: {
                    user_id,
                    match_type: MatchType.VSFRIEND,
                    match_status_for_user_id: MatchStatus.COMPLETED,
                    match_status_for_friend_user_id: MatchStatus.COMPLETED,
                  },
                },
              },
            },
          },
        },
      },
    });

    const friends = [];

    userFriends.friend_requests_reciever.forEach((request) => {
      const matches_where_i_invited =
        request?.i_send_friend_request?.matches_where_i_invited ?? [];
      const matches_i_starts =
        request?.i_send_friend_request?.matches_i_starts ?? [];

      const friendWinCount =
        matches_where_i_invited.filter((x) => x.winner_id != user_id).length +
        matches_i_starts.filter((x) => x.winner_id != user_id).length;

      const friendLoseCount =
        matches_where_i_invited.filter((x) => x.winner_id == user_id).length +
        matches_i_starts.filter((x) => x.winner_id == user_id).length;

      const iSendRequest = request.i_send_friend_request;
      iSendRequest.winned_matches = friendWinCount;
      iSendRequest.lossed_matches = friendLoseCount;
      friends.push(iSendRequest);
      delete iSendRequest.matches_i_starts;
      delete iSendRequest.matches_where_i_invited;
    });

    userFriends.friend_requests_sender.forEach((request) => {
      const matches_where_i_invited =
        request?.friend_request_send_to_me?.matches_where_i_invited ?? [];
      const matches_i_starts =
        request?.friend_request_send_to_me?.matches_i_starts ?? [];

      const friendWinCount =
        matches_where_i_invited.filter((x) => x.winner_id != user_id).length +
        matches_i_starts.filter((x) => x.winner_id != user_id).length;

      const friendLoseCount =
        matches_where_i_invited.filter((x) => x.winner_id == user_id).length +
        matches_i_starts.filter((x) => x.winner_id == user_id).length;

      const iSendRequest = request.friend_request_send_to_me;
      iSendRequest.winned_matches = friendWinCount;
      iSendRequest.lossed_matches = friendLoseCount;
      friends.push(iSendRequest);
      delete iSendRequest.matches_i_starts;
      delete iSendRequest.matches_where_i_invited;
    });

    const friendsData = _.sortBy(friends, ["user_name", "email"]);

    return sendSuccess(res, { friendsData });
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

/** User Search By User Name */
router.get("/search_friend", async (req, res) => {
  try {
    const friends = await prisma.users.findMany({
      where: {
        user_name: {
          contains: req.query.user_name,
        },
      },
    });
    return res.status(200).json({
      sucess: true,
      data: friends,
    });
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

/** Update Status Of Friend Request */
router.get("/app_utilities", async (req, res) => {
  const MAX_CURRENCY = getEnv("MAX_CURRENCY");
  const REFILL_TIME = getEnv("REFILL_TIME");
  try {
    const {
      _id: user_id,
      achievement_level,
      diamonds,
      diamonds_refilled_at,
      crowns,
      crowns_refilled_at,
    } = req.user;

    const achievements = await prisma.achievements.findMany({
      where: {
        level: {
          lte: achievement_level + 1,
        },
      },
      include: {
        achievement_conditions: true,
      },
    });

    const user_achievements = await prisma.userAchievements.findMany({
      where: {
        user_id,
      },
    });

    achievements.forEach((achievement) => {
      const level = achievement.level;
      const achievementConditions = achievement.achievement_conditions;

      if (level > achievement_level) {
        achievement.is_locked = true;
        achievement.achievement_conditions = [];
        return;
      }

      achievementConditions.forEach((ac) => {
        ac.is_seen = false;
        ac.is_completed = false;
        ac.is_reward_claimed = false;
        ac.condition_qty_done = 0;

        const userAchievement = user_achievements.find(
          (ua) => ua.level == level && ua.condition_type == ac.condition_type
        );

        if (ac.reward_type == "TITLE") {
          ac.reward_url = `${getEnv(
            "APP_URL"
          )}/assets/achievements/title_reward.png`;
        } else if (ac.reward_type == "PROFILE_PICTURE") {
          ac.reward_url = `${getEnv(
            "APP_URL"
          )}/assets/achievements/profile_picture_reward.png`;
        } else if (ac.reward_type == "COINS") {
          ac.reward_url = `${getEnv(
            "APP_URL"
          )}/assets/achievements/coins_reward.png`;
        } else if (ac.reward_type == "DIAMONDS") {
          ac.reward_url = `${getEnv(
            "APP_URL"
          )}/assets/achievements/diamond_reward.png`;
        } else if (ac.reward_type == "ITEMS_DO_OVER_TIME_ZONE") {
          ac.reward_url = `${getEnv(
            "APP_URL"
          )}/assets/achievements/do_over_reward.png`;
        } else if (ac.reward_type == "ITEMS_KAOS_VISION_MICROPHONE") {
          ac.reward_url = `${getEnv(
            "APP_URL"
          )}/assets/achievements/kaos_vision_reward.png`;
        } else if (ac.reward_type == "ALL_ITEMS") {
          ac.reward_url = `${getEnv(
            "APP_URL"
          )}/assets/achievements/all_items_reward.png`;
        }

        if (userAchievement) {
          ac.condition_qty_done = userAchievement.condition_qty_done;
          ac.is_reward_claimed = userAchievement.is_reward_claimed;
          ac.is_completed = userAchievement.is_completed;
          ac.is_seen = userAchievement.is_seen;
        }

        ac.condition_type = _.capitalize(_.lowerCase(ac.condition_type));
      });
    });

    const now = new Date();
    let user_frontend_currencies = {};

    const getCurrencyToUpdate = (currency, currency_refilled_at) => {
      if (currency < MAX_CURRENCY) {
        const timeDiffInMins =
          (now.getTime() - currency_refilled_at.getTime()) / 1000 / 60;

        const addCurrency = parseInt(timeDiffInMins / REFILL_TIME);
        if (addCurrency > 0) {
          const finalCurrency = currency + addCurrency;

          return {
            timeDiffInMins,
            increment:
              finalCurrency >= MAX_CURRENCY
                ? MAX_CURRENCY - currency
                : addCurrency,
          };
        }
        return {
          timeDiffInMins,
        };
      }
    };

    const updatedDiamonds = getCurrencyToUpdate(diamonds, diamonds_refilled_at);
    const updatedCrowns = getCurrencyToUpdate(crowns, crowns_refilled_at);

    const updatedUser = await prisma.users.update({
      where: {
        id: user_id,
      },
      data: {
        diamonds: updatedDiamonds?.increment
          ? {
              increment: updatedDiamonds?.increment,
            }
          : undefined,
        diamonds_refilled_at: updatedDiamonds?.increment ? now : undefined,
        crowns: updatedCrowns?.increment
          ? {
              increment: updatedCrowns?.increment,
            }
          : undefined,
        crowns_refilled_at: updatedCrowns?.increment ? now : undefined,
      },
    });

    if (updatedUser.diamonds < MAX_CURRENCY) {
      const secRequiredToRefil =
        // (MAX_CURRENCY - updatedUser.diamonds) *
        (REFILL_TIME - updatedDiamonds.timeDiffInMins) * 60;

      user_frontend_currencies.diamonds = {
        count: updatedUser.diamonds,
        time_required_to_refill:
          secRequiredToRefil < 0
            ? parseInt(REFILL_TIME * 60)
            : parseInt(secRequiredToRefil),
      };
    } else {
      user_frontend_currencies.diamonds = {
        count: updatedUser.diamonds,
        time_required_to_refill: 0,
      };
    }

    if (updatedUser.crowns < MAX_CURRENCY) {
      const secRequiredToRefil =
        // (MAX_CURRENCY - updatedUser.crowns) *
        (REFILL_TIME - updatedCrowns.timeDiffInMins) * 60;

      user_frontend_currencies.crowns = {
        count: updatedUser.crowns,
        time_required_to_refill:
          secRequiredToRefil < 0
            ? parseInt(REFILL_TIME * 60)
            : parseInt(secRequiredToRefil),
      };
    } else {
      user_frontend_currencies.crowns = {
        count: updatedUser.crowns,
        time_required_to_refill: 0,
      };
    }

    return sendSuccess(res, { achievements, user_frontend_currencies });
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.get("/get_avatars", async (req, res) => {
  const { _id: user_id } = req.user;

  const userAvatars = await prisma.userAvatars.findMany({
    where: {
      user_id,
    },
    select: {
      id: true,
      url: true,
    },
  });

  const avatarsData = {
    user_avatars: userAvatars,
    avatars,
  };

  return res.send(getSuccessData(avatarsData));
});

module.exports = router;
