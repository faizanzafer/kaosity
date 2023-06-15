const cronjob = require("node-cron");
const prisma = require("../_Prisma");

const StartCronJobs = async () => {
  // hourly cron job
  cronjob.schedule("*/5 * * * *", async () => {
    // cronjob.schedule("* * * * * *", async () => {
    console.log("areeb");
    const check_match_and_notification = await prisma.matches.findMany({
      where: {
        match_status_for_friend_user_id: "PENDING",
      },
      include: {
        notifications: {
          select: {
            id: true,
          },
        },
      },
    });

    for (let i = 0; i < check_match_and_notification.length; i++) {
      var dateObj = new Date(check_match_and_notification[i].updated_at);
      // console.log(dateObj);
      let updatetime = dateObj.setHours(dateObj.getHours() + 1);
      // console.log("updatetime: ", new Date(updatetime));
      const date = new Date();
      var datenow = new Date(date);
      if (updatetime <= datenow) {
        await prisma.matches.update({
          where: {
            id: check_match_and_notification[i].id,
          },
          data: {
            match_status_for_friend_user_id: "COMPLETED",
          },
        });
        if (check_match_and_notification[i]?.notifications[0]?.id) {
          await prisma.notifications.delete({
            where: {
              id: check_match_and_notification[i].notifications[0].id,
            },
          });
        }
        const friendUsers = await prisma.friendUsers.findFirst({
          where: {
            user_id: check_match_and_notification[i].user_id,
            friend_user_id: check_match_and_notification[i].friend_user_id,
          },
        });

        await prisma.friendUsers.delete({
          where: {
            id: friendUsers.id,
          },
        });

        await Socket.sendInvite(
          check_match_and_notification[i].user_id,
          check_match_and_notification[i].friend_user_id,
          false
        );
      }
    }
  });

  // Weekly cron job
  cronjob.schedule("0 0 * * 0", async () => {
    await prisma.users.updateMany({
      where: {
        is_registered: true,
      },
      data: {
        weekly_points: 0,
      },
    });
  });

  // Monthly cron job
  cronjob.schedule("0 0 1 * *", async () => {
    await prisma.users.updateMany({
      where: {
        is_registered: true,
      },
      data: {
        weekly_points: 0,
        monthly_points: 0,
      },
    });
  });
};

module.exports = { StartCronJobs };
