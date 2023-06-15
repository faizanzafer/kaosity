const { UserRole } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { now } = require("mongoose");

const UserSeeding = async (prisma) => {
  const hashPassword = bcrypt.hashSync("kaosity123", 10);
  const userPass = bcrypt.hashSync("Abcd@1234", 10);

  // Users Seeding
  await prisma.users.createMany({
    data: [
      {
        email: `admin@admin.com`,
        password: hashPassword,
        is_registered: true,
        role: UserRole.ADMIN,
        updated_at: now(),
      },
      {
        email: "faizanzaferjut@gmail.com",
        user_name: "feziii",
        firstname: "faizan zafar jut",
        password: userPass,
        country: "pakistan",
        dob: "29-11-1998",
        is_registered: true,
      },
    ],
    skipDuplicates: true,
  });
};

module.exports = { UserSeeding };
