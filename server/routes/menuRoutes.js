import express from "express";

import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

/*
  PUBLIC
*/

/* GET /api/menu */
router.get("/", getMenuItems);

/* GET /api/menu/:id */
router.get("/:id", getMenuItem);

/*
  ADMIN ONLY
*/

/* POST /api/menu */
router.post(
  "/",
  protect,
  adminOnly,
  createMenuItem
);

/* PUT /api/menu/:id */
router.put(
  "/:id",
  protect,
  adminOnly,
  updateMenuItem
);

/* DELETE /api/menu/:id */
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteMenuItem
);

export default router;