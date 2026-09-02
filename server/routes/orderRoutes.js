import express from "express";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";
import protect from "../middleware/authMiddleware.js";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController.js";
import admin from "../middleware/adminMiddleware.js";

const router = express.Router();


/*
  POST /api/orders

  Create a new order
*/

router.post("/", protect, createOrder);

router.get("/my-orders", protect, getMyOrders);

router.get("/", protect, admin, getAllOrders);

router.get("/:id", protect, getOrderById);

router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;