const prisma = require("../_Prisma");

function deleteOtpEntry(existingOtp) {
  return prisma.resetPassword.delete({
    where: {
      id: existingOtp.id,
    },
  });
}

function updateUserPassword(userEmail_, hashPassword) {
  return prisma.users.update({
    where: {
      id: userEmail_.id,
    },
    data: { password: hashPassword },
  });
}

function isOtpVerified(user_identifier) {
  return prisma.resetPassword.findFirst({
    where: {
      user_identifier,
      is_verified: true,
    },
  });
}

function UpdateExistingOtpEntryVerified(existingOtp) {
  return prisma.resetPassword.update({
    where: {
      id: existingOtp.id,
    },
    data: {
      is_verified: true,
    },
  });
}

function createNewOtpEntry(email, random) {
  return prisma.resetPassword.create({
    data: {
      user_identifier: email,
      otp: random,
    },
  });
}

function updateExistingOtpEntry(existingOtp, random) {
  return prisma.resetPassword.update({
    where: {
      id: existingOtp.id,
    },
    data: {
      otp: random,
      is_verified: false,
    },
  });
}

function isOtpAlreadySent(email) {
  return prisma.resetPassword.findFirst({
    where: {
      user_identifier: email,
    },
  });
}

function isEmailExist(email) {
  return prisma.users.findFirst({
    where: {
      email,
      is_registered: true,
    },
  });
}

module.exports = {
  deleteOtpEntry,
  updateUserPassword,
  isOtpVerified,
  UpdateExistingOtpEntryVerified,
  createNewOtpEntry,
  updateExistingOtpEntry,
  isOtpAlreadySent,
  isEmailExist,
};
