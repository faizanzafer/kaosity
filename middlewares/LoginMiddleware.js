const prisma = require("../_Prisma");
const { UserRole } = require(".prisma/client");

module.exports = async function (req, res, next) {
  const sessionUser = req.session.user;
  try {
    if (sessionUser) {
      const { email } = sessionUser;
      const user = await prisma.users.findFirst({
        where: {
          email,
          role: UserRole.ADMIN,
        },
      });
      if (user) return res.redirect("/");
    }
    next();
  } catch (err) {
    next(err);
  }
};
