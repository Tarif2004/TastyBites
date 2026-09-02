import express from "express";

import {
  getUsers,
  deleteUser,
} from "../controllers/userController.js";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

/*
  GET /api/users

  Admin only
*/

router.get(
  "/",
  protect,
  adminOnly,
  getUsers
);


/*
  DELETE /api/users/:id

  Admin only
*/

router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteUser
);

export default router;