const router = require("express").Router();
const bcrypt = require("bcryptjs");
const rn = require("random-number");
const trimRequest = require("trim-request");

const {
  deleteOtpEntry,
  updateUserPassword,
  isOtpVerified,
  UpdateExistingOtpEntryVerified,
  createNewOtpEntry,
  updateExistingOtpEntry,
  isOtpAlreadySent,
  isEmailExist,
} = require("../database/ResetPassword");
const {
  ForgotPasswordValidation,
  OtpVerifyForgotPasswordValidation,
  ResetForgotPasswordValidation,
} = require("./validate");
const { sendError, sendSuccess, timeExpired } = require("../helpers");
const Mailer = require("../Mailer");

//

router.post("/forgot_password", trimRequest.all, async (req, res) => {
  const { error, value } = ForgotPasswordValidation(req.body);
  if (error) return sendError(res, error.details[0].message);

  const { email } = value;

  try {
    const random = rn.generator({
      min: 1111,
      max: 9999,
      integer: true,
    })();

    const emailExists = await isEmailExist(email);
    if (!emailExists) return sendError(res, "Email is not registered.");

    const existingOtp = await isOtpAlreadySent(email);

    Mailer.sendMail(
      // email,
      email,
      "Otp Verification",
      `Dear User, Otp is ${random}, which is valid only for 5 minutes.`
    );

    if (existingOtp) {
      await updateExistingOtpEntry(existingOtp, random);
    } else {
      await createNewOtpEntry(email, random);
    }
    return sendSuccess(
      res,
      "Otp sent to your email, which is valid only for 5 minutes"
    );
  } catch (err) {
    if (err && err.message) {
      return sendError(res, err.message);
    }
    return sendError(res, err);
  }
});

router.post("/verify_reset_password_otp", trimRequest.all, async (req, res) => {
  const { error, value } = OtpVerifyForgotPasswordValidation(req.body);
  if (error) return sendError(res, error.details[0].message);

  const { email, otp } = value;

  let user_identifier = null;
  let user_identifier_name = "";
  try {
    user_identifier_name = "email";
    user_identifier = email;

    const EmailExists = await isEmailExist(user_identifier);

    if (!EmailExists) return sendError(res, "Email is not registered.");

    const existingOtp = await isOtpAlreadySent(user_identifier);

    if (!existingOtp || existingOtp.is_verified == true)
      return sendError(
        res,
        `sorry no otp issued to this ${user_identifier_name}.`
      );

    if (timeExpired({ time: existingOtp.updated_at, p_minutes: 5 })) {
      await deleteOtpEntry(existingOtp);
      return sendError(res, "Otp expired.");
    }

    if (existingOtp.otp != otp) return sendError(res, "Otp does not match.");

    await UpdateExistingOtpEntryVerified(existingOtp);

    return sendSuccess(res, `${user_identifier_name} successfully verified`);
  } catch (err) {
    if (err && err.message) {
      return sendError(res, err.message);
    }
    return sendError(res, err);
  }
});

router.post("/reset_password", trimRequest.all, async (req, res) => {
  const { error, value } = ResetForgotPasswordValidation(req.body);
  if (error) return sendError(res, error.details[0].message);

  const { email, password } = value;

  let user_identifier = null;
  let user_identifier_name = "";
  try {
    user_identifier_name = "email";
    user_identifier = email;

    const EmailExists = await isEmailExist(user_identifier);
    if (!EmailExists) return sendError(res, "Email is not registered.");

    const existingOtp = await isOtpVerified(user_identifier);

    if (!existingOtp)
      return sendError(
        res,
        `Please verify your ${user_identifier_name} then reset your password`
      );

    const hashPassword = bcrypt.hashSync(password, 10);

    const userEmail_ = await isEmailExist(user_identifier);

    if (!userEmail_) return sendError(res, "User do not exist");
    await updateUserPassword(userEmail_, hashPassword);

    await deleteOtpEntry(existingOtp);

    return sendSuccess(res, "Password Reset Successfully");
  } catch (err) {
    if (err && err.message) {
      return sendError(res, err.message);
    }
    return sendError(res, err);
  }
});

module.exports = router;
