import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

/* =========================================
   GENERATE JWT
========================================= */

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET || "fallback_secret_key",
    {
      expiresIn: "7d",
    }
  );
};

/* =========================================
   REGISTER USER (CUSTOMER)
========================================= */

export const registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : "",
      isPhoneVerified: !!phone,
      password: hashedPassword,
      role: "user",
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

/* =========================================
   REGISTER ADMIN (Pending Owner Approval)
========================================= */

export const registerAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      aadhaarNumber,
      password,
      confirmPassword,
      captchaAnswer,
      captchaExpected,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !aadhaarNumber ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required for admin registration",
      });
    }

    // Validate Math Captcha
    if (
      captchaAnswer === undefined ||
      parseInt(captchaAnswer, 10) !== parseInt(captchaExpected, 10)
    ) {
      return res.status(400).json({
        success: false,
        message: "Security Captcha answer is incorrect. Please try again.",
      });
    }

    // Validate Aadhaar (12 digits)
    const cleanAadhaar = aadhaarNumber.replace(/\s+/g, "");
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      return res.status(400).json({
        success: false,
        message: "A valid 12-digit Aadhaar Card Number is required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered in the system",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Admin account created with pending verification status
    const adminUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      isPhoneVerified: true,
      aadhaarNumber: cleanAadhaar,
      password: hashedPassword,
      role: "admin",
      adminStatus: "pending",
    });

    return res.status(201).json({
      success: true,
      message:
        "Admin application submitted successfully! Your account is pending Owner verification and approval.",
      adminStatus: "pending",
    });
  } catch (error) {
    console.error("Register Admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during admin registration",
    });
  }
};

/* =========================================
   LOGIN
========================================= */

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check Admin approval status
    if (user.role === "admin" && user.adminStatus !== "approved") {
      if (user.adminStatus === "rejected") {
        return res.status(403).json({
          success: false,
          message: "Your admin application was rejected by the Owner.",
        });
      }
      return res.status(403).json({
        success: false,
        message:
          "Your admin application is pending verification by the Owner. You will be able to log in once approved.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminStatus: user.adminStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

/* =========================================
   GOOGLE / AUTH0 OAUTH LOGIN
========================================= */

export const googleAuth = async (req, res) => {
  try {
    const { email, name, googleId, picture, targetRole = "user" } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google authentication failed: Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Create new user account via Google
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36).slice(-10),
        10
      );

      // If user selected admin login via google, place in pending
      const assignedRole = targetRole === "admin" ? "admin" : "user";
      const adminStatus = assignedRole === "admin" ? "pending" : "none";

      user = await User.create({
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        password: randomPassword,
        role: assignedRole,
        adminStatus,
        isPhoneVerified: false,
      });

      if (assignedRole === "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Google Admin registration complete. Your account is pending Owner approval before you can sign in.",
        });
      }
    } else {
      // Check Admin approval status if existing user is admin
      if (user.role === "admin" && user.adminStatus !== "approved") {
        return res.status(403).json({
          success: false,
          message:
            "Your admin account is pending verification by the Owner.",
        });
      }
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminStatus: user.adminStatus,
      },
    });
  } catch (error) {
    console.error("Google Auth error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during Google authentication",
    });
  }
};

/* =========================================
   GET CURRENT USER
========================================= */

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      adminStatus: req.user.adminStatus,
    },
  });
};