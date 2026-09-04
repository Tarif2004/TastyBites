import express from "express";

import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";

import protect from "../middleware/authMiddleware.js";
import ownerOnly from "../middleware/ownerMiddleware.js";

const router = express.Router();

/* Public: Get menu items */
router.get("/", getMenuItems);

/* Public: Get single menu item */
router.get("/:id", getMenuItem);

/* Owner Only: Create menu item */
router.post("/", protect, ownerOnly, createMenuItem);

/* Owner Only: Update menu item */
router.put("/:id", protect, ownerOnly, updateMenuItem);

/* Owner Only: Delete menu item */
router.delete("/:id", protect, ownerOnly, deleteMenuItem);

export default router;