const { UserRole } = require(".prisma/client");
const prisma = require("../_Prisma");

function getRegisteredSocialLogin(social_auth_id, service) {
  return prisma.users.findFirst({
    where: {
      social_auth_provider_user_id: social_auth_id,
      social_auth_provider: service,
      is_registered: true,
    },
  });
}

function registerSocialLogin(
  email,
  firstname,
  // lastname,
  user_name,
  phone,
  dob,
  country,
  service,
  social_auth_id,
  avatar_url
) {
  // const user_name = firstname;
  return prisma.users.create({
    data: {
      email,
      user_name,
      firstname,
      // lastname,
      phone,
      avatar_url,
      dob,
      country,
      social_auth_provider: service,
      social_auth_provider_user_id: social_auth_id,
      is_registered: true,
      is_social_register:true,
    },
  });
}

function isSocialEmailExist(email) {
  return prisma.users.findFirst({
    where: {
      email,
      role: UserRole.USER,
      is_registered: true,
    },
  });
}

function isSocialLoginRegistered(social_auth_id) {
  return prisma.users.findFirst({
    where: {
      social_auth_provider_user_id: social_auth_id,
      NOT: { social_auth_provider: "no" },
    },
  });
}

module.exports = {
  getRegisteredSocialLogin,
  registerSocialLogin,
  isSocialEmailExist,
  isSocialLoginRegistered,
};
