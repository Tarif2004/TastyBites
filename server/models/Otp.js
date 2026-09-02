import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["user_verification", "admin_verification"],
      default: "user_verification",
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
