import crypto from "crypto";
import Otp from "../models/Otp.js";

/* =========================================
   GENERATE & SEND OTP (Swiggy / Zomato style)
   POST /api/auth/otp/send
========================================= */
export const sendOtp = async (req, res) => {
  try {
    const { phone, purpose = "user_verification" } = req.body;

    if (!phone || !/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "A valid 10-digit mobile number is required",
      });
    }

    const cleanPhone = phone.trim();

    // Generate random 6-digit numeric OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Remove any older OTPs for this phone and purpose
    await Otp.deleteMany({ phone: cleanPhone, purpose });

    // Save OTP
    await Otp.create({
      phone: cleanPhone,
      otp: generatedOtp,
      purpose,
      expiresAt,
    });

    console.log(`[SMS-GATEWAY] Verification OTP for ${cleanPhone}: ${generatedOtp}`);

    return res.status(200).json({
      success: true,
      message: `Verification code sent to +91 ${cleanPhone.slice(0, 2)}******${cleanPhone.slice(-2)}`,
      // For developer/demonstration testing convenience, also return preview
      demoOtp: generatedOtp,
      expiresInSeconds: 300,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please try again.",
    });
  }
};

/* =========================================
   VERIFY OTP
   POST /api/auth/otp/verify
========================================= */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, purpose = "user_verification" } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    const record = await Otp.findOne({
      phone: cleanPhone,
      purpose,
      expiresAt: { $gt: new Date() },
    });

    if (!record || record.otp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new code.",
      });
    }

    // OTP is valid - consume it
    await Otp.deleteOne({ _id: record._id });

    return res.status(200).json({
      success: true,
      message: "Phone number verified successfully!",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error verifying OTP",
    });
  }
};
