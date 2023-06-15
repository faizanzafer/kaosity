const router = require("express").Router();
const bcrypt = require("bcryptjs");
const prisma = require("../../_Prisma");

const trimRequest = require("trim-request");
const { loginValidation } = require("../validate");
const { UserRole } = require(".prisma/client");

router.get("/", async (req, res) => {
  return res.render("login", { title: "Login", foo: "login" });
});

router.post("/", trimRequest.all, async (req, res) => {
  const { error, value } = loginValidation(req.body);
  if (error)
    return res.render("login", {
      error: error.details[0].message,
      data: req.body,
    });

  const { email, password } = req.body;

  const emailExist = await prisma.users.findFirst({
    where: { email, role: UserRole.ADMIN },
  });

  if (!emailExist)
    return res.render("login", {
      error: "Email is invalid.",
      data: req.body,
    });

  const isValidPassword = bcrypt.compareSync(password, emailExist.password);
  if (!isValidPassword)
    return res.render("login", {
      error: "Password is wrong",
      data: req.body,
    });
  const user = {
    _id: emailExist.id,
    email: emailExist.email,
  };

  req.session.user = user;
  req.session.cookie.expires = false;

  return res.redirect("/");
});

module.exports = router;
