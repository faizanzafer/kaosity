const { now } = require("mongoose");
const timediff = require("timediff");
const jwt = require("jsonwebtoken");
const { getEnv } = require("./config");

const prisma = require("./_Prisma");
const { ShopItemsType } = require(".prisma/client");

const CONSTANTS = {
  SpecialOfferItems: {
    TITLE: "TITLE",
    COINS: "COINS",
    DIAMONDS: "DIAMONDS",
    CROWN: "CROWN",
    PROFILE_PICTURE: "PROFILE_PICTURE",
    ALL_ITEMS: "ALL_ITEMS",
  },
  Prizes: {
    AMAZON: "AMAZON",
    UBER: "UBER",
    GOOGLE_PLAY: "GOOGLE_PLAY",
    WALMART: "WALMART",
    XBOX: "XBOX",
    PLAY_STATION: "PLAY_STATION",
  },
};

const timeExpired = ({
  p_years = 0,
  p_months = 0,
  p_days = 0,
  p_hours = 0,
  p_minutes = 0,
  p_seconds = 60,
  time = now(),
}) => {
  const { years, months, days, hours, minutes, seconds } = timediff(
    time,
    now(),
    "YMDHmS"
  );

  return (
    years > p_years ||
    months > p_months ||
    days > p_days ||
    hours > p_hours ||
    minutes > p_minutes ||
    seconds > p_seconds
  );
};

const clean = (str) => {
  return str
    .replace(/(?!\w|\s)./g, "")
    .replace(/\s+/g, "")
    .replace(/^(\s*)([\W\w]*)(\b\s*$)/g, "$2");
};

const getError = (error) => {
  return {
    error,
    code: 404,
  };
};

const getSuccessData = (data) => {
  return {
    data,
    code: 200,
  };
};

const sendError = (res, error) => {
  return res.status(404).send(getError(error));
};

const sendSuccess = (res, data) => {
  return res.send(getSuccessData(data));
};

const createToken = async (user) => {
  const { level } = user;
  const xpLevel = await prisma.xPLevel.findFirst({
    where: {
      level: level + 1,
    },
  });

  return jwt.sign(
    {
      _id: user.id,
      user_name: user.user_name,
      firstname: user.firstname,
      // lastname: user.lastname,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      avatar_url: user.avatar_url,
      current_points: user.current_points,
      diamonds: user.diamonds,
      crowns: user.crowns,
      title: user.title,
      description_flag: user.description_flag,
      show_notifications: user.show_notifications,
      xp: user.xp,
      level: user.level,
      achievement_level: user.achievement_level,
      xp_level_required: xpLevel ? xpLevel.xp_required : 6000,
      // my_inventory,
    },
    getEnv("JWT_SECERET")
  );
};

const UpdateUserAchievements = async ({
  user,
  is_solo_game,
  is_challenge_game,
  win_challenge_game,
  win_challenge_game_without_item_use,
  no_of_answers,
  is_all_answers_are_correct,
  comic_piece,
  level_reach,
  coins_earned,
  coins_spent,
  monthly_bonus_claim,
  no_of_items_used,
  no_of_times_kaos_visions_item_used,
  no_of_times_microphone_item_used,
  no_of_times_do_over_item_used,
  no_of_times_time_zone_item_used,
  is_chapter_2_of_steve_story_completed,
  no_of_collectable_items_found,
}) => {
  const { id: user_id, level, achievement_level } = user;

  const achievementLevelConditions =
    await prisma.achievementConditions.findMany({
      where: {
        achievement: {
          level: achievement_level,
        },
      },
    });

  const userAchievements = await prisma.userAchievements.findMany({
    where: {
      level: achievement_level,
      user_id,
    },
  });

  const nextLevel = achievement_level + 1;
  const userAchievementsNewRecords = [];
  const userAchievementsIdsToComplete = [];
  let userData = user;

  for await (const condition of achievementLevelConditions) {
    const userAchievement = userAchievements.find(
      (ua) => ua.condition_type == condition.condition_type
    );

    if (condition.condition_type == "PLAY_SOLO_GAMES") {
      if (is_solo_game) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done: userAchievement.condition_qty_done + 1,
              },
            });
            if (
              userAchievement.condition_qty_done + 1 >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done: 1,
            is_completed: condition.condition_qty == 1 ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "CHALLENGE_MATCHES") {
      if (is_challenge_game) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done: userAchievement.condition_qty_done + 1,
              },
            });
            if (
              userAchievement.condition_qty_done + 1 >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done: 1,
            is_completed: condition.condition_qty == 1 ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "WIN_CHALLENGE_MATCHES") {
      if (win_challenge_game) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done: userAchievement.condition_qty_done + 1,
              },
            });
            if (
              userAchievement.condition_qty_done + 1 >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done: 1,
            is_completed: condition.condition_qty == 1 ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (
      condition.condition_type == "WIN_CHALLENGE_MATCHES_WITHOUT_ITEM_USE"
    ) {
      if (win_challenge_game_without_item_use) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done: userAchievement.condition_qty_done + 1,
              },
            });
            if (
              userAchievement.condition_qty_done + 1 >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done: 1,
            is_completed: condition.condition_qty == 1 ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "ANSWERS_CORRECTLY") {
      if (no_of_answers) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done:
                  userAchievement.condition_qty_done + no_of_answers >
                  condition.condition_qty
                    ? condition.condition_qty
                    : userAchievement.condition_qty_done + no_of_answers,
              },
            });

            if (
              userAchievement.condition_qty_done + no_of_answers >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done:
              no_of_answers >= condition.condition_qty
                ? condition.condition_qty
                : no_of_answers,
            is_completed:
              no_of_answers >= condition.condition_qty ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "ANSWERS_CORRECTLY_IN_ROW") {
      if (is_all_answers_are_correct) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done:
                  userAchievement.condition_qty_done + no_of_answers >
                  condition.condition_qty
                    ? condition.condition_qty
                    : userAchievement.condition_qty_done + no_of_answers,
              },
            });

            if (
              userAchievement.condition_qty_done + no_of_answers >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done:
              no_of_answers >= condition.condition_qty
                ? condition.condition_qty
                : no_of_answers,
            is_completed:
              no_of_answers >= condition.condition_qty ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      } else {
        if (userAchievement && !userAchievement.is_completed) {
          await prisma.userAchievements.update({
            where: {
              id: userAchievement.id,
            },
            data: {
              condition_qty_done: 0,
            },
          });
        }
      }
    } else if (condition.condition_type == "FIND_COLLECTABLE_PIECES") {
      if (no_of_collectable_items_found) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done:
                  userAchievement.condition_qty_done +
                    no_of_collectable_items_found >
                  condition.condition_qty
                    ? condition.condition_qty
                    : userAchievement.condition_qty_done +
                      no_of_collectable_items_found,
              },
            });

            if (
              userAchievement.condition_qty_done +
                no_of_collectable_items_found >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done:
              no_of_collectable_items_found >= condition.condition_qty
                ? condition.condition_qty
                : no_of_collectable_items_found,
            is_completed:
              no_of_collectable_items_found >= condition.condition_qty
                ? true
                : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "LEVEL_REACH") {
      if (level_reach) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done:
                  level > condition.condition_qty
                    ? condition.condition_qty
                    : level,
              },
            });

            if (level >= condition.condition_qty) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done:
              level >= condition.condition_qty
                ? condition.condition_qty
                : level,
            is_completed: level >= condition.condition_qty ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "COLLECT_COMIC_PIECES") {
      if (comic_piece) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done: userAchievement.condition_qty_done + 1,
              },
            });

            if (
              userAchievement.condition_qty_done + 1 >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done: 1,
            is_completed: condition.condition_qty == 1 ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "COINS_EARN") {
      if (coins_earned) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done:
                  userAchievement.condition_qty_done + coins_earned >
                  condition.condition_qty
                    ? condition.condition_qty
                    : userAchievement.condition_qty_done + coins_earned,
              },
            });

            if (
              userAchievement.condition_qty_done + coins_earned >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done:
              coins_earned >= condition.condition_qty
                ? condition.condition_qty
                : coins_earned,
            is_completed:
              coins_earned >= condition.condition_qty ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "COINS_SPEND") {
      if (coins_spent) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done:
                  userAchievement.condition_qty_done + coins_spent >
                  condition.condition_qty
                    ? condition.condition_qty
                    : userAchievement.condition_qty_done + coins_spent,
              },
            });

            if (
              userAchievement.condition_qty_done + coins_spent >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done:
              coins_spent >= condition.condition_qty
                ? condition.condition_qty
                : coins_spent,
            is_completed:
              coins_spent >= condition.condition_qty ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "MONTHLY_BONUS_CLAIMS") {
      if (monthly_bonus_claim) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done: userAchievement.condition_qty_done + 1,
              },
            });

            if (
              userAchievement.condition_qty_done + 1 >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done: 1,
            is_completed: 1 == condition.condition_qty ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "ITEMS_USE") {
      if (no_of_items_used) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done:
                  userAchievement.condition_qty_done + no_of_items_used >
                  condition.condition_qty
                    ? condition.condition_qty
                    : userAchievement.condition_qty_done + no_of_items_used,
              },
            });

            if (
              userAchievement.condition_qty_done + no_of_items_used >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done:
              userAchievement.condition_qty_done + no_of_items_used >=
              condition.condition_qty
                ? condition.condition_qty
                : userAchievement.condition_qty_done + no_of_items_used,
            is_completed:
              userAchievement.condition_qty_done + no_of_items_used >=
              condition.condition_qty
                ? true
                : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "KAOS_VISIOS_ITEM_USE") {
      if (no_of_times_kaos_visions_item_used) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done:
                  userAchievement.condition_qty_done +
                    no_of_times_kaos_visions_item_used >
                  condition.condition_qty
                    ? condition.condition_qty
                    : userAchievement.condition_qty_done +
                      no_of_times_kaos_visions_item_used,
              },
            });

            if (
              userAchievement.condition_qty_done +
                no_of_times_kaos_visions_item_used >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done:
              userAchievement.condition_qty_done +
                no_of_times_kaos_visions_item_used >=
              condition.condition_qty
                ? condition.condition_qty
                : userAchievement.condition_qty_done +
                  no_of_times_kaos_visions_item_used,
            is_completed:
              userAchievement.condition_qty_done +
                no_of_times_kaos_visions_item_used >=
              condition.condition_qty
                ? true
                : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "MICROPHONE_ITEM_USE") {
      if (no_of_times_microphone_item_used) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done:
                  userAchievement.condition_qty_done +
                    no_of_times_microphone_item_used >
                  condition.condition_qty
                    ? condition.condition_qty
                    : userAchievement.condition_qty_done +
                      no_of_times_microphone_item_used,
              },
            });

            if (
              userAchievement.condition_qty_done +
                no_of_times_microphone_item_used >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done:
              userAchievement.condition_qty_done +
                no_of_times_microphone_item_used >=
              condition.condition_qty
                ? condition.condition_qty
                : userAchievement.condition_qty_done +
                  no_of_times_microphone_item_used,
            is_completed:
              userAchievement.condition_qty_done +
                no_of_times_microphone_item_used >=
              condition.condition_qty
                ? true
                : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "DO_OVER_ITEM_USE") {
      if (no_of_times_do_over_item_used) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done:
                  userAchievement.condition_qty_done +
                    no_of_times_do_over_item_used >
                  condition.condition_qty
                    ? condition.condition_qty
                    : userAchievement.condition_qty_done +
                      no_of_times_do_over_item_used,
              },
            });

            if (
              userAchievement.condition_qty_done +
                no_of_times_do_over_item_used >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done:
              userAchievement.condition_qty_done +
                no_of_times_do_over_item_used >=
              condition.condition_qty
                ? condition.condition_qty
                : userAchievement.condition_qty_done +
                  no_of_times_do_over_item_used,
            is_completed:
              userAchievement.condition_qty_done +
                no_of_times_do_over_item_used >=
              condition.condition_qty
                ? true
                : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (condition.condition_type == "TIME_ZONE_ITEM_USE") {
      if (no_of_times_time_zone_item_used) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done:
                  userAchievement.condition_qty_done +
                    no_of_times_time_zone_item_used >
                  condition.condition_qty
                    ? condition.condition_qty
                    : userAchievement.condition_qty_done +
                      no_of_times_time_zone_item_used,
              },
            });

            if (
              userAchievement.condition_qty_done +
                no_of_times_time_zone_item_used >=
              condition.condition_qty
            ) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done:
              userAchievement.condition_qty_done +
                no_of_times_time_zone_item_used >=
              condition.condition_qty
                ? condition.condition_qty
                : userAchievement.condition_qty_done +
                  no_of_times_time_zone_item_used,
            is_completed:
              userAchievement.condition_qty_done +
                no_of_times_time_zone_item_used >=
              condition.condition_qty
                ? true
                : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    } else if (
      condition.condition_type == "COMPLETE_CHAPTER_2_OF_STEVE_STORY"
    ) {
      if (is_chapter_2_of_steve_story_completed) {
        if (userAchievement) {
          if (userAchievement.condition_qty_done < condition.condition_qty) {
            await prisma.userAchievements.update({
              where: {
                id: userAchievement.id,
              },
              data: {
                condition_qty_done: 1,
              },
            });

            if (1 == condition.condition_qty) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          } else {
            if (!userAchievement.is_completed) {
              userAchievementsIdsToComplete.push(userAchievement.id);
              const index = userAchievements.findIndex(
                (ua) => ua.id == userAchievement.id
              );
              if (index >= 0) {
                userAchievements[index].is_completed = true;
              }
            }
          }
        } else {
          const newUserAchievementRecord = {
            user_id,
            level: achievement_level,
            condition_type: condition.condition_type,
            condition_qty_done: 1,
            is_completed: 1 == condition.condition_qty ? true : undefined,
          };
          userAchievementsNewRecords.push(newUserAchievementRecord);
        }
      }
    }
  }

  if (userAchievementsIdsToComplete.length > 0) {
    await prisma.userAchievements.updateMany({
      where: {
        id: {
          in: userAchievementsIdsToComplete,
        },
      },
      data: {
        is_completed: true,
      },
    });
  }

  if (userAchievementsNewRecords.length > 0) {
    await prisma.userAchievements.createMany({
      data: userAchievementsNewRecords,
    });
  }

  const updatedUserAchievements = await prisma.userAchievements.findMany({
    where: {
      level: achievement_level,
      user_id,
    },
  });

  if (
    updatedUserAchievements.length == achievementLevelConditions.length &&
    updatedUserAchievements.every((ua) => ua.is_completed == true)
  ) {
    const newAchievements = await prisma.achievementConditions.findMany({
      where: {
        achievement: {
          level: nextLevel,
        },
      },
    });

    const newUserAchievements = newAchievements.map((na) => {
      return {
        level: nextLevel,
        condition_type: na.condition_type,
      };
    });

    userData = await prisma.users.update({
      where: {
        id: user_id,
      },
      data: {
        achievement_level: nextLevel,
        my_achievements: {
          createMany: {
            data: newUserAchievements,
          },
        },
      },
    });
  }

  return { user_from_achievement_update_func: userData };
};

const userUsedItems = async (items, my_id) => {
  const usedItemsNames = [];
  let total_count = 0;
  for await (const item of items) {
    item.count = parseInt(item.count);

    const userItem = await prisma.userItems.findFirst({
      where: {
        shop_item_id: item.item_id,
        user_id: my_id,
        shop_item: {
          type: ShopItemsType.POWERUPS,
        },
      },
      include: {
        shop_item: {
          select: {
            name: true,
          },
        },
      },
    });

    if (userItem) {
      usedItemsNames.push({
        name: userItem?.shop_item?.name,
        count: item.count,
      });
      total_count += item.count;

      await prisma.userItems.update({
        where: {
          id: userItem.id,
        },
        data: {
          quantity:
            userItem.quantity <= item.count
              ? 0
              : userItem.quantity - item.count,
        },
      });
    }
  }

  return { usedItemsNames, total_count };
};

const myInventory = async (user_id) => {
  const inventory = await prisma.users.findFirst({
    where: {
      id: user_id,
      my_items: {
        some: {
          shop_item: {
            type: ShopItemsType.POWERUPS,
          },
        },
      },
    },
    select: {
      my_items: {
        select: {
          shop_item: {
            select: {
              id: true,
              name: true,
              description: true,
              picture_url: true,
              type: true,
            },
          },
          quantity: true,
        },
      },
    },
  });

  const my_inventory = [];
  console.log("myInventory", inventory);
  inventory?.my_items?.forEach((item) => {
    my_inventory.push({
      id: item.shop_item.id,
      name: item.shop_item.name,
      description: item.shop_item.description,
      picture_url: item.shop_item.picture_url,
      type: item.shop_item.type,
      quantity: item.quantity,
    });
  });
  return my_inventory;
};

const userDistrictsCollectablesAndNextCollectableId = async (user_id) => {
  const districts = await prisma.districts.findMany({
    include: {
      collectables: {
        include: {
          user_collectables: {
            where: {
              user_id,
            },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      },
    },
  });

  let nextCollectable;

  districts.forEach((district) => {
    let is_district_complete = true;
    const user_collectables = [];
    district.collectables.forEach((collectable) => {
      if (collectable.user_collectables.length <= 0) {
        delete collectable.user_collectables;
        // is_district_complete = false;
        if (!nextCollectable) nextCollectable = collectable;
      } else {
        delete collectable.user_collectables;
        user_collectables.push(collectable);
      }
    });
    delete district.collectables;
    district.user_collectables = user_collectables;
    district.is_district_complete = is_district_complete;

    if (!is_district_complete) delete district.complete_picture_url;
  });

  return { districts, nextCollectable };
};

module.exports = {
  CONSTANTS,
  timeExpired,
  clean,
  getError,
  getSuccessData,
  sendError,
  sendSuccess,
  createToken,
  UpdateUserAchievements,
  userUsedItems,
  myInventory,
  userDistrictsCollectablesAndNextCollectableId,
};
