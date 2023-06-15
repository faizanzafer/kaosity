const router = require("express").Router();
const trimRequest = require("trim-request");
const fs = require("fs");

const prisma = require("../_Prisma");

const {
  sendError,
  sendSuccess,
  getSuccessData,
  createToken,
  myInventory,
  UpdateUserAchievements,
  getError,
  userDistrictsCollectablesAndNextCollectableId,
} = require("../helpers");

//
//
//

router.get("/districts", async (req, res) => {
  try {
    const { _id: user_id } = req.user;

    const { districts } = await userDistrictsCollectablesAndNextCollectableId(
      user_id
    );

    return sendSuccess(res, districts);
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

module.exports = router;
