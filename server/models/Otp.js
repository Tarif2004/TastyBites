import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["email_verification", "user_verification", "admin_verification"],
      default: "email_verification",
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically deleted after expiry
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Otp", otpSchema);
