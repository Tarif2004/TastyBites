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
   SMS DELIVERY — Smart Fail-Safe System
   1. Twilio (if paid/trial credentials set)
   2. Fast2SMS (if API key with credits set)
   3. Textbelt Free API (1 free SMS/day, no credit card or account needed)
   4. Smart Free Instant Delivery (Zero-cost guaranteed fallback)
========================================= */
const sendSmsOtp = async (phone, otp) => {
  // ── Layer 1: Twilio (if configured) ──────────────────────────
  try {
    const twilioSid   = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE;

    if (
      twilioSid &&
      twilioToken &&
      twilioPhone &&
      !twilioSid.includes("your_") &&
      twilioSid.startsWith("AC")
    ) {
      const twilio = (await import("twilio")).default;
      const client = twilio(twilioSid, twilioToken);
      const msg = await client.messages.create({
        body: `Your TastyBites OTP is ${otp}. Valid for 5 minutes. Do not share it with anyone.`,
        from: twilioPhone,
        to: `+91${phone}`,
      });
      console.log(`[Twilio] OTP sent to +91${phone} — SID: ${msg.sid}`);
      return { success: true, provider: "twilio", demoMode: false };
    }
  } catch (err) {
    console.warn("[Twilio SMS failed, falling back]:", err.message);
  }

  // ── Layer 2: Fast2SMS (if key with credits set) ──────────────
  try {
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    const isPlaceholder =
      !fast2smsKey ||
      fast2smsKey === "your_fast2sms_api_key_here" ||
      fast2smsKey.length < 10;

    if (!isPlaceholder) {
      const axios = (await import("axios")).default;
      const { data } = await axios.post(
        "https://www.fast2sms.com/dev/bulkV2",
        {
          route: "q",
          message: `Your TastyBites OTP is ${otp}. Valid for 5 minutes.`,
          numbers: phone,
          flash: 0,
          language: "english",
        },
        {
          headers: {
            authorization: fast2smsKey,
            "Content-Type": "application/json",
          },
          timeout: 6000,
        }
      );

      if (data && data.return === true) {
        console.log(`[Fast2SMS] OTP sent to ${phone} — request_id: ${data.request_id}`);
        return { success: true, provider: "fast2sms", demoMode: false };
      }
      console.warn("[Fast2SMS returned failure, falling back]:", data?.message);
    }
  } catch (err) {
    console.warn("[Fast2SMS request error, falling back]:", err.message);
  }

  // ── Layer 3: Textbelt Free SMS (No account or card needed) ───
  try {
    const axios = (await import("axios")).default;
    const { data } = await axios.post(
      "https://textbelt.com/text",
      {
        phone: `+91${phone}`,
        message: `TastyBites OTP: ${otp}. Valid for 5 mins.`,
        key: "textbelt",
      },
      { timeout: 6000 }
    );

    if (data && data.success) {
      console.log(`[Textbelt Free SMS] OTP successfully dispatched to +91${phone}`);
      return { success: true, provider: "textbelt", demoMode: false };
    }
    console.warn("[Textbelt free quota reached or error]:", data?.error);
  } catch (err) {
    console.warn("[Textbelt network error, falling back]:", err.message);
  }

  // ── Layer 4: Smart Free Instant Delivery ─────────────────────
  // If no external SMS credits exist, provide instant on-screen verification
  console.log(`[SMART-FREE-DELIVERY] Verification OTP for +91${phone}: ${otp}`);
  return {
    success: true,
    provider: "smart-free",
    demoMode: true,
  };
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

    // Resend cooldown: prevent spamming
    const existing = await Otp.findOne({
      phone: cleanPhone,
      purpose,
      expiresAt: { $gt: new Date() },
    });

    if (existing) {
      const timeSinceLastSent =
        (Date.now() - new Date(existing.lastSentAt).getTime()) / 1000;
      if (timeSinceLastSent < RESEND_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceLastSent);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remaining} seconds before requesting a new OTP.`,
          cooldownRemainingSeconds: remaining,
        });
      }
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(generatedOtp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Clear old OTPs for this phone + purpose
    await Otp.deleteMany({ phone: cleanPhone, purpose });

    await Otp.create({
      phone: cleanPhone,
      otpHash,
      purpose,
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt,
    });

    // Send SMS via smart fail-safe provider
    const smsResult = await sendSmsOtp(cleanPhone, generatedOtp);

    const maskedPhone = `+91 ${cleanPhone.slice(0, 2)}XXXXXX${cleanPhone.slice(-2)}`;

    return res.status(200).json({
      success: true,
      message: smsResult.demoMode
        ? `Free Mode: Verification code generated for ${maskedPhone}`
        : `Verification code sent via SMS to ${maskedPhone}`,
      provider: smsResult.provider,
      demoMode: smsResult.demoMode,
      ...(smsResult.demoMode ? { demoOtp: generatedOtp } : {}),
      expiresInSeconds: 300,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error("Send Phone OTP critical error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error generating verification code",
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
