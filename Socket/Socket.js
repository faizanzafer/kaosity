const socketio = require("socket.io");

const prisma = require("../_Prisma");
const { getEnv } = require("../config");
const { getUserfromId } = require("../database/Auth");
const { SendNotification } = require("../Notifications/notification");
const {
  getError,
  getSuccessData,
  createToken,
  UpdateUserAchievements,
  userUsedItems,
  userDistrictsCollectablesAndNextCollectableId,
} = require("../helpers");
const {
  soloMatchDetailsValidation,
  soloMatchEndDetailsValidation,
  vsMatchDetailsValidation,
  vsMatchResponceDetailsValidation,
  vsMatchEndDetailsValidation,
  matchLeftValidation,
} = require("../routes/validate");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  getUserFromToken,
} = require("./users");
const {
  getUserActiveMatch,
  getUserAndFriendUserMatch,
  addUserToMatch,
  getUserAllMatches,
  removeMatch,
} = require("./Matches");
const { MatchStatuses } = require("./Constants");
const {
  MatchStatus,
  MatchType,
  RequestStatus,
  NotificationType,
  NotificationRequestStatus,
  FriendRequestStatus,
} = require(".prisma/client");
const { MatchDeficulty } = require("@prisma/client");
const { now } = require("mongoose");

class Socket {
  static io = null;
  static async setupSocket(server) {
    this.io = socketio(server, {
      cors: {
        origin: "*",
      },
    });

    this.io.on("connect", (socket) => {
      socket.on("join", async ({ token }, callback) => {
        try {
          const { error, user } = await addUser({ token, socketId: socket.id });

          if (error) return callback(getError(error));
          return callback(
            getSuccessData("User Connected to Socket Successfully")
          );
        } catch (catchError) {
          if (catchError && catchError.message) {
            console.log(getError(catchError.message));
            return;
          }
          console.log(getError(catchError));
          return;
        }
      });

      socket.on(
        "start_solo_match",
        async ({ token, match_details }, callback) => {
          try {
            if (!token) return callback(getError("token is required."));
            if (!match_details)
              return callback(getError("match_details are required."));

            const { error: match_error, value } =
              soloMatchDetailsValidation(match_details);
            if (match_error) {
              return callback(getError(match_error.details[0].message));
            }
            const {
              deficulty_level,
              //  quiz_category_id
            } = value;

            const { error, userData } = await getUserFromToken(token);
            if (error) {
              return callback(getError(error));
            }
            const user_id = userData.id;
            const userPrimary = getUser(user_id, socket.id);
            if (!userPrimary) {
              return callback(
                getError("un registered user in sockets cannot use sockets")
              );
            }

            if (getUserActiveMatch(user_id))
              return callback(getError("You are already playing"));

            const matchInDb = await getMatchInDbForUser(user_id);
            if (matchInDb) {
              return callback(getError("You are already playing."));
            }

            const quizQuestions = await prisma.$queryRaw`SELECT
                                    *
                                  FROM
                                  public."QuizQuestions"
                                  ORDER BY
                                    RANDOM()
                                  LIMIT ${
                                    deficulty_level == MatchDeficulty.EASY
                                      ? 15
                                      : deficulty_level == MatchDeficulty.MEDIUM
                                      ? 20
                                      : 25
                                  };`;

            if (quizQuestions.length <= 0)
              return callback(
                getError("Questions are not available right now")
              );

            quizQuestions.forEach(
              (questions) => (questions.options = JSON.parse(questions.options))
            );

            const { error: addUserToMatchError, match } = addUserToMatch(
              MatchStatuses.ACTIVE,
              user_id
            );

            if (addUserToMatchError)
              return callback(getError(addUserToMatchError));

            const { diamonds } = userData;

            if (diamonds < 1) {
              removeMatch(match);
              return callback(getError("Not enough diamonds to play game"));
            }

            await prisma.users.update({
              where: {
                id: user_id,
              },
              data: {
                diamonds: {
                  decrement: 1,
                },
                diamonds_refilled_at: diamonds == 5 ? new Date() : undefined,
              },
            });

            const createMatch = await prisma.matches.create({
              data: {
                user_id,
                friend_user_id: user_id,
                match_type: MatchType.SOLO,
                match_deficulty: deficulty_level,
                match_status_for_friend_user_id: MatchStatus.ACTIVE,
              },
            });

            return callback(
              getSuccessData({
                quiz_questions: quizQuestions,
                match_id: createMatch.id,
              })
            );
          } catch (catchError) {
            if (catchError && catchError.message) {
              console.log(getError(catchError.message));
              return;
            }
            console.log(getError(catchError));
            return;
          }
        }
      );

      socket.on("end_solo_match", async (params, callback) => {
        try {
          const { error: _joiError, value } =
            soloMatchEndDetailsValidation(params);

          if (_joiError)
            return callback(getError(_joiError.details[0].message));

          const { token, match_id, points, items, is_all_answers_are_correct } =
            value;

          const noOfAnswers = parseInt(points / 10);

          const xp = noOfAnswers * 10;

          const { error, userData } = await getUserFromToken(token);

          if (error) {
            return callback(getError(error));
          }

          const user_id = userData.id;

          const userPrimary = getUser(user_id, socket.id);
          if (!userPrimary) {
            return callback(
              getError("un registered user in sockets cannot use sockets")
            );
          }

          const matchInDb = await prisma.matches.findFirst({
            where: {
              id: match_id,
              user_id: user_id,
              match_status_for_user_id: MatchStatus.ACTIVE,
              match_type: MatchType.SOLO,
            },
          });
          if (!matchInDb) {
            return callback(getError("Match do not exist."));
          }

          await prisma.matches.update({
            where: {
              id: match_id,
            },
            data: {
              match_status_for_user_id: MatchStatus.COMPLETED,
              match_status_for_friend_user_id: MatchStatus.COMPLETED,
              user_points: points,
              friend_user_points: points,
              winner_points: points,
              winner_id: user_id,
            },
          });

          const matches = getUserAllMatches(user_id);
          matches.forEach((match) => removeMatch(match));

          const user = userData;
          const level = userData.level;
          const xpLevel = await prisma.xPLevel.findFirst({
            where: {
              level: user.level,
            },
          });

          // Level Up
          let updatedUser = user;
          let newCollectable;
          if (xpLevel && user.xp + xp >= xpLevel.xp_required) {
            updatedUser = await prisma.users.update({
              where: {
                id: user.id,
              },
              data: {
                diamonds: {
                  increment: 3,
                },
                current_points: user.current_points + points,
                weekly_points: user.weekly_points + points,
                monthly_points: user.monthly_points + points,
                xp: user.xp + xp - xpLevel.xp_required,
                level: ++user.level,
              },
            });
            const { nextCollectable } =
              await userDistrictsCollectablesAndNextCollectableId(user_id);
            console.log("nextCollectable", nextCollectable);
            if (nextCollectable) {
              await prisma.userCollectables.create({
                data: {
                  user_id,
                  collectable_id: nextCollectable.id,
                },
              });
              newCollectable = nextCollectable.picture_url;
            }
          } else {
            updatedUser = await prisma.users.update({
              where: {
                id: user.id,
              },
              data: {
                current_points: user.current_points + points,
                weekly_points: user.weekly_points + points,
                monthly_points: user.monthly_points + points,
                xp: xpLevel ? user.xp + xp : undefined,
              },
            });
          }

          const { usedItemsNames, total_count } = await userUsedItems(
            items,
            user_id
          );

          const { user_from_achievement_update_func } =
            await UpdateUserAchievements({
              user: updatedUser,
              is_solo_game: true,
              no_of_answers: noOfAnswers,
              level_reach:
                xpLevel && user.xp + xp >= xpLevel.xp_required
                  ? true
                  : undefined,
              coins_earned: parseInt(points),
              is_all_answers_are_correct,
              no_of_items_used: total_count,
              no_of_times_kaos_visions_item_used:
                usedItemsNames.find((i) => i.name == "Kaos Vision")?.count ??
                undefined,
              no_of_times_microphone_item_used:
                usedItemsNames.find((i) => i.name == "Microphone")?.count ??
                undefined,
              no_of_times_do_over_item_used:
                usedItemsNames.find((i) => i.name == "Do-Over")?.count ??
                undefined,
              no_of_times_time_zone_item_used:
                usedItemsNames.find((i) => i.name == "Time Zone")?.count ??
                undefined,
              comic_piece: true,
              no_of_collectable_items_found: newCollectable ? 1 : undefined,
            });

          return callback(
            getSuccessData({
              token: await createToken(user_from_achievement_update_func),
              new_collectable: newCollectable,
              is_leveled_up: newCollectable ? true : false,
            })
          );
        } catch (catchError) {
          if (catchError && catchError.message) {
            console.log(getError(catchError.message));
            return;
          }
          console.log(getError(catchError));
          return;
        }
      });

      socket.on("match_left", async (params, callback) => {
        try {
          const { error: _joiError, value } = matchLeftValidation(params);

          if (_joiError)
            return callback(getError(_joiError.details[0].message));

          const { token, match_id, items } = value;

          const { error, userData } = await getUserFromToken(token);
          if (error) {
            return callback(getError(error));
          }
          const user_id = userData.id;
          const userPrimary = getUser(user_id, socket.id);
          if (!userPrimary) {
            return callback(
              getError("un registered user in sockets cannot use sockets")
            );
          }

          const matchInDb = await prisma.matches.findFirst({
            where: {
              id: match_id,
            },
            include: {
              match_starter: true,
              match_invited_to: true,
            },
          });

          if (!matchInDb) return callback(getError("Match do not exist."));

          if (matchInDb.user_id != user_id)
            if (matchInDb.friend_user_id != user_id)
              return callback(getError("Match do not exist."));

          if (
            matchInDb.user_id == user_id &&
            matchInDb.match_status_for_user_id != MatchStatus.ACTIVE
          )
            return callback(getError("Match do not exist for you."));

          if (
            matchInDb.friend_user_id == user_id &&
            matchInDb.match_status_for_friend_user_id != MatchStatus.ACTIVE
          )
            return callback(getError("Match do not exist for you."));

          const matches = getUserAllMatches(user_id);
          matches.forEach((match) => removeMatch(match));

          let updatedUser = userData;

          const { usedItemsNames, total_count } = await userUsedItems(
            items,
            user_id
          );

          const { user_from_achievement_update_func } =
            await UpdateUserAchievements({
              user: updatedUser,
              no_of_items_used: total_count,
              no_of_times_kaos_visions_item_used:
                usedItemsNames.find((i) => i.name == "Kaos Vision")?.count ??
                undefined,
              no_of_times_microphone_item_used:
                usedItemsNames.find((i) => i.name == "Microphone")?.count ??
                undefined,
              no_of_times_do_over_item_used:
                usedItemsNames.find((i) => i.name == "Do-Over")?.count ??
                undefined,
              no_of_times_time_zone_item_used:
                usedItemsNames.find((i) => i.name == "Time Zone")?.count ??
                undefined,
            });

          if (matchInDb.match_type == MatchType.SOLO) {
            if (
              matchInDb.user_id == user_id &&
              matchInDb.match_status_for_user_id == MatchStatus.ACTIVE
            ) {
              await prisma.matches.delete({
                where: {
                  id: match_id,
                },
              });

              const matches = getUserAllMatches(user_id);
              matches.forEach((match) => removeMatch(match));

              return callback(
                getSuccessData({
                  message: "you left the match.",
                  token: await createToken(user_from_achievement_update_func),
                })
              );
            }
            return callback(getError("Invalid match."));
          } else {
            const friendUser =
              matchInDb.user_id != user_id
                ? matchInDb.match_starter
                : matchInDb.match_invited_to;

            if (matchInDb.friend_user_id == user_id) {
              if (
                matchInDb.match_status_for_user_id == MatchStatus.COMPLETED &&
                !matchInDb.user_points
              ) {
                await prisma.matches.delete({
                  where: {
                    id: match_id,
                  },
                });
              } else {
                await prisma.matches.update({
                  where: {
                    id: match_id,
                  },
                  data: {
                    match_status_for_friend_user_id: MatchStatus.COMPLETED,
                    winner_points: matchInDb.user_points
                      ? matchInDb.user_points
                      : matchInDb.winner_points,
                    winner_id: matchInDb.user_points
                      ? matchInDb.user_id
                      : matchInDb.winner_id,
                  },
                });

                const friend_user_id =
                  matchInDb.user_id == user_id
                    ? matchInDb.friend_user_id
                    : matchInDb.user_id;

                const isRequestPending = await isRequestSent(
                  user_id,
                  friend_user_id
                );

                const isNotifi = await prisma.notifications.findFirst({
                  where: {
                    sender: user_id,
                    reciever_id: friend_user_id,
                    notification_type: NotificationType.MATCH_REQUEST,
                  },
                });

                if (
                  isRequestPending &&
                  isRequestPending.status == FriendRequestStatus.PENDING
                )
                  await prisma.friendUsers.delete({
                    where: {
                      id: isRequestPending.id,
                    },
                  });
                await prisma.notifications.delete({
                  where: {
                    id: isNotifi.id,
                  },
                });
              }

              if (
                matchInDb.match_status_for_user_id == MatchStatus.COMPLETED &&
                matchInDb.user_points
              ) {
                if (friendUser) {
                  await UpdateUserAchievements({
                    user: friendUser,
                    win_challenge_game: true,
                  });
                }
                const userSecondary = getUser(matchInDb.user_id);
                if (userSecondary) {
                  socket
                    .to(userSecondary.socketId)
                    .emit(
                      "vs_match_left",
                      getSuccessData("You won the match.")
                    );
                }
              }
              return callback(getSuccessData("you left the match."));
            }

            if (
              matchInDb.match_status_for_friend_user_id ==
                MatchStatus.COMPLETED &&
              !matchInDb.friend_user_points
            ) {
              await prisma.matches.delete({
                where: {
                  id: match_id,
                },
              });
            } else {
              await prisma.matches.update({
                where: {
                  id: match_id,
                },
                data: {
                  match_status_for_user_id: MatchStatus.COMPLETED,
                  winner_points: matchInDb.friend_user_points
                    ? matchInDb.friend_user_points
                    : matchInDb.winner_points,
                  winner_id: matchInDb.friend_user_points
                    ? matchInDb.friend_user_id
                    : matchInDb.winner_id,
                },
              });

              const friend_user_id =
                matchInDb.user_id == user_id
                  ? matchInDb.friend_user_id
                  : matchInDb.user_id;

              const isRequestPending = await isRequestSent(
                user_id,
                friend_user_id
              );

              const isNotifiExist = await prisma.notifications.findFirst({
                where: {
                  sender: user_id,
                  reciever_id: friend_user_id,
                  notification_type: NotificationType.MATCH_REQUEST,
                },
              });

              if (
                isRequestPending &&
                isRequestPending.status == FriendRequestStatus.PENDING
              )
                await prisma.friendUsers.delete({
                  where: {
                    id: isRequestPending.id,
                  },
                });

              await prisma.notifications.delete({
                where: {
                  id: isNotifiExist.id,
                },
              });
            }

            if (
              matchInDb.match_status_for_friend_user_id ==
                MatchStatus.COMPLETED &&
              matchInDb.friend_user_points
            ) {
              if (friendUser) {
                await UpdateUserAchievements({
                  user: friendUser,
                  win_challenge_game: true,
                });
              }

              const userSecondary = getUser(matchInDb.friend_user_id);
              if (userSecondary) {
                socket
                  .to(userSecondary.socketId)
                  .emit("vs_match_left", getSuccessData("You won the match."));
              }
            }
            return callback(getSuccessData("you left the match."));
          }
        } catch (catchError) {
          if (catchError && catchError.message) {
            console.log(getError(catchError.message));
            return;
          }
          console.log(getError(catchError));
          return;
        }
      });

      socket.on(
        "request_vs_match",
        async ({ token, match_details }, callback) => {
          try {
            if (!token) return callback(getError("token is required."));
            if (!match_details)
              return callback(getError("match_details are required."));
            const { error: match_error, value } =
              vsMatchDetailsValidation(match_details);
            if (match_error) {
              return callback(getError(match_error.details[0].message));
            }

            const {
              friend_user_id,
              deficulty_level,
              //  quiz_category_id
            } = value;
            const { error, userData } = await getUserFromToken(token);
            if (error) {
              return callback(getError(error));
            }
            const user_id = userData.id;
            const userPrimary = getUser(user_id, socket.id);
            if (!userPrimary) {
              return callback(getError("Un registered user in socket."));
            }

            if (getUserActiveMatch(user_id))
              return callback(getError("You are already playing"));

            const matchInDb = await getMatchInDbForUser(user_id);
            if (matchInDb) {
              return callback(getError("You are already playing."));
            }

            const friendUser = await getUserfromId(friend_user_id);

            if (!friendUser) {
              return callback(
                getError("Other user is not available in our records.")
              );
            }
            const userSecondary = getUser(friend_user_id);
            // if (!userSecondary) {
            //   return callback(getError("Other user is offline."));
            // }
            if (getUserActiveMatch(friend_user_id))
              return callback(getError("User is already playing."));

            const matchInDbForSecondaryUser = await getMatchInDbForUser(
              friend_user_id
            );

            if (matchInDbForSecondaryUser) {
              return callback(getError("User is already playing"));
            }

            // const productsCount = await prisma.quizQuestions.count();
            // const skip = Math.floor(Math.random() * productsCount);
            // const quizQuestions = await prisma.quizQuestions.findMany({
            //   take:
            //     deficulty_level == MatchDeficulty.EASY
            //       ? 15
            //       : deficulty_level == MatchDeficulty.MEDIUM
            //       ? 20
            //       : 25,
            //       skip: skip,
            // });
            //  console.log("Quiz" ,quizQuestions.length);
            const quizQuestions = await prisma.$queryRaw`SELECT
            *
          FROM
          public."QuizQuestions"
          ORDER BY
            RANDOM()
          LIMIT ${
            deficulty_level == MatchDeficulty.EASY
              ? 15
              : deficulty_level == MatchDeficulty.MEDIUM
              ? 20
              : 25
          };`;

            if (quizQuestions.length <= 0)
              return callback(
                getError("Questions are not available right now")
              );
            quizQuestions.forEach(
              (questions) => (questions.options = JSON.parse(questions.options))
            );

            const { error: addUserToMatchError, match } = addUserToMatch(
              MatchStatuses.ACTIVE,
              user_id
            );
            if (addUserToMatchError)
              return callback(getError(addUserToMatchError));

            const { crowns } = userData;

            if (crowns < 1) {
              removeMatch(match);
              return callback(getError("Not enough crowns to play game"));
            }

            await prisma.users.update({
              where: {
                id: user_id,
              },
              data: {
                crowns: {
                  decrement: 1,
                },
                crowns_refilled_at: crowns == 5 ? new Date() : undefined,
              },
            });

            const requestAlreadySent = await isRequestSent(
              user_id,
              friend_user_id
            );

            const isNotification = await prisma.notifications.findFirst({
              where: {
                sender: user_id,
                reciever_id: friend_user_id,
                notification_type: NotificationType.MATCH_REQUEST,
              },
            });

            var createMatch = await prisma.matches.create({
              data: {
                user_id,
                friend_user_id: friend_user_id,
                match_type: MatchType.VSFRIEND,
                match_deficulty: deficulty_level,
              },
              select: {
                id: true,
                match_deficulty: true,
              },
            });

            if (!requestAlreadySent) {
              var frnd = await prisma.friendUsers.create({
                data: {
                  user_id,
                  friend_user_id,
                },
              });
            }

            if (!isNotification) {
              await prisma.notifications.create({
                data: {
                  sender: user_id,
                  reciever_id: friend_user_id,
                  notification_type: NotificationType.MATCH_REQUEST,
                  match_id: createMatch?.id,
                  friend_request_id: frnd?.id,
                },
              });
            } else {
              await prisma.notifications.update({
                where: {
                  id: isNotification.id,
                },
                data: {
                  sender: user_id,
                  reciever_id: friend_user_id,
                  created_at: new Date(),
                  seen: false,
                },
              });
            }

            const socketResponse = {
              user_data: userData,
              match_details: createMatch,
            };

            if (userSecondary) {
              socket
                .to(userSecondary.socketId)
                .emit("request_vs_match", getSuccessData(socketResponse));
            }
            // const {firstname} = req.user;
            const isNotify = await prisma.users.findFirst({
              where: {
                id: friend_user_id,
                is_registered: true,
                show_notifications: true,
              },
            });
            if (isNotify) {
              if (isNotify.fcm_token) {
                SendNotification(
                  isNotify.fcm_token,
                  {
                    title: userData.user_name,
                    body: "Challenged you for a playing trivia",
                  },
                  {
                    match_id: createMatch.id,
                    friend_user_id: user_id,
                    friend_name: userData.user_name,
                    friend_pic: userData.avatar_url,
                  }
                )
                  .then((res) => {
                    console.log(res, "done");
                  })
                  .catch((error) => {
                    console.log(error, "Error sending notification");
                  });
              }
            }

            return callback(
              getSuccessData({
                quiz_questions: quizQuestions,
                match_id: createMatch.id,
              })
            );
          } catch (catchError) {
            if (catchError && catchError.message) {
              console.log(getError(catchError.message));
              return;
            }
            console.log(getError(catchError));
            return;
          }
        }
      );

      socket.on(
        "respond_to_vs_match",
        async ({ token, match_details }, callback) => {
          try {
            if (!token) return callback(getError("token is required."));
            if (!match_details)
              return callback(getError("match_details are required."));
            const { error: match_error, value } =
              vsMatchResponceDetailsValidation(match_details);
            if (match_error) {
              return callback(getError(match_error.details[0].message));
            }

            const { match_id, friend_user_id, response_type } = value;

            const { error, userData } = await getUserFromToken(token);
            if (error) {
              return callback(getError(error));
            }
            const user_id = userData.id;
            const userPrimary = getUser(user_id, socket.id);
            if (!userPrimary) {
              return callback(getError("Un registered user in socket."));
            }
            const friendUser = await getUserfromId(friend_user_id);
            if (!friendUser) {
              return callback(
                getError("Other user is not available in our records.")
              );
            }

            const userSecondary = getUser(friend_user_id);

            if (getUserActiveMatch(user_id))
              return callback(getError("You are already playing."));

            const matchInDb = await prisma.matches.findFirst({
              where: {
                id: match_id,
              },
            });
            if (
              !matchInDb ||
              (matchInDb &&
                (matchInDb.friend_user_id !== user_id ||
                  matchInDb.match_status_for_friend_user_id ==
                    MatchStatus.COMPLETED ||
                  matchInDb.match_type != MatchType.VSFRIEND))
            ) {
              return callback(getError("Match do not exist."));
            }

            if (matchInDb.match_status_for_friend_user_id == MatchStatus.ACTIVE)
              return callback(getError("You are already playing this match."));

            const isNoti = await prisma.notifications.findFirst({
              where: {
                OR: [
                  {
                    sender: user_id,
                    reciever_id: friend_user_id,
                    match_id: match_id,
                    notification_type: NotificationType.MATCH_REQUEST,
                  },
                  {
                    sender: friend_user_id,
                    reciever_id: user_id,
                    match_id: match_id,
                    notification_type: NotificationType.MATCH_REQUEST,
                  },
                ],
              },
            });

            const frindReq = await prisma.friendUsers.findFirst({
              where: {
                OR: [
                  {
                    user_id,
                    friend_user_id,
                    status: FriendRequestStatus.PENDING,
                  },
                  {
                    user_id: friend_user_id,
                    friend_user_id: user_id,
                    status: FriendRequestStatus.PENDING,
                  },
                ],
              },
            });

            if (response_type == "decline") {
              if (
                matchInDb.match_status_for_user_id == MatchStatus.COMPLETED &&
                !matchInDb.user_points
              ) {
                await prisma.notifications.delete({
                  where: {
                    id: isNoti?.id,
                  },
                });

                await prisma.friendUsers.delete({
                  where: {
                    id: frindReq?.id,
                  },
                });

                await prisma.matches.delete({
                  where: {
                    id: match_id,
                  },
                });
                return callback(
                  getSuccessData({
                    match_details,
                    message: "You declines the invitation.",
                  })
                );
              }

              await prisma.matches.update({
                where: {
                  id: match_id,
                },
                data: {
                  match_status_for_friend_user_id: MatchStatus.COMPLETED,
                  winner_points: matchInDb.user_points
                    ? matchInDb.user_points
                    : matchInDb.winner_points,
                  winner_id: matchInDb.user_points
                    ? matchInDb.user_id
                    : matchInDb.winner_id,
                },
              });

              const isRequestPending = await isRequestSent(
                user_id,
                friend_user_id
              );

              const isNotifi = await prisma.notifications.findFirst({
                where: {
                  OR: [
                    {
                      sender: user_id,
                      reciever_id: friend_user_id,
                      notification_type: NotificationType.MATCH_REQUEST,
                    },
                    {
                      sender: friend_user_id,
                      reciever_id: user_id,
                      notification_type: NotificationType.MATCH_REQUEST,
                    },
                  ],
                },
              });

              if (
                isRequestPending &&
                isRequestPending.status == FriendRequestStatus.PENDING
              )
                await prisma.friendUsers.delete({
                  where: {
                    id: isRequestPending?.id,
                  },
                });
              await prisma.notifications.delete({
                where: {
                  id: isNotifi?.id,
                },
              });

              if (userSecondary) {
                socket.to(userSecondary.socketId).emit(
                  "respond_to_vs_match",
                  getSuccessData({
                    user_data: userData,
                    message: "User declines your invitation.",
                  })
                );
              }

              return callback(
                getSuccessData({
                  match_details,
                  message: "You declines the invitation.",
                })
              );
            }

            // const quizQuestions = await prisma.quizQuestions.findMany({
            //   take:
            //     matchInDb.match_deficulty == MatchDeficulty.EASY
            //       ? 15
            //       : matchInDb.match_deficulty == MatchDeficulty.MEDIUM
            //       ? 20
            //       : 25,
            // });
            const deficulty_level = matchInDb.match_deficulty;

            const quizQuestions = await prisma.$queryRaw`SELECT
            *
          FROM
          public."QuizQuestions"
          ORDER BY
            RANDOM()
          LIMIT ${
            deficulty_level == MatchDeficulty.EASY
              ? 15
              : deficulty_level == MatchDeficulty.MEDIUM
              ? 20
              : 25
          };`;

            if (quizQuestions.length <= 0)
              return callback(
                getError("Questions are not available right now")
              );
            quizQuestions.forEach(
              (questions) => (questions.options = JSON.parse(questions.options))
            );

            const requestAlreadySent = await isRequestSent(
              user_id,
              friend_user_id
            );
            if (!requestAlreadySent) {
              return callback(
                getError("You cannot accept an unknown invitation")
              );
            }

            if (requestAlreadySent.status !== FriendRequestStatus.ACCEPTED)
              await prisma.friendUsers.update({
                where: { id: requestAlreadySent.id },
                data: {
                  status: FriendRequestStatus.ACCEPTED,
                },
              });

            const { error: addUserToMatchError, match } = addUserToMatch(
              MatchStatuses.ACTIVE,
              user_id
            );
            if (addUserToMatchError)
              return callback(getError(addUserToMatchError));

            await prisma.matches.update({
              where: {
                id: matchInDb?.id,
              },
              data: {
                match_status_for_friend_user_id: MatchStatus.ACTIVE,
              },
            });

            await prisma.notifications.delete({
              where: {
                id: isNoti?.id,
              },
            });

            const callbackResponse = {
              user_data: friendUser,
              match_id,
              quiz_questions: quizQuestions,
            };

            return callback(getSuccessData(callbackResponse));
          } catch (catchError) {
            if (catchError && catchError.message) {
              console.log(getError(catchError.message));
              return;
            }
            console.log(getError(catchError));
            return;
          }
        }
      );

      socket.on("vs_match_end", async (params, callback) => {
        try {
          const { error: _joiError, value } =
            vsMatchEndDetailsValidation(params);

          if (_joiError)
            return callback(getError(_joiError.details[0].message));

          const {
            token,
            match_id,
            friend_user_id,
            points,
            items,
            is_all_answers_are_correct,
          } = value;

          const noOfAnswers = parseInt(points / 10);

          const xp = noOfAnswers * 10;

          const { error, userData } = await getUserFromToken(token);
          if (error) {
            return callback(getError(error));
          }

          const user_id = userData.id;
          const userPrimary = getUser(user_id, socket.id);
          if (!userPrimary) {
            return callback(
              getError("un registered user in sockets cannot use sockets")
            );
          }

          const matchInDb = await prisma.matches.findFirst({
            where: {
              id: match_id,
              match_type: MatchType.VSFRIEND,
            },
            include: {
              match_starter: true,
              match_invited_to: true,
            },
          });
          // select: {
          //   id: true,
          //   user_name: true,
          //   avatar_url: true,
          // },
          if (!matchInDb) {
            return callback(getError("Match do not exist"));
          }

          if (matchInDb.user_id != user_id)
            if (matchInDb.friend_user_id != user_id)
              return callback(getError("Match do not exist."));

          if (
            matchInDb.user_id == user_id &&
            matchInDb.match_status_for_user_id != MatchStatus.ACTIVE
          )
            return callback(getError("Match do not exist for you."));

          if (
            matchInDb.friend_user_id == user_id &&
            matchInDb.match_status_for_friend_user_id != MatchStatus.ACTIVE
          )
            return callback(getError("Match do not exist for you."));

          const matches = getUserAllMatches(user_id);
          matches.forEach((match) => removeMatch(match));

          const friendUser =
            matchInDb.user_id != user_id
              ? matchInDb.match_starter
              : matchInDb.match_invited_to;

          // Refactoring match_starter & match_invited_to objects
          matchInDb.match_starter = {
            id: matchInDb.match_starter.id,
            user_name: matchInDb.match_starter.user_name,
            avatar_url: matchInDb.match_starter.avatar_url,
          };

          matchInDb.match_invited_to = {
            id: matchInDb.match_invited_to.id,
            user_name: matchInDb.match_invited_to.user_name,
            avatar_url: matchInDb.match_invited_to.avatar_url,
          };
          //

          // Here I was invited to match
          if (matchInDb.friend_user_id == user_id) {
            if (
              matchInDb.match_status_for_user_id == MatchStatus.COMPLETED &&
              !matchInDb.user_points
            ) {
              await prisma.matches.update({
                where: {
                  id: match_id,
                },
                data: {
                  match_status_for_friend_user_id: MatchStatus.COMPLETED,
                  friend_user_points: points,
                  winner_points: points,
                  winner_id: user_id,
                },
              });
            } else {
              await prisma.matches.update({
                where: {
                  id: match_id,
                },
                data: {
                  match_status_for_friend_user_id: MatchStatus.COMPLETED,
                  friend_user_points: points,
                  winner_points:
                    matchInDb.user_points && matchInDb.user_points > points
                      ? matchInDb.user_points
                      : points,
                  winner_id:
                    matchInDb.user_points && matchInDb.user_points > points
                      ? matchInDb.user_id
                      : user_id,
                },
              });
            }

            if (
              matchInDb.match_status_for_user_id == MatchStatus.COMPLETED &&
              matchInDb.user_points
            ) {
              if (friendUser & (matchInDb.user_points >= points)) {
                await UpdateUserAchievements({
                  user: friendUser,
                  win_challenge_game: true,
                });
              }
              const userSecondary = getUser(matchInDb.user_id);
              if (userSecondary) {
                const socketResponse = {
                  match_id: matchInDb.id,
                  opponent:
                    matchInDb.user_id == user_id
                      ? matchInDb.match_starter
                      : matchInDb.match_invited_to,
                };

                // await prisma.notifications.create({
                //   data: {
                //     sender,
                //     reciever_id,
                //     match_id,
                //     notification_type: NotificationType.RESULT,
                //   },
                // });

                socket
                  .to(userSecondary.socketId)
                  .emit("vs_match_end", getSuccessData(socketResponse));
              }
            }

            const user = userData;
            const level = userData.level;
            const xpLevel = await prisma.xPLevel.findFirst({
              where: {
                level: user.level,
              },
            });

            // Level Up
            let updatedUser = user;
            let newCollectable;
            if (xpLevel && user.xp + xp >= xpLevel.xp_required) {
              updatedUser = await prisma.users.update({
                where: {
                  id: user.id,
                },
                data: {
                  diamonds: {
                    increment: 3,
                  },
                  current_points: user.current_points + points,
                  weekly_points: user.weekly_points + points,
                  monthly_points: user.monthly_points + points,
                  xp: user.xp + xp - xpLevel.xp_required,
                  level: ++user.level,
                },
              });
              const { nextCollectable } =
                await userDistrictsCollectablesAndNextCollectableId(user_id);

              if (nextCollectable) {
                await prisma.userCollectables.create({
                  data: {
                    user_id,
                    collectable_id: nextCollectable.id,
                  },
                });
                newCollectable = nextCollectable.picture_url;
              }
            } else {
              updatedUser = await prisma.users.update({
                where: {
                  id: user.id,
                },
                data: {
                  current_points: user.current_points + points,
                  weekly_points: user.weekly_points + points,
                  monthly_points: user.monthly_points + points,
                  xp: xpLevel ? user.xp + xp : undefined,
                },
              });
            }

            const { usedItemsNames, total_count } = await userUsedItems(
              items,
              user_id
            );

            const { user_from_achievement_update_func } =
              await UpdateUserAchievements({
                user: updatedUser,
                is_challenge_game: true,
                no_of_answers: noOfAnswers,
                level_reach:
                  xpLevel && user.xp + xp >= xpLevel.xp_required
                    ? true
                    : undefined,
                coins_earned: parseInt(points),
                is_all_answers_are_correct,
                win_challenge_game:
                  (matchInDb.match_status_for_user_id ==
                    MatchStatus.COMPLETED &&
                    (!matchInDb.user_points ||
                      (matchInDb.user_points &&
                        points >= matchInDb.user_points))) == true
                    ? true
                    : undefined,
                win_challenge_game_without_item_use:
                  (matchInDb.match_status_for_user_id ==
                    MatchStatus.COMPLETED &&
                    (!matchInDb.user_points ||
                      (matchInDb.user_points &&
                        points >= matchInDb.user_points)) &&
                    total_count <= 0) == true
                    ? true
                    : undefined,
                no_of_items_used: total_count,
                no_of_times_kaos_visions_item_used:
                  usedItemsNames.find((i) => i.name == "Kaos Vision")?.count ??
                  undefined,
                no_of_times_microphone_item_used:
                  usedItemsNames.find((i) => i.name == "Microphone")?.count ??
                  undefined,
                no_of_times_do_over_item_used:
                  usedItemsNames.find((i) => i.name == "Do-Over")?.count ??
                  undefined,
                no_of_times_time_zone_item_used:
                  usedItemsNames.find((i) => i.name == "Time Zone")?.count ??
                  undefined,
                comic_piece: true,
                no_of_collectable_items_found: newCollectable ? 1 : undefined,
              });

            const token = await createToken(user_from_achievement_update_func);

            const responseForSocket =
              matchInDb.match_status_for_user_id == MatchStatus.COMPLETED &&
              (!matchInDb.user_points ||
                (matchInDb.user_points && matchInDb.user_points >= points))
                ? async () => {
                    if (matchInDb.friend_user_id !== user_id) {
                      await prisma.notifications.create({
                        data: {
                          sender: friend_user_id,
                          reciever_id: user_id,
                          notification_type: NotificationType.RESULT,
                          match_id: matchInDb?.id,
                        },
                      });
                      await prisma.notifications.create({
                        data: {
                          sender: user_id,
                          reciever_id: friend_user_id,
                          notification_type: NotificationType.RESULT,
                          match_id: matchInDb?.id,
                        },
                      });
                    } else {
                      await prisma.notifications.create({
                        data: {
                          sender: user_id,
                          reciever_id: friend_user_id,
                          notification_type: NotificationType.RESULT,
                          match_id: matchInDb?.id,
                        },
                      });
                      await prisma.notifications.create({
                        data: {
                          sender: friend_user_id,
                          reciever_id: user_id,
                          notification_type: NotificationType.RESULT,
                          match_id: matchInDb?.id,
                        },
                      });
                    }
                    return {
                      my_points: points,
                      friend_user_points: matchInDb.user_points,
                      token,
                      message: "You won the match",
                      is_leveled_up:
                        user_from_achievement_update_func.level > level,
                    };
                  }
                : async () => {
                    return {
                      my_points: points,
                      friend_user_points: matchInDb.user_points,
                      token,
                      new_collectable: newCollectable,
                      is_leveled_up:
                        user_from_achievement_update_func.level > level,
                    };
                  };
            // ? {
            //     my_points: points,
            //     friend_user_points: matchInDb.user_points,
            //     token,
            //     message: "You won the match",
            //     is_leveled_up:
            //       user_from_achievement_update_func.level > level,
            //   }
            // : {
            //     my_points: points,
            //     friend_user_points: matchInDb.user_points,
            //     token,
            //     new_collectable: newCollectable,
            //     is_leveled_up:
            //       user_from_achievement_update_func.level > level,
            //   };
            const _responseForSocket = await responseForSocket();
            return callback(getSuccessData(_responseForSocket));
          } else {
            // Here I started the match

            if (
              matchInDb.match_status_for_friend_user_id ==
                MatchStatus.COMPLETED &&
              !matchInDb.friend_user_points
            ) {
              await prisma.matches.update({
                where: {
                  id: match_id,
                },
                data: {
                  match_status_for_user_id: MatchStatus.COMPLETED,
                  user_points: points,
                  winner_points: points,
                  winner_id: user_id,
                },
              });
            } else {
              await prisma.matches.update({
                where: {
                  id: match_id,
                },
                data: {
                  match_status_for_user_id: MatchStatus.COMPLETED,
                  user_points: points,
                  winner_points:
                    matchInDb.friend_user_points &&
                    matchInDb.friend_user_points > points
                      ? matchInDb.friend_user_points
                      : points,
                  winner_id:
                    matchInDb.friend_user_points &&
                    matchInDb.friend_user_points > points
                      ? matchInDb.friend_user_id
                      : user_id,
                },
              });
            }

            if (
              matchInDb.match_status_for_friend_user_id ==
                MatchStatus.COMPLETED &&
              matchInDb.friend_user_points
            ) {
              if (friendUser & (matchInDb.friend_user_points >= points)) {
                await UpdateUserAchievements({
                  user: friendUser,
                  win_challenge_game: true,
                });
              }
              const userSecondary = getUser(matchInDb.friend_user_id);
              if (userSecondary) {
                const socketResponse = {
                  match_id: matchInDb.id,
                  opponent:
                    matchInDb.user_id == user_id
                      ? matchInDb.match_starter
                      : matchInDb.match_invited_to,
                };
                socket
                  .to(userSecondary.socketId)
                  .emit("vs_match_end", getSuccessData(socketResponse));
              }
            }

            const user = userData;
            const level = userData.level;
            const xpLevel = await prisma.xPLevel.findFirst({
              where: {
                level: user.level,
              },
            });

            // Level Up
            let updatedUser = user;
            let newCollectable;
            if (xpLevel && user.xp + xp >= xpLevel.xp_required) {
              updatedUser = await prisma.users.update({
                where: {
                  id: user.id,
                },
                data: {
                  diamonds: {
                    increment: 3,
                  },
                  current_points: user.current_points + points,
                  weekly_points: user.weekly_points + points,
                  monthly_points: user.monthly_points + points,
                  xp: user.xp + xp - xpLevel.xp_required,
                  level: ++user.level,
                },
              });

              const { nextCollectable } =
                await userDistrictsCollectablesAndNextCollectableId(user_id);

              if (nextCollectable) {
                await prisma.userCollectables.create({
                  data: {
                    user_id,
                    collectable_id: nextCollectable.id,
                  },
                });
                newCollectable = nextCollectable.picture_url;
              }
            } else {
              updatedUser = await prisma.users.update({
                where: {
                  id: user.id,
                },
                data: {
                  current_points: user.current_points + points,
                  weekly_points: user.weekly_points + points,
                  monthly_points: user.monthly_points + points,
                  xp: xpLevel ? user.xp + xp : undefined,
                },
              });
            }

            const { usedItemsNames, total_count } = await userUsedItems(
              items,
              user_id
            );

            const { user_from_achievement_update_func } =
              await UpdateUserAchievements({
                user: updatedUser,
                is_challenge_game: true,
                no_of_answers: noOfAnswers,
                level_reach:
                  xpLevel && user.xp + xp >= xpLevel.xp_required
                    ? true
                    : undefined,
                coins_earned: parseInt(points),
                is_all_answers_are_correct,
                win_challenge_game:
                  (matchInDb.match_status_for_user_id ==
                    MatchStatus.COMPLETED &&
                    (!matchInDb.friend_user_points ||
                      (matchInDb.friend_user_points &&
                        points >= matchInDb.friend_user_points))) == true
                    ? true
                    : undefined,
                win_challenge_game_without_item_use:
                  (matchInDb.match_status_for_user_id ==
                    MatchStatus.COMPLETED &&
                    (!matchInDb.friend_user_points ||
                      (matchInDb.friend_user_points &&
                        points >= matchInDb.friend_user_points)) &&
                    total_count <= 0) == true
                    ? true
                    : undefined,
                no_of_items_used: total_count,
                no_of_times_kaos_visions_item_used:
                  usedItemsNames.find((i) => i.name == "Kaos Vision")?.count ??
                  undefined,
                no_of_times_microphone_item_used:
                  usedItemsNames.find((i) => i.name == "Microphone")?.count ??
                  undefined,
                no_of_times_do_over_item_used:
                  usedItemsNames.find((i) => i.name == "Do-Over")?.count ??
                  undefined,
                no_of_times_time_zone_item_used:
                  usedItemsNames.find((i) => i.name == "Time Zone")?.count ??
                  undefined,
                comic_piece: true,
                no_of_collectable_items_found: newCollectable ? 1 : undefined,
              });

            const token = await createToken(user_from_achievement_update_func);

            const responseForSocket =
              matchInDb.match_status_for_friend_user_id ==
                MatchStatus.COMPLETED &&
              (!matchInDb.friend_user_points ||
                (matchInDb.friend_user_points &&
                  matchInDb.friend_user_points >= points))
                ? async () => {
                    if (matchInDb.friend_user_id == user_id) {
                      await prisma.notifications.create({
                        data: {
                          sender: user_id,
                          reciever_id: friend_user_id,
                          notification_type: NotificationType.RESULT,
                          match_id: matchInDb?.id,
                        },
                      });
                      await prisma.notifications.create({
                        data: {
                          sender: friend_user_id,
                          reciever_id: user_id,
                          notification_type: NotificationType.RESULT,
                          match_id: matchInDb?.id,
                        },
                      });
                    } else {
                      await prisma.notifications.create({
                        data: {
                          sender: friend_user_id,
                          reciever_id: user_id,
                          notification_type: NotificationType.RESULT,
                          match_id: matchInDb?.id,
                        },
                      });
                      await prisma.notifications.create({
                        data: {
                          sender: user_id,
                          reciever_id: friend_user_id,
                          notification_type: NotificationType.RESULT,
                          match_id: matchInDb?.id,
                        },
                      });
                    }
                    return {
                      my_points: points,
                      friend_user_points: matchInDb.friend_user_points,
                      avatar_url: matchInDb.match_invited_to.avatar_url,
                      token,
                      message: "You won the match",
                      new_collectable: newCollectable,
                      is_leveled_up:
                        user_from_achievement_update_func.level > level,
                    };
                  }
                : async () => {
                    return {
                      my_points: points,
                      friend_user_points: matchInDb.friend_user_points,
                      avatar_url: matchInDb.match_invited_to.avatar_url,
                      token,
                      new_collectable: newCollectable,
                      is_leveled_up:
                        user_from_achievement_update_func.level > level,
                    };
                  };
            const _responseForSocket = await responseForSocket();
            return callback(getSuccessData(_responseForSocket));
          }
        } catch (catchError) {
          if (catchError && catchError.message) {
            console.log(getError(catchError.message));
            return;
          }
          console.log(getError(catchError));
          return;
        }
      });

      socket.on("logout", () => {
        socket.disconnect(true);
      });

      socket.on("disconnect", async () => {
        const user = removeUser(socket.id);
        if (user) {
          const user_id = user.id;

          const matches = getUserAllMatches(user_id);
          matches.forEach((match) => removeMatch(match));

          const matchesOfUser = await prisma.users.findUnique({
            where: {
              id: user_id,
            },
            select: {
              matches_i_starts: {
                include: {
                  match_starter: true,
                  match_invited_to: true,
                },
              },
              matches_where_i_invited: {
                include: {
                  match_starter: true,
                  match_invited_to: true,
                },
              },
            },
          });

          const matchesInDb = [];
          matchesOfUser.matches_i_starts.forEach((_) => {
            if (!matchesInDb.find((_m) => _m.id == _.id)) matchesInDb.push(_);
          });

          matchesOfUser.matches_where_i_invited.forEach((_) => {
            if (!matchesInDb.find((_m) => _m.id == _.id)) matchesInDb.push(_);
          });

          matchesInDb.forEach(async (matchInDb) => {
            if (matchInDb.match_type == MatchType.SOLO) {
              if (matchInDb.match_status_for_user_id == MatchStatus.ACTIVE) {
                await prisma.matches.delete({
                  where: {
                    id: matchInDb.id,
                  },
                });
              }
            } else {
              const match_id = matchInDb.id;
              const friend_user_id =
                matchInDb.user_id == user_id
                  ? matchInDb.friend_user_id
                  : matchInDb.user_id;

              const friendUser =
                matchInDb.user_id != user_id
                  ? matchInDb.match_starter
                  : matchInDb.match_invited_to;

              if (matchInDb.friend_user_id == user_id) {
                if (
                  matchInDb.match_status_for_user_id == MatchStatus.COMPLETED &&
                  matchInDb.user_points &&
                  matchInDb.match_status_for_friend_user_id ==
                    MatchStatus.ACTIVE
                ) {
                  await prisma.matches.update({
                    where: {
                      id: match_id,
                    },
                    data: {
                      match_status_for_friend_user_id: MatchStatus.COMPLETED,
                      winner_points: matchInDb.user_points
                        ? matchInDb.user_points
                        : matchInDb.winner_points,
                      winner_id: matchInDb.user_points
                        ? matchInDb.user_id
                        : matchInDb.winner_id,
                    },
                  });

                  const userSecondary = getUser(matchInDb.user_id);
                  if (userSecondary) {
                    socket
                      .to(userSecondary.socketId)
                      .emit(
                        "vs_match_left",
                        getSuccessData("You won the match.")
                      );
                  }
                  return;
                }

                if (
                  matchInDb.match_status_for_user_id == MatchStatus.PENDING &&
                  !matchInDb.user_points &&
                  matchInDb.match_status_for_friend_user_id ==
                    MatchStatus.ACTIVE
                ) {
                  await prisma.matches.update({
                    where: {
                      id: match_id,
                    },
                    data: {
                      match_status_for_friend_user_id: MatchStatus.COMPLETED,
                    },
                  });
                  return;
                }

                const noti = await prisma.notifications.findFirst({
                  where: {
                    OR: [
                      {
                        sender: user_id,
                        reciever_id: friend_user_id,
                        notification_type: NotificationType.MATCH_REQUEST,
                      },
                      {
                        sender: friend_user_id,
                        reciever_id: user_id,
                        notification_type: NotificationType.MATCH_REQUEST,
                      },
                    ],
                  },
                });

                const frndReq = await prisma.friendUsers.findFirst({
                  where: {
                    OR: [
                      {
                        user_id: user_id,
                        friend_user_id: friend_user_id,
                        status: FriendRequestStatus.PENDING,
                      },
                      {
                        user_id: friend_user_id,
                        friend_user_id: user_id,
                        status: FriendRequestStatus.PENDING,
                      },
                    ],
                  },
                });

                if (
                  matchInDb.match_status_for_user_id == MatchStatus.COMPLETED &&
                  !matchInDb.user_points &&
                  matchInDb.match_status_for_friend_user_id ==
                    MatchStatus.ACTIVE
                ) {
                  await prisma.matches.delete({
                    where: {
                      id: match_id,
                    },
                  });

                  await prisma.notifications.delete({
                    where: {
                      id: noti?.id,
                    },
                  });

                  await prisma.friendUsers.delete({
                    where: {
                      id: frndReq?.id,
                    },
                  });
                }
              } else {
                if (
                  matchInDb.match_status_for_friend_user_id ==
                    MatchStatus.COMPLETED &&
                  matchInDb.friend_user_points &&
                  matchInDb.match_status_for_user_id == MatchStatus.ACTIVE
                ) {
                  await prisma.matches.update({
                    where: {
                      id: match_id,
                    },
                    data: {
                      match_status_for_user_id: MatchStatus.COMPLETED,
                      winner_points:
                        matchInDb.friend_user_points ?? matchInDb.winner_points,
                      winner_id: matchInDb.friend_user_points
                        ? matchInDb.friend_user_id
                        : matchInDb.winner_id,
                    },
                  });

                  const userSecondary = getUser(matchInDb.friend_user_id);
                  if (userSecondary) {
                    socket
                      .to(userSecondary.socketId)
                      .emit(
                        "vs_match_left",
                        getSuccessData("You won the match.")
                      );
                  }
                  return;
                }

                if (
                  matchInDb.match_status_for_friend_user_id ==
                    MatchStatus.PENDING &&
                  !matchInDb.friend_user_points &&
                  matchInDb.match_status_for_user_id == MatchStatus.ACTIVE
                ) {
                  await prisma.matches.update({
                    where: {
                      id: match_id,
                    },
                    data: {
                      match_status_for_user_id: MatchStatus.COMPLETED,
                    },
                  });

                  return;
                }
                //   await prisma.matches.delete({
                //     where: {
                //       id: match_id,
                //     },
                //   });
                // } else {
                //   await prisma.matches.update({
                //     where: {
                //       id: match_id,
                //     },
                //     data: {
                //       match_status_for_friend_user_id: MatchStatus.COMPLETED,
                //       winner_points: matchInDb.user_points
                //         ? matchInDb.user_points
                //         : matchInDb.winner_points,
                //       winner_id: matchInDb.user_points
                //         ? matchInDb.user_id
                //         : matchInDb.winner_id,
                //     },
                //   });

                //   const isRequestPending = await isRequestSent(
                //     user_id,
                //     friend_user_id
                //   );

                //   if (
                //     isRequestPending &&
                //     isRequestPending.status == RequestStatus.PENDING
                //   ){
                //     await prisma.friends.delete({
                //       where: {
                //         id: isRequestPending.id,
                //       },
                //     });
                //   }
                // }
                // if (
                //   matchInDb.match_status_for_user_id == MatchStatus.COMPLETED &&
                //   matchInDb.user_points &&
                //   matchInDb.match_status_for_friend_user_id !=
                //     MatchStatus.COMPLETED
                // ) {
                //   if (friendUser) {
                //     await UpdateUserAchievements({
                //       user: friendUser,
                //       win_challenge_game: true,
                //     });
                //   }

                //   const userSecondary = getUser(matchInDb.user_id);
                //   if (userSecondary) {
                //     socket
                //       .to(userSecondary.socketId)
                //       .emit(
                //         "vs_match_left",
                //         getSuccessData("You won the match.")
                //       );
                //   }
                // }

                const isnoti = await prisma.notifications.findFirst({
                  where: {
                    OR: [
                      {
                        sender: user_id,
                        reciever_id: friend_user_id,
                        notification_type: NotificationType.MATCH_REQUEST,
                      },
                      {
                        sender: friend_user_id,
                        reciever_id: user_id,
                        notification_type: NotificationType.MATCH_REQUEST,
                      },
                    ],
                  },
                });

                const isfrndReq = await prisma.friendUsers.findFirst({
                  where: {
                    OR: [
                      {
                        user_id: user_id,
                        friend_user_id: friend_user_id,
                        status: FriendRequestStatus.PENDING,
                      },
                      {
                        user_id: friend_user_id,
                        friend_user_id: user_id,
                        status: FriendRequestStatus.PENDING,
                      },
                    ],
                  },
                });

                if (
                  matchInDb.match_status_for_friend_user_id ==
                    MatchStatus.COMPLETED &&
                  !matchInDb.friend_user_points &&
                  matchInDb.match_status_for_user_id == MatchStatus.ACTIVE
                ) {
                  await prisma.matches.delete({
                    where: {
                      id: match_id,
                    },
                  });

                  await prisma.notifications.delete({
                    where: {
                      id: isnoti?.id,
                    },
                  });

                  await prisma.friendUsers.delete({
                    where: {
                      id: isfrndReq?.id,
                    },
                  });
                }
                //   await prisma.matches.update({
                //     where: {
                //       id: match_id,
                //     },
                //     data: {
                //       match_status_for_user_id: MatchStatus.COMPLETED,
                //       winner_points: matchInDb.friend_user_points
                //         ? matchInDb.friend_user_points
                //         : matchInDb.winner_points,
                //       winner_id: matchInDb.friend_user_points
                //         ? matchInDb.friend_user_id
                //         : matchInDb.winner_id,
                //     },
                //   });
                // }
                // if (
                //   matchInDb.match_status_for_friend_user_id ==
                //     MatchStatus.COMPLETED &&
                //   matchInDb.friend_user_points &&
                //   matchInDb.match_status_for_user_id != MatchStatus.COMPLETED
                // ) {
                //   if (friendUser) {
                //     await UpdateUserAchievements({
                //       user: friendUser,
                //       win_challenge_game: true,
                //     });
                //   }
                //   const userSecondary = getUser(matchInDb.friend_user_id);
                //   if (userSecondary) {
                //     socket
                //       .to(userSecondary.socketId)
                //       .emit(
                //         "vs_match_left",
                //         getSuccessData("You won the match.")
                //       );
                //   }
              }
            }
          });
        }
        console.log("socket disconnected", socket.id, user);
      });
    });
  }

  static async sendInvite(user_id, friend_user_id, request_status) {
    if (this.io) {
      const my_id = getUser(user_id);
      if (my_id) {
        const otherUser = getUser(friend_user_id);
        if (otherUser) {
          this.io.to(otherUser.socketId).emit("send_invite", {
            request_status,
            user_id,
            friend_user_id,
          });
          const other = await prisma.notifications.findFirst({
            where: {
              reciever_id: my_id,
              seen: false,
            },
          });
          this.io.to(otherUser.socketId).emit("notifications", {
            notification_count: other.length,
          });
        }
      }
    }
  }

  static async friendRequest(user_id, friend_user_id, request_status, message) {
    if (this.io) {
      const my_id = getUser(user_id);
      if (my_id) {
        const otherUser = getUser(friend_user_id);
        if (otherUser) {
          this.io.to(otherUser.socketId).emit("friend_request", {
            user_id,
            friend_user_id,
            request_status,
            message,
          });
          const other = await prisma.notifications.findFirst({
            where: {
              reciever_id: my_id,
              seen: false,
            },
          });
          this.io.to(otherUser.socketId).emit("notifications", {
            notification_count: other.length,
          });
        }
      }
    }
  }
}

module.exports = Socket;

async function isRequestSent(user_id, friend_user_id) {
  const userRequest = await prisma.users.findFirst({
    where: {
      id: user_id,
    },
    select: {
      friend_requests_sender: {
        where: {
          user_id,
          friend_user_id,
        },
      },
      friend_requests_reciever: {
        where: {
          user_id: friend_user_id,
          friend_user_id: user_id,
        },
      },
    },
  });

  if (userRequest.friend_requests_sender.length > 0)
    return userRequest.friend_requests_sender[0];
  if (userRequest.friend_requests_reciever.length > 0)
    return userRequest.friend_requests_reciever[0];

  return null;
}

async function getMatchInDbForUser(user_id) {
  const userMatches = await prisma.users.findUnique({
    where: {
      id: user_id,
    },
    select: {
      matches_i_starts: true,
      matches_where_i_invited: true,
    },
  });

  const matchesInDb = [];
  userMatches.matches_i_starts.forEach((_) => {
    if (!matchesInDb.find((_m) => _m.id == _.id)) matchesInDb.push(_);
  });
  userMatches.matches_where_i_invited.forEach((_) => {
    if (!matchesInDb.find((_m) => _m.id == _.id)) matchesInDb.push(_);
  });

  if (matchesInDb.length > 0) {
    let activeMatchFound = false;
    matchesInDb.forEach((matchInDb) => {
      if (!activeMatchFound) {
        if (
          (matchInDb.user_id == user_id &&
            matchInDb.match_status_for_user_id == MatchStatus.ACTIVE) ||
          (matchInDb.friend_user_id == user_id &&
            matchInDb.match_status_for_friend_user_id == MatchStatus.ACTIVE)
        )
          activeMatchFound = true;
      }
    });
    return activeMatchFound;
  }

  return false;
}
