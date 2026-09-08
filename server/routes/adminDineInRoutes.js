import express from "express";
import {
  getAdminSettings,
  updateAdminSettings,
  getAdminReservations,
  updateReservationStatus,
} from "../controllers/adminDineInController.js";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

/* All routes in this file require both authentication and admin/owner authority */
router.use(protect, adminOnly);

router.get("/settings", getAdminSettings);
router.put("/settings", updateAdminSettings);

router.get("/reservations", getAdminReservations);
router.patch("/reservations/:id/status", updateReservationStatus);

export default router;
