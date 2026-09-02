import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();

/* =========================================
   CORS
========================================= */

const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* =========================================
   SECURITY
========================================= */

app.use(helmet());

/* =========================================
   BODY PARSING
========================================= */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* =========================================
   RATE LIMITING
========================================= */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many requests — please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests — please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);

/* =========================================
   DATABASE
========================================= */

let dbConnectionPromise;

const initializeDatabase = async () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB();
  }

  await dbConnectionPromise;
};

/* =========================================
   ROUTES
========================================= */

app.use("/api/admin/dashboard", dashboardRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/menu-items", menuRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

/* =========================================
   BASIC ROUTES
========================================= */

app.get("/", async (req, res) => {
  res.json({
    success: true,
    message: "TastyBites 90 API is running 🍔",
  });
});

app.get("/api/health", async (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
  });
});

/* =========================================
   ERROR HANDLING
========================================= */

app.use(notFound);
app.use(errorHandler);

/* =========================================
   VERCEL HANDLER
========================================= */

const handler = async (req, res) => {
  try {
    await initializeDatabase();
    return app(req, res);
  } catch (error) {
    console.error("Database connection failed:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
};

export default handler;