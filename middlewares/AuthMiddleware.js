const jwt = require("jsonwebtoken");
const { getEnv } = require("../config");
const { getError } = require("../helpers");
const { getUserfromIdMiddlewareFunc } = require("../database/Auth");

module.exports = async function (req, res, next) {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(403).send(getError("Access Denied!"));
  }
  try {
    const verified = jwt.verify(token, getEnv("JWT_SECERET"));
    const { _id: id } = verified;
    const user = await getUserfromIdMiddlewareFunc(id);

    if (!user)
      return res
        .status(403)
        .send(getError("Unauthorized! Please login again to refresh token."));
    // console.log(user);
    user._id = user.id;
    req.user = user;
    next();
  } catch (err) {
    return res.status(404).send(getError("Invalid token!."));
  }
};
