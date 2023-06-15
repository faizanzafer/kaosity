const router = require("express").Router();
const _ = require("lodash");
const prisma = require("../_Prisma");
const { sendSuccess, sendError } = require("../helpers");
const { MatchStatus, MatchType } = require("@prisma/client");
const { matchValidation } = require("./validate");

//
//
//

router.get("/get_played_matches", async (req, res) => {
  try {
    const my_id = req.user._id;
    const { vs_matches_stats } = await getUserHistory(my_id);
    const { winned_matches, lossed_matches } = vs_matches_stats;
    return sendSuccess(res, { winned_matches, lossed_matches });
  } catch (catchError) {
    console.log(catchError);
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.post("/match_stats", async (req, res) => {
  try {
    const { value, error } = matchValidation(req.body);
    if (error) return sendError(res, error.details[0].message);

    const { match_id } = value;

    const { _id: my_id } = req.user;

    const match = await prisma.matches.findFirst({
      where: {
        id: match_id,
      },
      select: {
        match_starter: {
          select: {
            id: true,
            user_name: true,
            avatar_url: true,
          },
        },
        match_invited_to: {
          select: {
            id: true,
            user_name: true,
            avatar_url: true,
          },
        },
        user_points: true,
        friend_user_points: true,
      },
    });

    if (!match) return sendError(res, "Match do not exist");

    if (match.match_starter.id != my_id)
      if (match.match_invited_to.id != my_id)
        return sendError(res, "You are not the part of this match");

    const { winned_matches, lossed_matches } = await getUserHistory(my_id);

    const match_stats = {
      you:
        match.match_starter.id == my_id
          ? match.match_starter
          : match.match_invited_to,
      my_points:
        match.match_starter.id == my_id
          ? match.user_points
          : match.friend_user_points,
      my_history: { winned_matches, lossed_matches },
      friend:
        match.match_starter.id == my_id
          ? match.match_invited_to
          : match.match_starter,
      friend_points:
        match.match_starter.id == my_id
          ? match.friend_user_points
          : match.user_points,
    };

    return sendSuccess(res, match_stats);
  } catch (catchError) {
    console.log(catchError);
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.get("/get_solo_leader_board", async (req, res) => {
  const matches = await prisma.$queryRaw`SELECT DISTINCT
    m.user_id,
    u.user_name,
    u.email,
    u.avatar_url,
    sum(m.winner_points) as user_points
    FROM public."Matches" m
    JOIN public."Users" u
    ON m.user_id= u.id
    group by m.user_id, u.user_name,u.email,u.avatar_url,m.match_type
    having m.match_type='SOLO'
    Order by user_points desc
    limit 100`;

  return sendSuccess(res, matches);
});

router.get("/leaderboard", async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      where: {
        is_registered: true,
      },
      select: {
        id: true,
        user_name: true,
        avatar_url: true,
        weekly_points: true,
        monthly_points: true,
      },
      orderBy: [
        {
          weekly_points: "desc",
        },
        {
          monthly_points: "desc",
        },
      ],
      take: 100,
    });

    const weeklyUsers = [...users];
    const monthlyUsers = [...users];

    const weekly_board = weeklyUsers.map((user) => {
      const customData = { ...user };
      delete customData.monthly_points;
      return customData;
    });

    const monthly_board = monthlyUsers.map((user) => {
      const customData = { ...user };
      delete customData.weekly_points;
      return customData;
    });

    return sendSuccess(res, { weekly_board, monthly_board });
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.get("/get_my_stats", async (req, res) => {
  try {
    console.log("here");
    const my_id = req.user._id;
    const { vs_matches_stats, solo_matches_stat } = await getUserHistory(
      my_id,
      true
    );

    return sendSuccess(res, { vs_matches_stats, solo_matches_stat });
  } catch (catchError) {
    console.log(catchError);
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

// router.get("/get_vs_leader_board", async (req, res) => {
//   const matches = await prisma.$queryRaw(`SELECT DISTINCT
//     m.user_id,
//     u.user_name,
//     u.email,
//     u.avatar_url,
//     sum(m.winner_points) as winner_points
//     FROM public."Matches" m
//     JOIN public."Users" u
//     ON m.user_id= u.id
//     group by m.user_id, u.user_name,u.email,u.avatar_url
//     Order by winner_points desc
//     limit 100`);

//   return sendSuccess(res, matches);
// });

module.exports = router;

async function getUserHistory(my_id, get_solo_stats = false) {
  const user = await prisma.users.findFirst({
    where: {
      id: my_id,
    },
    select: {
      level: true,
      matches_i_starts: {
        where: get_solo_stats
          ? {
              user_id: my_id,
              // match_type: MatchType.VSFRIEND,
              match_status_for_user_id: MatchStatus.COMPLETED,
              match_status_for_friend_user_id: MatchStatus.COMPLETED,
            }
          : {
              user_id: my_id,
              match_type: MatchType.VSFRIEND,
              match_status_for_user_id: MatchStatus.COMPLETED,
              match_status_for_friend_user_id: MatchStatus.COMPLETED,
            },
      },
      matches_where_i_invited: {
        where: get_solo_stats
          ? {
              friend_user_id: my_id,
              // match_type: MatchType.VSFRIEND,
              match_status_for_user_id: MatchStatus.COMPLETED,
              match_status_for_friend_user_id: MatchStatus.COMPLETED,
            }
          : {
              friend_user_id: my_id,
              match_type: MatchType.VSFRIEND,
              match_status_for_user_id: MatchStatus.COMPLETED,
              match_status_for_friend_user_id: MatchStatus.COMPLETED,
            },
      },
    },
  });

  // Vs Matches Calculation
  const invitedWinnedMatches = user.matches_where_i_invited.filter(
    (match) =>
      match.winner_id == my_id && match.match_type == MatchType.VSFRIEND
  );
  const startedWinnedMatches = user.matches_i_starts.filter(
    (match) =>
      match.winner_id == my_id && match.match_type == MatchType.VSFRIEND
  );

  const invitedLossedMatches = user.matches_where_i_invited.filter(
    (match) =>
      match.winner_id != my_id && match.match_type == MatchType.VSFRIEND
  );
  const startedLossedMatches = user.matches_i_starts.filter(
    (match) =>
      match.winner_id != my_id && match.match_type == MatchType.VSFRIEND
  );

  const winned_matches =
    invitedWinnedMatches.length + startedWinnedMatches.length;
  const lossed_matches =
    invitedLossedMatches.length + startedLossedMatches.length;

  const vs_matches_stats = { winned_matches, lossed_matches };
  //----------------------------------------------------------//

  // Solo Matches Calculation

  const solo_matches_stat = user.matches_i_starts.filter(
    (match) => match.winner_id == my_id && match.match_type == MatchType.SOLO
  ).length;

  return { vs_matches_stats, solo_matches_stat };
}
