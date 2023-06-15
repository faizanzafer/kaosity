const { UserRole } = require(".prisma/client");
const prisma = require("../_Prisma");
const { v4 } = require("uuid");

function registerUser(
  email,
  firstname,
  // lastname,
  user_name,
  phone,
  dob,
  country,
  hashPassword,
  avatar_url
) {
  // const user_name = firstname;
  return prisma.users.create({
    data: {
      email,
      firstname,
      // lastname,
      phone,
      dob,
      country,
      user_name,
      password: hashPassword,
      is_registered: true,
      avatar_url,
    },
  });
}

function checkEmailExist(email) {
  return prisma.users.findFirst({
    where: {
      email,
      role: UserRole.USER,
      is_registered: true,
    },
  });
}

function checkUserNameExist(user_name) {
  return prisma.users.findFirst({
    where: {
      user_name,
      role: UserRole.USER,
      is_registered: true,
    },
  });
}

function checkPhoneExist(phone) {
  return prisma.users.findFirst({
    where: {
      phone,
      role: UserRole.USER,
      is_registered: true,
    },
  });
}

function getUserfromId(id) {
  return prisma.users.findFirst({
    where: {
      id,
      is_registered: true,
    },
  });
}

function getUserfromIdMiddlewareFunc(id) {
  return prisma.users.findFirst({
    where: {
      id,
      is_registered: true,
    },
  });
}

module.exports = {
  registerUser,
  checkEmailExist,
  checkUserNameExist,
  checkPhoneExist,
  getUserfromId,
  getUserfromIdMiddlewareFunc,
};
