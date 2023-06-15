const { MatchDeficulty } = require("@prisma/client");
const Joi = require("joi");

function registerValidation(data) {
  const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    firstname: Joi.string().max(40).required().messages({
      "any.required": "fullname is required.",
      "string.empty": "fullname is not allowed to be empty.",
    }),
    // lastname: Joi.string().max(15).required(),
    user_name: Joi.string().max(30).required(),
    avatar_id: Joi.string(),
    phone: Joi.string().required(),
    dob: Joi.string().required(),
    country: Joi.string().required(),
    password: Joi.string().required(),
  });

  return registerSchema.validate(data);
}

function loginValidation(data) {
  const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    rememberme: Joi.string(),
  });
  return loginSchema.validate(data);
}

function emailValidation(data) {
  const emailSchema = Joi.object({
    email: Joi.string().email().required(),
  });
  return emailSchema.validate(data);
}

function usernameValidation(data) {
  const userNameSchema = Joi.object({
    user_name: Joi.string().alphanum().required().messages({
      "any.required": "username is required.",
      "string.empty": "username is not allowed to be empty.",
      "string.alphanum": "username only contain alpha numeric characters.",
    }),
  });
  return userNameSchema.validate(data);
}

function phoneAndOtpValidation(data) {
  const phoneAndOtpSchema = Joi.object({
    phone: Joi.string().required(),
    otp: Joi.number().integer().greater(1111).less(9999).required(),
  });
  return phoneAndOtpSchema.validate(data);
}

function phoneValidation(data) {
  const phoneSchema = Joi.object({
    phone: Joi.string().required(),
  });
  return phoneSchema.validate(data);
}

function emailPhoneAndOtpValidation(data) {
  const phoneEmailAndOtpSchema = Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    otp: Joi.number().integer().greater(1111).less(9999).required(),
  });
  return phoneEmailAndOtpSchema.validate(data);
}

function socialAuthValidation(data) {
  const SocialAuthSchema = Joi.object({
    social_auth_id: Joi.string().required(),
    email: Joi.string().email().required(),
    firstname: Joi.string().max(30).required().messages({
      "any.required": "fullname is required.",
      "string.empty": "fullname is not allowed to be empty.",
    }),
    // lastname: Joi.string().max(15).required(),
    user_name: Joi.string().max(30).required(),
    avatar_id: Joi.string(),
    phone: Joi.string().required(),
    dob: Joi.string().required(),
    country: Joi.string().required(),
  });
  return SocialAuthSchema.validate(data);
}

function updateProfileValidation(data) {
  const updateProfileSchema = Joi.object({
    user_name: Joi.string(),
    avatar_id: Joi.string(),
    dob: Joi.string(),
    title_id: Joi.string(),
  });
  return updateProfileSchema.validate(data);
}

function ForgotPasswordValidation(data) {
  const ResetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
  });
  return ResetPasswordSchema.validate(data);
}

function OtpVerifyForgotPasswordValidation(data) {
  const OtpVerifyForgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.number().integer().greater(1111).less(9999).required(),
  });
  return OtpVerifyForgotPasswordSchema.validate(data);
}

function ResetForgotPasswordValidation(data) {
  const ResetForgotPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });
  return ResetForgotPasswordSchema.validate(data);
}

function messageValidation(data) {
  const messageSchema = Joi.object({
    to_id: Joi.string().required(),
    message_type: Joi.string().valid("text", "media").required(),
    attachment: Joi.when("message_type", {
      is: "media",
      then: Joi.string().required(),
    }),
    media_type: Joi.when("message_type", {
      is: "media",
      then: Joi.string().required(),
      otherwise: Joi.string(),
    }),
    message_body: Joi.when("message_type", {
      is: "text",
      then: Joi.string().required(),
      otherwise: Joi.string(),
    }),
  });
  return messageSchema.validate(data);
}

function messageAttachmentValidation(data) {
  const messageSchema = Joi.object({
    attachment: Joi.string().required(),
    media_type: Joi.string().required(),
  });
  return messageSchema.validate(data);
}

function soloMatchDetailsValidation(data) {
  const soloMatchDetailsSchema = Joi.object({
    deficulty_level: Joi.string()
      .valid(MatchDeficulty.EASY, MatchDeficulty.MEDIUM, MatchDeficulty.HARD)
      .required(),
    // quiz_category_id: Joi.string().required(),
  });
  return soloMatchDetailsSchema.validate(data);
}

function soloMatchEndDetailsValidation(data) {
  const soloMatchEndDetailsSchema = Joi.object({
    token: Joi.string().required(),
    match_id: Joi.string().required(),
    points: Joi.number().integer().required(),
    items: Joi.array()
      .items(
        Joi.object({
          item_id: Joi.string().required(),
          count: Joi.number().integer().greater(0).required(),
        })
      )
      .required(),
    is_all_answers_are_correct: Joi.boolean().required(),
  });
  return soloMatchEndDetailsSchema.validate(data);
}

function vsMatchDetailsValidation(data) {
  const vsMatchDetailsSchema = Joi.object({
    friend_user_id: Joi.string().required(),
    deficulty_level: Joi.string()
      .valid(MatchDeficulty.EASY, MatchDeficulty.MEDIUM, MatchDeficulty.HARD)
      .required(),
    // quiz_category_id: Joi.string().required(),
  });
  return vsMatchDetailsSchema.validate(data);
}

function vsMatchResponceDetailsValidation(data) {
  const vsMatchResponceDetailsSchema = Joi.object({
    friend_user_id: Joi.string().required(),
    match_id: Joi.string().required(),
    // deficulty_level: Joi.string()
    //   .valid(MatchDeficulty.EASY, MatchDeficulty.MEDIUM, MatchDeficulty.HARD)
    //   .required(),
    // quiz_category_id: Joi.string().required(),
    response_type: Joi.string().valid("approve", "decline").required(),
    // quiz_category_name: Joi.string(),
    // quiz_category_image: Joi.string(),
  });
  return vsMatchResponceDetailsSchema.validate(data);
}

function vsMatchEndDetailsValidation(data) {
  const vsMatchEndDetailsSchema = Joi.object({
    token: Joi.string().required(),
    friend_user_id: Joi.string().required(),
    match_id: Joi.string().required(),
    points: Joi.number().integer().required(),
    items: Joi.array()
      .items(
        Joi.object({
          item_id: Joi.string().required(),
          count: Joi.number().integer().greater(0).required(),
        })
      )
      .required(),
    is_all_answers_are_correct: Joi.boolean().required(),
  });
  return vsMatchEndDetailsSchema.validate(data);
}

function matchLeftValidation(data) {
  const matchLeftSchema = Joi.object({
    token: Joi.string().required(),
    match_id: Joi.string().required(),
    items: Joi.array()
      .items(
        Joi.object({
          item_id: Joi.string().required(),
          count: Joi.number().integer().greater(0).required(),
        })
      )
      .required(),
  });
  return matchLeftSchema.validate(data);
}

function friendUserIdValidation(data) {
  const friendUserIdSchema = Joi.object({
    friend_user_id: Joi.string().required(),
  });
  return friendUserIdSchema.validate(data);
}

function descriptionFlagValidation(data) {
  const descriptionFlagSchema = Joi.object({
    description_flag: Joi.boolean().required(),
  });
  return descriptionFlagSchema.validate(data);
}

function claimRewardValidation(data) {
  const claimRewardSchema = Joi.object({
    achievement_condition_id: Joi.string().required(),
  });
  return claimRewardSchema.validate(data);
}

function matchValidation(data) {
  const matchSchema = Joi.object({
    match_id: Joi.string().required(),
  });
  return matchSchema.validate(data);
}

function purchaseValidation(data) {
  const today = new Date();
  const purchaseSchema = Joi.object({
    card_number: Joi.string(),
    exp_month: Joi.when("card_number", {
      is: Joi.exist(),
      then:
        data?.exp_year == today.getYear()
          ? Joi.number().integer().min(today.getMonth()).max(12).required()
          : Joi.number().integer().required(),
      otherwise: Joi.any(),
    }),
    exp_year: Joi.when("card_number", {
      is: Joi.exist(),
      then: Joi.number().integer().min(today.getYear()).required(),
      otherwise: Joi.any(),
    }),
    cvc_number: Joi.when("card_number", {
      is: Joi.exist(),
      then: Joi.string().required(),
      otherwise: Joi.any(),
    }),
    item_id: Joi.string().required(),
  });
  return purchaseSchema.validate(data);
}

function usedItemsValidation(data) {
  const usedItemsSchema = Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          item_id: Joi.string().required(),
          count: Joi.number().integer().greater(0).required(),
        })
      )
      .min(1)
      .required(),
  });
  return usedItemsSchema.validate(data);
}

function claimBonusValidation(data) {
  const claimBonusSchema = Joi.object({
    bonus_id: Joi.string().required(),
  });
  return claimBonusSchema.validate(data);
}

function fcmTokenValidation(data) {
  const registerSchema = Joi.object({
    fcm_token: Joi.string().required(),
  });
  return registerSchema.validate(data);
}

function sendInviteValidation(data) {
  const registerSchema = Joi.object({
    friend_user_id: Joi.string().required(),
  });
  return registerSchema.validate(data);
}

function acceptInviteValidation(data) {
  const registerSchema = Joi.object({
    user_id: Joi.string().required(),
  });
  return registerSchema.validate(data);
}

function rejectInviteValidation(data) {
  const registerSchema = Joi.object({
    user_id: Joi.string().required(),
  });
  return registerSchema.validate(data);
}

module.exports = {
  registerValidation,
  loginValidation,
  emailValidation,
  usernameValidation,
  phoneAndOtpValidation,
  phoneValidation,
  emailPhoneAndOtpValidation,
  socialAuthValidation,
  updateProfileValidation,
  ForgotPasswordValidation,
  OtpVerifyForgotPasswordValidation,
  ResetForgotPasswordValidation,
  messageValidation,
  messageAttachmentValidation,
  soloMatchDetailsValidation,
  soloMatchEndDetailsValidation,
  vsMatchDetailsValidation,
  vsMatchResponceDetailsValidation,
  vsMatchEndDetailsValidation,
  matchLeftValidation,
  friendUserIdValidation,
  descriptionFlagValidation,
  claimRewardValidation,
  matchValidation,
  purchaseValidation,
  usedItemsValidation,
  claimBonusValidation,
  fcmTokenValidation,
  sendInviteValidation,
  rejectInviteValidation,
  acceptInviteValidation,
};
