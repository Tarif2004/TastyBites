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

app.set("trust proxy", 1);

/* =========================================
   CORS
========================================= */
// import cors from "cors";

const allowedOrigins = (
  process.env.CLIENT_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin
      // (Postman, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    optionsSuccessStatus: 204,
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






// Ensure MongoDB is connected before handling API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});
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

if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(
          `TastyBites 90 server running on http://localhost:${PORT}`
        );
      });
    })
    .catch((error) => {
      console.error("Server startup failed:");
      console.error(error.message);
      process.exit(1);
    });
}

export default app;