import express from "express";

import {
  getDashboardStats,
} from "../controllers/dashboardController.js";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

/*
  GET /api/admin/dashboard

  Admin only
*/

router.get(
  "/",
  protect,
  adminOnly,
  getDashboardStats
);

export default router;