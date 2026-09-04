import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const createOwner = async () => {
  try {
    await connectDB();

    const ownerEmail = process.env.OWNER_EMAIL || "owner@tastybites90.com";
    const ownerPassword = process.env.OWNER_PASSWORD || "OwnerTastyBites2026!";
    const ownerName = process.env.OWNER_NAME || "TastyBites Owner";

    const normalizedEmail = ownerEmail.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      existingUser.role = "owner";
      existingUser.adminStatus = "approved";
      existingUser.password = hashedPassword;
      existingUser.isEmailVerified = true;
      await existingUser.save();
      console.log(`Updated existing user (${normalizedEmail}) to role: 'owner' with specified password.`);
      process.exit(0);
    }

    await User.create({
      name: ownerName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "owner",
      adminStatus: "approved",
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    console.log(`Owner account (${normalizedEmail}) created successfully.`);
    process.exit(0);
  } catch (error) {
    console.error("Owner creation failed:", error.message);
    process.exit(1);
  }
};

createOwner();
