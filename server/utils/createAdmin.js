import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {

    await connectDB();

    const adminEmail =
      process.env.ADMIN_EMAIL;

    const adminPassword =
      process.env.ADMIN_PASSWORD;

    const adminName =
      process.env.ADMIN_NAME || "TastyBites Admin";

    if (
      !adminEmail ||
      !adminPassword
    ) {
      console.error(
        "ADMIN_EMAIL and ADMIN_PASSWORD are required in .env"
      );

      process.exit(1);
    }

    /* Check existing user */

    const existingUser = await User.findOne({
      email: adminEmail.toLowerCase(),
    });

    if (existingUser) {

      if (existingUser.role === "admin") {
        console.log(
          "Admin account already exists."
        );
      } else {

        existingUser.role = "admin";

        await existingUser.save();

        console.log(
          "Existing user promoted to admin."
        );
      }

      process.exit(0);
    }

    /* Hash password */

    const hashedPassword =
      await bcrypt.hash(
        adminPassword,
        10
      );

    /* Create admin */

    await User.create({
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: "admin",
    });

    console.log(
      "Admin account created successfully."
    );

    process.exit(0);

  } catch (error) {

    console.error(
      "Admin creation failed:"
    );

    console.error(error.message);

    process.exit(1);
  }
};

createAdmin();