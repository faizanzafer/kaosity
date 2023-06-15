const router = require("express").Router();

const prisma = require("../../_Prisma");

router.get("/", async (req, res) => {
  res.locals.page = "/";
  // const quiz_categories = await prisma.quizCategories.findMany();
  return res.render("dashboard");
});

module.exports = router;
