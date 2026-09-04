import express from "express";

import {
  getUsers,
  getPendingAdmins,
  verifyAdmin,
  deleteUser,
} from "../controllers/userController.js";

import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import ownerOnly from "../middleware/ownerMiddleware.js";

const router = express.Router();

/* Admin or Owner: Get all registered users */
router.get("/", protect, adminOnly, getUsers);

/* Owner only: Get pending admin applications */
router.get("/pending-admins", protect, ownerOnly, getPendingAdmins);

/* Owner only: Approve/reject an admin application (supports PUT and PATCH) */
router.put("/verify-admin/:id", protect, ownerOnly, verifyAdmin);
router.patch("/verify-admin/:id", protect, ownerOnly, verifyAdmin);

/* Admin or Owner: Delete a user */
router.delete("/:id", protect, adminOnly, deleteUser);

export default router;