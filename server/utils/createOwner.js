import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const createOwner = async () => {
  try {
    await connectDB();

    const ownerEmail = process.env.OWNER_EMAIL || "owner@tastybites.com";
    const ownerPassword = process.env.OWNER_PASSWORD || "Owner@123456";
    const ownerName = process.env.OWNER_NAME || "TastyBites Owner";

    const normalizedEmail = ownerEmail.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      existingUser.role = "owner";
      existingUser.adminStatus = "approved";
      await existingUser.save();
      console.log(`Updated existing user (${normalizedEmail}) to role: 'owner'.`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(ownerPassword, 10);

    await User.create({
      name: ownerName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "owner",
      adminStatus: "approved",
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
