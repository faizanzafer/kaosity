const prisma = require("../_Prisma");
const { UserRole } = require(".prisma/client");

module.exports = async function (req, res, next) {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    return res.redirect("/login");
  }
  try {
    const { email } = sessionUser;
    const user = await prisma.users.findFirst({
      where: {
        email,
        role: UserRole.ADMIN,
      },
    });
    if (!user) return res.redirect("/login");
    next();
  } catch (err) {
    return res.redirect("/login");
  }
};
