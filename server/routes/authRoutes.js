import express from "express";

import {
  registerUser,
  registerAdmin,
  loginUser,
  googleAuth,
  getCurrentUser,
} from "../controllers/authController.js";

import {
  sendEmailOtpController,
  verifyEmailOtpController,
  sendOtp,
  verifyOtp,
} from "../controllers/otpController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

/* Customer registration */
router.post("/register", registerUser);

/* Admin registration (Pending Owner Approval) */
router.post("/register-admin", registerAdmin);

/* Email/Password Login */
router.post("/login", loginUser);

/* Google / Auth0 Login */
router.post("/google", googleAuth);

/* Email OTP endpoints */
router.post("/email-otp/send", sendEmailOtpController);
router.post("/email-otp/verify", verifyEmailOtpController);

/* Mobile OTP endpoints */
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);

/* Current user session */
router.get("/me", protect, getCurrentUser);

export default router;