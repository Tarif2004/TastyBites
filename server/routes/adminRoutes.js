import express from "express";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

/*
  GET /api/admin/test

  Requires:
  1. Valid JWT
  2. Admin role
*/

router.get(
  "/test",
  protect,
  adminOnly,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome to the TastyBites 90 admin area",
      admin: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
);

export default router;  