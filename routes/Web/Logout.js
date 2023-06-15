const router = require("express").Router();

router.get("/", async (req, res) => {
  req.session.destroy();
  return res.redirect("/login");
});

module.exports = router;
