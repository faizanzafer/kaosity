const router = require("express").Router();
const trimRequest = require("trim-request");

const prisma = require("../_Prisma");
const {
  getRegisteredSocialLogin,
  registerSocialLogin,
  isSocialEmailExist,
  isSocialLoginRegistered,
} = require("../database/SocialAuth");
const ImageUpload = require("../middlewares/ImageUploader");
const { socialAuthValidation } = require("./validate");
const { getSuccessData, sendError, createToken } = require("../helpers");
const { checkPhoneExist, checkUserNameExist } = require("../database/Auth");

const avatars = require("../avatars").avatars;
const { uploadFile } = require("../S3_BUCKET/S3-bucket");
const fs = require("fs");
const { ShopItemsType } = require("@prisma/client");

//
const allowed_socials = ["google", "twitter", "facebook"];

router.post("/social_signup/:service",[ImageUpload, trimRequest.body],async (req, res) => {
    try {
      const service = req.params["service"];
      const service_allowed = allowed_socials.find(
        (allowed_social) => allowed_social == service
      );
      if (!service_allowed) {
        deleteFile(req);
        return sendError(
          res,
          `only ${allowed_socials.map((item) =>
            item.toString()
          )} socials are allowed.`
        );
      }

      if (req.file_error) {
        deleteFile(req);
        return sendError(res, req.file_error);
      }

      const { error, value } = socialAuthValidation(req.body);
      if (error) {
        deleteFile(req);
        return sendError(res, error.details[0].message);
      }

      const {
        social_auth_id,
        is_social_register,
        email,
        firstname,
        lastname,
        user_name,
        avatar_id,
        phone,
        dob,
        country,
      } = value;

      if (!avatar_id && !req.file) {
        return sendError(res, "Please select avatar or upload a picture.");
      }

      const socialExist = await isSocialLoginRegistered(social_auth_id);

      if (socialExist) {
        deleteFile(req);
        return sendError(res, "Already registered this social login.");
      }

      const emailExists = await isSocialEmailExist(email);

      if (emailExists) {
        deleteFile(req);
        return sendError(res, "Already registered this email.");
      }

      const userNameExists = await checkUserNameExist(user_name);

      if (userNameExists) {
        deleteFile(req);
        return sendError(res, "User name already taken.");
      }

      const phoneExist = await checkPhoneExist(phone);

      if (phoneExist) {
        deleteFile(req);
        return sendError(res, "Phone already taken.");
      }

      let avatarUrl;
      if (avatar_id) {
        deleteFile(req);
        const avatar = avatars.find((_) => {
          return _.id == avatar_id;
        });
        if (!avatar) return sendError(res, "avatar_id is not valid");
        avatarUrl = avatar.url;
      } else {
        const { Location } = await uploadFile(req.file);
        avatarUrl = Location;
        deleteFile(req);
      }

      const newUser = await registerSocialLogin(
        email,
        firstname,
        // lastname,
        user_name,
        phone,
        dob,
        country,
        service,
        social_auth_id,
        avatarUrl
      ).then(async (user) => {
        const shopItems = await prisma.shopItems.findMany({
          where: {
            type: ShopItemsType.POWERUPS,
          },
        });
        const userItems = [];

        shopItems.forEach((item) => {
          userItems.push({
            user_id: user.id,
            shop_item_id: item.id,
            quantity: 5,
          });
        });

        if (userItems.length > 0) {
          await prisma.userItems.createMany({
            data: userItems,
          });
        }

        return user;
      });

      return res.send(getSuccessData(await createToken(newUser)));
    } catch (err) {
      deleteFile(req);

      console.log(err);
      if (err && err.message) {
        return sendError(res, err.message);
      }
      return sendError(res, err);
    }
  }
);

router.post("/social_login/:service", trimRequest.all, async (req, res) => {
  const { social_auth_id } = req.body;

  if (!social_auth_id) return sendError(res, "social_auth_id is required.");
  try {
    const service = req.params["service"];
    const service_allowed = allowed_socials.find(
      (allowed_social) => allowed_social == service
    );
    if (!service_allowed)
      return sendError(
        res,
        `only ${allowed_socials.map((item) =>
          item.toString()
        )} socials are allowed.`
      );

    const user = await getRegisteredSocialLogin(social_auth_id, service);
    if (!user) return sendError(res, "Not registered social login");

    return res.send(getSuccessData(await createToken(user)));
  } catch (err) {
    if (err && err.message) {
      return sendError(res, err.message);
    }
    return sendError(res, err);
  }
});

module.exports = router;

function deleteFile(req) {
  if (req.file) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
}
