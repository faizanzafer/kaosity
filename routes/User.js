const router = require("express").Router();
const trimRequest = require("trim-request");
const fs = require("fs");

const prisma = require("../_Prisma");
const ImageUpload = require("../middlewares/ImageUploader");
const {
  uploadFile,
  deleteFile: awsDeleteFile,
} = require("../S3_BUCKET/S3-bucket");
const {
  sendError,
  sendSuccess,
  getSuccessData,
  createToken,
  myInventory,
  UpdateUserAchievements,
  getError,
} = require("../helpers");
const avatars = require("../avatars").avatars;
const {
  MatchStatus,
  ShopItemsType,
  NotificationType,
  FriendRequestStatus,
} = require("@prisma/client");
const {
  descriptionFlagValidation,
  updateProfileValidation,
  claimRewardValidation,
  claimBonusValidation,
  fcmTokenValidation,
  sendInviteValidation,
  rejectInviteValidation,
  acceptInviteValidation,
} = require("./validate");
const { getEnv } = require("../config");
const Socket = require("../Socket/Socket");
const { SendNotification } = require("../Notifications/notification");

//
//
//

router.post(
  "/update_profile",
  [ImageUpload, trimRequest.body],
  async (req, res) => {
    try {
      if (req.file_error) {
        deleteFile(req);
        return sendError(res, req.file_error);
      }

      const { value, error } = updateProfileValidation(req.body);

      if (error) {
        deleteFile(req);
        return sendError(res, error.details[0].message);
      }

      const { user_name, avatar_id, dob, title_id } = value;

      if (!req.file && !user_name && !avatar_id && !dob && !title_id) {
        deleteFile(req);
        return sendError(
          res,
          "Atleast one of them 'user_name, avatar_id, dob, title_id' is required."
        );
      }

      const { _id: user_id } = req.user;

      const user = await prisma.users.findFirst({
        where: { id: user_id, is_registered: true },
      });

      let userName = user.user_name;
      let avatarUrl = user.avatar_url;
      let DOB = user.dob;
      let _title = user.title;

      if (avatar_id) {
        deleteFile(req);
        let avatar = avatars.find((_) => {
          return _.id == avatar_id;
        });
        if (!avatar) {
          avatar = await prisma.userAvatars.findFirst({
            where: {
              id: avatar_id,
              user_id,
            },
          });
          if (!avatar) return sendError(res, "avatar_id is not valid");
        }
        await awsDeleteFile(avatarUrl);
        avatarUrl = avatar.url;
      } else if (req.file) {
        const { Location } = await uploadFile(req.file);
        if (Location) await awsDeleteFile(avatarUrl);
        avatarUrl = Location;
        deleteFile(req);
      }

      if (user_name) {
        const userNameTaken = await prisma.users.findFirst({
          where: { user_name, NOT: { id: user_id } },
        });

        if (userNameTaken) {
          deleteFile(req);
          return sendError(res, "user name already taken.");
        }
        userName = user_name;
      }

      if (dob) DOB = dob;

      if (title_id) {
        const isThisMyTitle = await prisma.userTitles.findFirst({
          where: {
            user_id,
            id: title_id,
          },
        });

        if (!isThisMyTitle) {
          deleteFile(req);
          return sendError(res, "This title is not valid.");
        }

        _title = isThisMyTitle.title;
      }

      const updatedUser = await prisma.users.update({
        where: { id: user_id },
        data: {
          user_name: userName,
          avatar_url: avatarUrl,
          dob: DOB,
          title: _title,
        },
      });

      return res.send(getSuccessData(await createToken(updatedUser)));
    } catch (catchError) {
      deleteFile(req);
      if (catchError && catchError.message) {
        return sendError(res, catchError.message);
      }
      return sendError(res, catchError);
    }
  }
);

router.get("/my_titles", async (req, res) => {
  try {
    const { _id: user_id } = req.user;

    const my_titles = await prisma.userTitles.findMany({
      where: {
        user_id,
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        title: true,
      },
    });

    return sendSuccess(res, my_titles);
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.get("/user_get_my_notifications", async (req, res) => {
  const my_id = req.user._id;
  const userMatches = await prisma.users.findFirst({
    where: {
      id: my_id,
      is_registered: true,
    },
    select: {
      matches_where_i_invited: {
        where: {
          match_status_for_friend_user_id: MatchStatus.PENDING,
        },
        select: {
          id: true,
          match_type: true,
          match_deficulty: true,
          user_id: true,
          friend_user_id: true,
          match_starter: {
            select: {
              id: true,
              user_name: true,
              firstname: true,
              // lastname: true,
              email: true,
              avatar_url: true,
            },
          },
        },
      },
    },
  });
  const notifications = [];
  userMatches.matches_where_i_invited.forEach((match) => {
    const isNotificationAlreadyExist = notifications.find(
      (_) => _.match_details.id == match.id
    );
    if (!isNotificationAlreadyExist) {
      const match_starter = match.match_starter;
      delete match.match_starter;
      const notification = {
        user_data: match_starter,
        match_details: match,
      };
      notifications.push(notification);
    }
  });

  return res.send(getSuccessData(notifications));
});

router.get("/get_my_notifications", async (req, res) => {
  try {
    const my_id = req.user._id;
    const notification = await prisma.users.findFirst({
      where: {
        id: my_id,
        is_registered: true,
      },
      select: {
        notification_reciever: {
          select: {
            id: true,
            sender: true,
            reciever_id: true,
            match_id: true,
            friend_request_id: true,
            notification_type: true,
            seen: true,
            created_at: true,
            updated_at: true,
            i_send_match_request: {
              select: {
                firstname: true,
                user_name: true,
                avatar_url: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    const unSeen = await prisma.notifications.findMany({
      where: {
        reciever_id: my_id,
        seen: false,
      },
    });

    const first = notification.notification_reciever;

    const data = {
      notifications: first,
      un_seen_counter: unSeen.length,
    };

    return res.send(getSuccessData(data));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.post("/set_description_flag", trimRequest.body, async (req, res) => {
  try {
    const { value, error } = descriptionFlagValidation(req.body);
    if (error) return sendError(res, error.details[0].message);

    const { description_flag } = value;

    const { _id: my_id } = req.user;

    const user = await prisma.users.update({
      where: { id: my_id },
      data: {
        description_flag,
      },
    });

    return res.send(getSuccessData(await createToken(user)));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.get("/get_xp_level", async (req, res) => {
  try {
    const { level } = req.user;
    const xpLevel = await prisma.xPLevel.findFirst({
      where: {
        level: level + 1,
      },
    });

    return sendSuccess(res, xpLevel ? xpLevel.xp_required : 6000);
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.get("/get_my_inventory", async (req, res) => {
  try {
    const { _id: user_id } = req.user;

    const my_inventory = await myInventory(user_id);

    const shopItems = await prisma.shopItems.findMany({
      where: {
        type: ShopItemsType.POWERUPS,
      },
    });

    shopItems.forEach((item) => {
      const itemOfUser = my_inventory.find((mi) => mi.id == item.id);

      item.quantity = itemOfUser?.quantity ?? 0;

      delete item.created_at;
      delete item.updated_at;
    });

    return sendSuccess(res, shopItems);
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.get("/achievements_seen", async (req, res) => {
  try {
    const { _id: user_id } = req.user;

    await prisma.userAchievements.updateMany({
      where: {
        user_id,
        is_completed: true,
      },
      data: {
        is_seen: true,
      },
    });

    return sendSuccess(res, "Achievements seen");
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.post("/claim_reward", trimRequest.body, async (req, res) => {
  try {
    const { value, error } = claimRewardValidation(req.body);
    if (error) return sendError(res, error.details[0].message);

    const { achievement_condition_id } = value;
    const { _id: user_id } = req.user;

    let user = req.user;

    const achievementCondition = await prisma.achievementConditions.findFirst({
      where: {
        id: achievement_condition_id,
      },
      include: {
        achievement: {
          select: {
            level: true,
          },
        },
      },
    });

    if (!achievementCondition)
      return sendError(res, "This achievement condition do not exist");

    const achievementConditionLevel = achievementCondition.achievement?.level;

    const userAchievement = await prisma.userAchievements.findFirst({
      where: {
        user_id,
        level: achievementConditionLevel,
        condition_type: achievementCondition.condition_type,
      },
    });

    if (!userAchievement)
      return sendError(res, "User haven't unlocked this achievement condition");

    if (!userAchievement.is_completed)
      return sendError(res, "Achievement condition is not completed yet");

    if (userAchievement.is_reward_claimed)
      return sendError(res, "Reward already claimed");

    if (achievementCondition.reward_type == "ALL_ITEMS") {
      const userItems = await prisma.userItems.findMany({
        where: {
          user_id,
          quantity: { lt: 16 },
        },
      });

      for (const userItem of userItems) {
        await prisma.userItems.update({
          where: {
            id: userItem.id,
          },
          data: {
            quantity:
              userItem.quantity + achievementCondition.reward_qty > 16
                ? 16
                : userItem.quantity + achievementCondition.reward_qty,
          },
        });
      }
    } else if (achievementCondition.reward_type == "COINS") {
      user = await prisma.users.update({
        where: {
          id: user_id,
        },
        data: {
          current_points: {
            increment: achievementCondition.reward_qty,
          },
          weekly_points: {
            increment: achievementCondition.reward_qty,
          },
          monthly_points: {
            increment: achievementCondition.reward_qty,
          },
        },
      });

      const { user_from_achievement_update_func } =
        await UpdateUserAchievements({
          user,
          coins_earned: achievementCondition.reward_qty,
        });

      user = user_from_achievement_update_func;
    } else if (achievementCondition.reward_type == "DIAMONDS") {
      user = await prisma.users.update({
        where: {
          id: user_id,
        },
        data: {
          diamonds: {
            increment: achievementCondition.reward_qty,
          },
        },
      });
    } else if (
      achievementCondition.reward_type == "ITEMS_KAOS_VISION_MICROPHONE"
    ) {
      const userItems = await prisma.userItems.findMany({
        where: {
          user_id,
          quantity: { lt: 16 },
          shop_item: {
            name: { in: ["Kaos Vision", "Microphone"] },
          },
        },
      });

      for (const userItem of userItems) {
        await prisma.userItems.update({
          where: {
            id: userItem.id,
          },
          data: {
            quantity:
              userItem.quantity + achievementCondition.reward_qty > 16
                ? 16
                : userItem.quantity + achievementCondition.reward_qty,
          },
        });
      }
    } else if (achievementCondition.reward_type == "ITEMS_DO_OVER_TIME_ZONE") {
      const userItems = await prisma.userItems.findMany({
        where: {
          user_id,
          quantity: { lt: 16 },
          shop_item: {
            name: { in: ["Do-Over", "Time Zone"] },
          },
        },
      });

      for (const userItem of userItems) {
        await prisma.userItems.update({
          where: {
            id: userItem.id,
          },
          data: {
            quantity:
              userItem.quantity + achievementCondition.reward_qty > 16
                ? 16
                : userItem.quantity + achievementCondition.reward_qty,
          },
        });
      }
    } else if (achievementCondition.reward_type == "PROFILE_PICTURE") {
      const alreadyHaveThisAvatar = await prisma.userAvatars.findFirst({
        where: {
          user_id,
          name: achievementCondition.reward,
        },
      });
      if (!alreadyHaveThisAvatar) {
        await prisma.userAvatars.create({
          data: {
            user_id,
            name: achievementCondition.reward,
            url: `${getEnv("APP_URL")}/assets/avatars/${
              achievementCondition.reward
            }.png`,
          },
        });
      }
      // user = await prisma.users.update({
      //   where: {
      //     id: user_id,
      //   },
      //   data: {
      //     avatar_url: `${getEnv("APP_URL")}/assets/avatars/${
      //       achievementCondition.reward
      //     }.png`,
      //   },
      // });
    } else if (achievementCondition.reward_type == "TITLE") {
      await prisma.userTitles.create({
        data: {
          user_id,
          title: achievementCondition.reward,
        },
      });
    }

    await prisma.userAchievements.update({
      where: {
        id: userAchievement.id,
      },
      data: {
        is_reward_claimed: true,
      },
    });

    return res.send(getSuccessData(await createToken(user)));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.get("/refill/:ticket", async (req, res) => {
  const MAX_CURRENCY = getEnv("MAX_CURRENCY");
  const REFILL_TIME = getEnv("REFILL_TIME");

  try {
    const {
      _id: user_id,
      diamonds,
      diamonds_refilled_at,
      crowns,
      crowns_refilled_at,
    } = req.user;

    const { ticket } = req.params;

    if (ticket) {
      if (ticket == "diamonds") {
        if (diamonds < MAX_CURRENCY) {
          const now = new Date();

          const timeDiffInMins =
            (now.getTime() - diamonds_refilled_at.getTime()) / 1000 / 60;

          const addDiamonds = parseInt(timeDiffInMins / REFILL_TIME);
          if (addDiamonds > 0) {
            const finalDiamonds = diamonds + addDiamonds;

            await prisma.users.update({
              where: {
                id: user_id,
              },
              data: {
                diamonds: {
                  increment:
                    finalDiamonds >= MAX_CURRENCY
                      ? MAX_CURRENCY - diamonds
                      : addDiamonds,
                },
                diamonds_refilled_at: now,
              },
            });

            return sendSuccess(res, {
              message: "Diamonds refilled.",
              no_of_diamonds_refilled:
                finalDiamonds >= MAX_CURRENCY
                  ? MAX_CURRENCY - diamonds
                  : addDiamonds,
              time_required_to_refill:
                finalDiamonds >= MAX_CURRENCY
                  ? 0
                  : /*(MAX_CURRENCY - finalDiamonds) * */
                    parseInt(REFILL_TIME * 60),
            });
          }
          return res.status(201).send({
            data: {
              message: "Diamonds refill time is not completed yet.",
              time_required_to_refill:
                // (MAX_CURRENCY - diamonds) *
                parseInt((REFILL_TIME - timeDiffInMins) * 60),
            },
            code: 201,
          });
        }
        return res.status(201).send({
          data: {
            message: "Diamonds are already full",
            time_required_to_refill: 0,
          },
          code: 201,
        });
      }
      if (ticket == "crowns") {
        if (crowns < MAX_CURRENCY) {
          const now = new Date();

          const timeDiffInMins =
            (now.getTime() - crowns_refilled_at.getTime()) / 1000 / 60;

          const addCrowns = parseInt(timeDiffInMins / REFILL_TIME);
          if (addCrowns > 0) {
            const finalCrowns = crowns + addCrowns;

            await prisma.users.update({
              where: {
                id: user_id,
              },
              data: {
                crowns: {
                  increment:
                    finalCrowns >= MAX_CURRENCY
                      ? MAX_CURRENCY - crowns
                      : addCrowns,
                },
                crowns_refilled_at: now,
              },
            });

            return sendSuccess(res, {
              message: "crowns refilled.",
              no_of_crowns_refilled:
                finalCrowns >= MAX_CURRENCY ? MAX_CURRENCY - crowns : addCrowns,
              time_required_to_refill:
                finalCrowns >= MAX_CURRENCY
                  ? 0
                  : /*(MAX_CURRENCY - finalCrowns) * */
                    parseInt(REFILL_TIME * 60),
            });
          }
          return res.status(201).send({
            data: {
              message: "Crowns refill time is not completed yet.",
              time_required_to_refill:
                /*(MAX_CURRENCY - crowns) * */
                parseInt((REFILL_TIME - timeDiffInMins) * 60),
            },
            code: 201,
          });
        }
        return res.status(201).send({
          data: {
            message: "Crowns are already full",
            time_required_to_refill: 0,
          },
          code: 201,
        });
      }
    }
    return sendError(res, "here");
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.get("/get_daily_bonus", async (req, res) => {
  try {
    const { id } = req.user;
    const claimDone = await prisma.claimDailyBonus.findFirst({
      where: {
        user_id: id,
      },
      include: {
        bonus: {
          select: {
            id: true,
            day_no: true,
          },
        },
      },
    });
    const dailyReward = await prisma.dailyBonus.findMany({
      select: {
        id: true,
        reward_type: true,
        reward_qty: true,
        day_no: true,
        pic_url: true,
        claimed_pic_url: true,
        un_claimed_pic_url: true,
        created_at: true,
        updated_at: true,
      },
    });
    var day = new Date();
    var nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    nextDay.setHours(0);
    nextDay.setMinutes(0);
    nextDay.setSeconds(0);
    var milliseconds = nextDay - day;
    var seconds = milliseconds / 1000;

    const Timer = { Timer: seconds };

    if (!claimDone) {
      dailyReward[0].is_claim = true;
      Timer.Timer = null;
    }

    if (claimDone) {
      const start = claimDone.updated_at;
      const end = day;
      let dayDi = getNumberOfDays(start, end);
      let dno = claimDone.bonus.day_no;
      let obj = dno + dayDi;

      if (obj > 20) {
        let objt = obj % 20;
        dailyReward[objt - 1].is_claim = true;
      } else {
        dailyReward[obj - 1].is_claim = true;
      }
    }

    if (claimDone?.updated_at.getDate() == new Date().getDate()) {
      const dr = dailyReward.find((dr) => dr.is_claim == true);
      dailyReward[dr.day_no - 1].is_claim = false;
    }

    return res.status(200).send(getSuccessData({ dailyReward, Timer }));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return res.status(400).send(getError(catchError.message));
    }
    return res.status(400).send(getError(catchError));
  }
});

router.post("/claim_daily_reward", trimRequest.body, async (req, res) => {
  try {
    const { id } = req.user;
    let user = req.user;
    const { value, error } = claimBonusValidation(req.body);
    if (error) {
      return sendError(res, error.details[0].message);
    }
    const { bonus_id } = value;
    const isBonus = await prisma.dailyBonus.findFirst({
      where: {
        id: bonus_id,
      },
    });
    if (!isBonus) {
      return sendError(res, "Record does not exist against this bonus_id!");
    }
    const isExist = await prisma.claimDailyBonus.findFirst({
      where: {
        user_id: id,
      },
    });
    const day = new Date();
    const day2 = isExist?.updated_at;
    // if (isExist && day.getDate()==day2.getDate()) {
    //   return sendError(res, "You already claimed today's reward!")
    // }
    if (!isExist) {
      const claimed = await prisma.claimDailyBonus.create({
        data: {
          user_id: id,
          bonus_id,
        },
      });
    } else {
      await prisma.claimDailyBonus.update({
        where: {
          id: isExist.id,
        },
        data: {
          bonus_id,
        },
      });
    }
    if (isBonus.reward_type == "COINS") {
      user = await prisma.users.update({
        where: {
          id,
        },
        data: {
          current_points: {
            increment: isBonus.reward_qty,
          },
          weekly_points: {
            increment: isBonus.reward_qty,
          },
          monthly_points: {
            increment: isBonus.reward_qty,
          },
        },
      });

      const { user_from_achievement_update_func } =
        await UpdateUserAchievements({
          user,
          coins_earned: isBonus.reward_qty,
        });

      user = user_from_achievement_update_func;
    } else if (isBonus.reward_type == "DIAMONDS") {
      user = await prisma.users.update({
        where: {
          id,
        },
        data: {
          diamonds: {
            increment: isBonus.reward_qty,
          },
        },
      });
    } else if (isBonus.reward_type == "ITEMS_KAOS_VISION_MICROPHONE") {
      const userItems = await prisma.userItems.findMany({
        where: {
          user_id: id,
          quantity: { lt: 16 },
          shop_item: {
            name: { in: ["Kaos Vision", "Microphone"] },
          },
        },
      });

      for (const userItem of userItems) {
        await prisma.userItems.update({
          where: {
            id: userItem.id,
          },
          data: {
            quantity:
              userItem.quantity + isBonus.reward_qty > 16
                ? 16
                : userItem.quantity + isBonus.reward_qty,
          },
        });
      }
    } else if (isBonus.reward_type == "ITEMS_DO_OVER_TIME_ZONE") {
      const userItems = await prisma.userItems.findMany({
        where: {
          user_id: id,
          quantity: { lt: 16 },
          shop_item: {
            name: { in: ["Do-Over", "Time Zone"] },
          },
        },
      });

      for (const userItem of userItems) {
        await prisma.userItems.update({
          where: {
            id: userItem.id,
          },
          data: {
            quantity:
              userItem.quantity + isBonus.reward_qty > 16
                ? 16
                : userItem.quantity + isBonus.reward_qty,
          },
        });
      }
    }

    return res.status(200).send(getSuccessData(await createToken(user)));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.post("/update_fcm_token", trimRequest.all, async (req, res) => {
  try {
    const { id } = req.user;
    const { error, value } = fcmTokenValidation(req.body);
    if (error) {
      return res.status(400).send(getError(error.details[0].message));
    }
    const { fcm_token } = value;
    await prisma.users.update({
      where: {
        id,
      },
      data: {
        fcm_token,
      },
    });
    return res
      .status(200)
      .send(getSuccessData("FCM Token updated successfully"));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return res.status(400).send(getError(catchError.message));
    }
    return res.status(400).send(getError(catchError));
  }
});

router.get("/delete_fcm_token", async (req, res) => {
  try {
    const { id } = req.user;
    await prisma.users.update({
      where: {
        id,
      },
      data: {
        fcm_token: null,
      },
    });
    return res
      .status(200)
      .send(getSuccessData("FCM Token deleted Successfully"));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return res.status(400).send(getError(catchError.message));
    }
    return res.status(400).send(getError(catchError));
  }
});

router.get("/toogle_my_notification", async (req, res) => {
  try {
    const { id } = req.user;
    const isUser = await prisma.users.findFirst({
      where: {
        id,
        // show_notifications: true,
      },
    });
    if (!isUser) {
      return res.status(400).send(getError("User not found"));
    }

    const updateUser = await prisma.users.update({
      where: {
        id,
      },
      data: {
        show_notifications: !isUser.show_notifications,
      },
    });

    return res.status(200).send(getSuccessData(await createToken(updateUser)));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return res.status(400).send(getError(catchError.message));
    }
    return res.status(400).send(getError(catchError));
  }
});

router.post("/send_invite", trimRequest.body, async (req, res) => {
  try {
    const user_id = req.user._id;
    var user = req.user;
    const { error, value } = sendInviteValidation(req.body);
    if (error) {
      return res.status(400).send(getError(error.details[0].message));
    }
    const { friend_user_id } = value;

    if (friend_user_id == user_id) {
      return res.status(400).send(getError("Action not perform on same ID"));
    }

    const isExist = await prisma.friendUsers.findFirst({
      where: {
        OR: [
          {
            user_id,
            friend_user_id,
          },
          {
            user_id: friend_user_id,
            friend_user_id: user_id,
          },
        ],
      },
    });

    const isNotifi = await prisma.notifications.findFirst({
      where: {
        sender: user_id,
        reciever_id: friend_user_id,
        notification_type: NotificationType.FRIEND,
      },
    });

    if (!isExist) {
      var frnd = await prisma.friendUsers.create({
        data: {
          user_id,
          friend_user_id,
        },
      });
    } else {
      await prisma.friendUsers.update({
        where: {
          id: isExist.id,
        },
        data: {
          status: FriendRequestStatus.PENDING,
        },
      });
    }
    if (!isExist) {
      if (!isNotifi) {
        await prisma.notifications.create({
          data: {
            sender: user_id,
            reciever_id: friend_user_id,
            friend_request_id: frnd?.id,
            notification_type: NotificationType.FRIEND,
          },
        });
      } else {
        await prisma.notifications.update({
          where: {
            id: isNotifi.id,
          },
          data: {
            sender: user_id,
            reciever_id: friend_user_id,
            friend_request_id: frnd?.id,
            notification_type: NotificationType.FRIEND,
            seen: false,
            created_at: new Date(),
          },
        });
      }
    }

    const isNotify = await prisma.users.findFirst({
      where: {
        id: friend_user_id,
        is_registered: true,
        show_notifications: true,
      },
    });
    if (isNotify) {
      if (isNotify.fcm_token) {
        SendNotification(isNotify.fcm_token, {
          title: user.user_name,
          body: "Sent you a friend request",
        })
          .then((res) => {
            console.log(res, "done");
          })
          .catch((error) => {
            console.log(error, "Error sending notification");
          });
      }
    }

    await Socket.sendInvite(user_id, friend_user_id, true);
    return res.status(200).send(getSuccessData("Invite Send Successfully"));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.post("/accept_invite", trimRequest.body, async (req, res) => {
  try {
    const my_id = req.user._id;
    var user = req.user;
    const { error, value } = acceptInviteValidation(req.body);
    if (error) {
      return res.status(400).send(getError(error.details[0].message));
    }
    const { user_id } = value;
    const isExist = await prisma.friendUsers.findFirst({
      where: {
        friend_user_id: my_id,
        user_id,
      },
    });

    if (user_id == my_id) {
      return res.status(400).send(getError("Action not perform on same ID"));
    }

    if (!isExist) {
      return res.status(400).send(getError("Request does not exist"));
    }

    if (isExist && isExist.status == FriendRequestStatus.ACCEPTED) {
      return res.status(400).send(getError("Request already accepted"));
    }

    const isNotifi = await prisma.notifications.findFirst({
      where: {
        OR: [
          {
            sender: user_id,
            reciever_id: my_id,
            notification_type: NotificationType.FRIEND,
          },
          {
            sender: my_id,
            reciever_id: user_id,
            notification_type: NotificationType.FRIEND,
          },
        ],
      },
    });

    if (isExist) {
      await prisma.notifications.create({
        data: {
          sender: my_id,
          reciever_id: user_id,
          friend_request_id: isExist?.id,
          notification_type: NotificationType.ACCEPT_FRIEND,
        },
      });

      await prisma.friendUsers.update({
        where: {
          id: isExist?.id,
        },
        data: {
          status: FriendRequestStatus.ACCEPTED,
        },
      });
    }

    if (isExist) {
      if (isNotifi) {
        await prisma.notifications.delete({
          where: {
            id: isNotifi?.id,
          },
        });
      }
    }

    const isNotify = await prisma.users.findFirst({
      where: {
        id: user_id,
        is_registered: true,
        show_notifications: true,
      },
    });
    if (isNotify) {
      if (isNotify.fcm_token) {
        SendNotification(isNotify.fcm_token, {
          title: user.user_name,
          body: "Accept your friend request",
        })
          .then((res) => {
            console.log(res, "done");
          })
          .catch((error) => {
            console.log(error, "Error sending notification");
          });
      }
    }

    await Socket.friendRequest(my_id, user_id, true, "Request Accepted");

    return res.status(200).send(getSuccessData("Request Accepted"));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.post("/reject_invite", trimRequest.body, async (req, res) => {
  try {
    const my_id = req.user._id;
    var user = req.user;
    const { error, value } = rejectInviteValidation(req.body);
    if (error) {
      return res.status(400).send(getError(error.details[0].message));
    }
    const { user_id } = value;
    const isExist = await prisma.friendUsers.findFirst({
      where: {
        OR: [
          {
            friend_user_id: my_id,
            user_id,
          },
          {
            friend_user_id: user_id,
            user_id: my_id,
          },
        ],
      },
    });

    if (user_id == my_id) {
      return res.status(400).send(getError("Action not perform on same ID"));
    }
    if (!isExist) {
      return res.status(400).send(getError("Request does not exist"));
    }

    const isNotifi = await prisma.notifications.findFirst({
      where: {
        OR: [
          {
            sender: user_id,
            reciever_id: my_id,
            notification_type: NotificationType.FRIEND,
          },
          {
            sender: my_id,
            reciever_id: user_id,
            notification_type: NotificationType.FRIEND,
          },
        ],
      },
    });

    if (isNotifi) {
      await prisma.notifications.delete({
        where: {
          id: isNotifi?.id,
          // notification_type: NotificationType.FRIEND,
        },
      });
    }

    if (isExist) {
      await prisma.friendUsers.delete({
        where: {
          id: isExist?.id,
        },
      });
    }

    await Socket.sendInvite(my_id, user_id, false);
    return res.status(200).send(getSuccessData("You reject the invite"));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.get("/seen_notifications", async (req, res) => {
  try {
    const { id } = req.user;
    const isNotifi = await prisma.notifications.updateMany({
      where: {
        reciever_id: id,
      },
      data: {
        seen: true,
      },
    });
    if (isNotifi.count <= 0) {
      return sendError(res, "No record found");
    }
    return sendSuccess(res, "You seen the notification Successfully");
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

module.exports = router;

function deleteFile(req) {
  if (req.file) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
}

function convertMiliseconds(miliseconds, format) {
  var days, hours, minutes, seconds, total_hours, total_minutes, total_seconds;

  total_seconds = parseInt(Math.floor(miliseconds / 1000));
  total_minutes = parseInt(Math.floor(total_seconds / 60));
  total_hours = parseInt(Math.floor(total_minutes / 60));
  days = parseInt(Math.floor(total_hours / 24));

  seconds = parseInt(total_seconds % 60);
  minutes = parseInt(total_minutes % 60);
  hours = parseInt(total_hours % 24);

  switch (format) {
    case "s":
      return total_seconds;
    case "m":
      return total_minutes;
    case "h":
      return total_hours;
    case "d":
      return days;
    default:
      return { d: days, h: hours, m: minutes, s: seconds };
  }
}

function getNumberOfDays(start, end) {
  const date1 = new Date(start);
  const date2 = new Date(end);

  // One day in milliseconds
  const oneDay = 1000 * 60 * 60 * 24;

  // Calculating the time difference between two dates
  const diffInTime = date2.getTime() - date1.getTime();

  // Calculating the no. of days between two dates
  const diffInDays = Math.round(diffInTime / oneDay);

  return diffInDays;
}
