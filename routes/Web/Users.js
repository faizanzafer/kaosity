const router = require("express").Router();
const { UserRole } = require(".prisma/client");
const prisma = require("../../_Prisma");

router.get("/", async (req, res) => {
  res.locals.page = "/users";

  const users = await prisma.users.findMany({
    where: {
      role: UserRole.USER,
      is_registered: true,
    },
  });
  return res.render("users", { users });
});

module.exports = router;
