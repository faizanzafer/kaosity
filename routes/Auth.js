const router = require("express").Router();
const bcrypt = require("bcryptjs");
const trimRequest = require("trim-request");
const fs = require("fs");

const prisma = require("../_Prisma");
const {
  registerUser,
  checkEmailExist,
  checkPhoneExist,
  checkUserNameExist,
} = require("../database/Auth");
const ImageUpload = require("../middlewares/ImageUploader");
const {
  registerValidation,
  loginValidation,
  emailValidation,
  usernameValidation,
} = require("./validate");
const {
  sendError,
  createToken,
  getSuccessData,
  sendSuccess,
} = require("../helpers");
const { uploadFile } = require("../S3_BUCKET/S3-bucket");

const avatars = require("../avatars").avatars;
const { ShopItemsType } = require(".prisma/client");

router.post("/register", [ImageUpload, trimRequest.body], async (req, res) => {
  try {
    if (req.file_error) {
      deleteFile(req);
      return sendError(res, req.file_error);
    }

    const { error, value } = registerValidation(req.body);
    if (error) {
      deleteFile(req);
      return sendError(res, error.details[0].message);
    }

    const {
      email,
      firstname,
      lastname,
      user_name,
      avatar_id,
      phone,
      dob,
      country,
      password,
    } = value;

    if (!avatar_id && !req.file) {
      return sendError(res, "Please select avatar or upload a picture.");
    }

    const emailExist = await checkEmailExist(email);

    if (emailExist) {
      deleteFile(req);
      return sendError(res, "Email already taken.");
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
    const hashPassword = bcrypt.hashSync(password, 10);

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

    const newUser = await registerUser(
      email,
      firstname,
      // lastname,
      user_name,
      phone,
      dob,
      country,
      hashPassword,
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
  } catch (catchError) {
    deleteFile(req);
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.post("/login", trimRequest.all, async (req, res) => {
  const { error, value } = loginValidation(req.body);
  if (error) return sendError(res, error.details[0].message);

  const { email, password } = value;
  try {
    const emailExist = await checkEmailExist(email);

    if (!emailExist)
      return sendError(res, "User with this email does not exist.");

      if (emailExist && emailExist.is_social_register==true) {
        return sendError(res, "This Email is Register for Social Login Only!")
      }

    const isValidPassword = bcrypt.compareSync(password, emailExist.password);
    if (!isValidPassword) return sendError(res, "Password is wrong.");

    return res.send(getSuccessData(await createToken(emailExist)));
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.post("/check_email", trimRequest.body, async (req, res) => {
  const { error, value } = emailValidation(req.body);
  if (error) return sendError(res, error.details[0].message);

  try {
    const { email: _email } = value;
    const email = _email.toLowerCase();
    const emailExists = await checkEmailExist(email);
    if (emailExists && emailExists.social_auth_provider_user_id != null)
      return sendError(res, {
        message: "Email registered for social login",
        social_auth_provider: emailExists.social_auth_provider,
      });
    else if (emailExists && emailExists.social_auth_provider_user_id == null)
      return sendError(res, {
        message: "Email registered for simple login",
        social_auth_provider: null,
      });

    return sendSuccess(res, "You can use this email");
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

router.post("/check_username", trimRequest.body, async (req, res) => {
  try {
    const { error, value } = usernameValidation(req.body);
    if (error) return sendError(res, error.details[0].message);

    const { user_name } = value;

    const userNameExists = await checkUserNameExist(user_name);

    if (userNameExists && userNameExists.social_auth_provider_user_id != null)
      return sendError(res, {
        message: "user name registered for social login",
        social_auth_provider: userNameExists.social_auth_provider,
      });
    else if (
      userNameExists &&
      userNameExists.social_auth_provider_user_id == null
    )
      return sendError(res, {
        message: "user name registered for simple login",
        social_auth_provider: null,
      });

    return sendSuccess(res, "You can use this user name");
  } catch (catchError) {
    if (catchError && catchError.message) {
      return sendError(res, catchError.message);
    }
    return sendError(res, catchError);
  }
});

module.exports = router;

function deleteFile(req) {
  if (req.file) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
}
