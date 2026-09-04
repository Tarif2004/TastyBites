import bcrypt from "bcryptjs";
import Otp from "../models/Otp.js";
import { sendEmailOtp } from "../utils/sendEmail.js";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/* =========================================
   GENERATE & SEND EMAIL OTP
   POST /api/auth/email-otp/send
========================================= */
export const sendEmailOtpController = async (req, res) => {
  try {
    const { email, purpose = "email_verification" } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check resend cooldown / rate limiting
    const existingOtp = await Otp.findOne({
      email: cleanEmail,
      purpose,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (existingOtp) {
      const timeSinceLastSent = (Date.now() - new Date(existingOtp.lastSentAt).getTime()) / 1000;
      if (timeSinceLastSent < RESEND_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceLastSent);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remaining} seconds before requesting a new OTP.`,
          cooldownRemainingSeconds: remaining,
        });
      }
    }

    // Generate 6-digit numeric OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP using bcrypt
    const otpHash = await bcrypt.hash(generatedOtp, 10);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Clear previous OTP records for this email and purpose
    await Otp.deleteMany({ email: cleanEmail, purpose });

    // Save hashed OTP in database
    await Otp.create({
      email: cleanEmail,
      otpHash,
      purpose,
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt,
    });

    // Send Email
    const emailResult = await sendEmailOtp({
      to: cleanEmail,
      otp: generatedOtp,
      purpose,
    });

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      demoMode: emailResult.demoMode,
      ...(emailResult.demoMode ? { demoOtp: generatedOtp } : {}),
      expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("Send Email OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email verification code. Please try again.",
    });
  }
};

/* =========================================
   VERIFY EMAIL OTP
   POST /api/auth/email-otp/verify
========================================= */
export const verifyEmailOtpController = async (req, res) => {
  try {
    const { email, otp, purpose = "email_verification" } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email address and verification code are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const record = await Otp.findOne({
      email: cleanEmail,
      purpose,
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "No active OTP found. Please request a new verification code.",
      });
    }

    // Check expiration
    if (new Date() > new Date(record.expiresAt)) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    // Check attempt limits
    if (record.attempts >= MAX_ATTEMPTS) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new verification code.",
      });
    }

    // Verify OTP against hash
    const isMatch = await bcrypt.compare(cleanOtp, record.otpHash);

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      const remainingAttempts = MAX_ATTEMPTS - record.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
      });
    }

    // OTP verified successfully - consume it
    await Otp.deleteOne({ _id: record._id });

    return res.status(200).json({
      success: true,
      message: "Email address verified successfully!",
    });
  } catch (error) {
    console.error("Verify Email OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

/* =========================================
   GENERATE & SEND PHONE OTP
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
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(generatedOtp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ phone: cleanPhone, purpose });

    await Otp.create({
      phone: cleanPhone,
      otpHash,
      purpose,
      expiresAt,
    });

    console.log(`[SMS-GATEWAY] Verification OTP for ${cleanPhone}: ${generatedOtp}`);

    return res.status(200).json({
      success: true,
      message: `Verification code sent to +91 ${cleanPhone.slice(0, 2)}******${cleanPhone.slice(-2)}`,
      demoOtp: generatedOtp,
      expiresInSeconds: 300,
    });
  } catch (error) {
    console.error("Send Phone OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send verification code. Please try again.",
    });
  }
};

/* =========================================
   VERIFY PHONE OTP
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

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new code.",
      });
    }

    const isMatch = await bcrypt.compare(cleanOtp, record.otpHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code",
      });
    }

    await Otp.deleteOne({ _id: record._id });

    return res.status(200).json({
      success: true,
      message: "Phone number verified successfully!",
    });
  } catch (error) {
    console.error("Verify Phone OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error verifying OTP",
    });
  }
};
