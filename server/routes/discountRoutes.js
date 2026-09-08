import express from "express";
import {
  applyDiscount,
  getActiveDiscounts,
  getOwnerDiscounts,
  createDiscount,
  updateDiscount,
  toggleDiscountStatus,
  deleteDiscount,
} from "../controllers/discountController.js";
import protect from "../middleware/authMiddleware.js";
import ownerOnly from "../middleware/ownerMiddleware.js";

const router = express.Router();

/* =========================================
   CUSTOMER ROUTES
========================================= */

// Public: View currently active promotional offers
router.get("/active", getActiveDiscounts);

// Authenticated: Apply a discount coupon to order cart
router.post("/apply", protect, applyDiscount);

/* =========================================
   OWNER-ONLY MANAGEMENT ROUTES
========================================= */

// All routes below require valid JWT and role === 'owner'
router.get("/owner", protect, ownerOnly, getOwnerDiscounts);
router.post("/owner", protect, ownerOnly, createDiscount);
router.put("/owner/:id", protect, ownerOnly, updateDiscount);
router.patch("/owner/:id/status", protect, ownerOnly, toggleDiscountStatus);
router.delete("/owner/:id", protect, ownerOnly, deleteDiscount);

export default router;
