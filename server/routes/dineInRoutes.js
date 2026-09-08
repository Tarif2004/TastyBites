import express from "express";
import {
  getPublicSettings,
  getAvailability,
  createReservation,
  getMyReservations,
  getReservationById,
  cancelReservation,
} from "../controllers/dineInController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

/* Public endpoints */
router.get("/settings", getPublicSettings);
router.get("/availability", getAvailability);

/* Protected customer endpoints */
router.post("/reservations", protect, createReservation);
router.get("/my-reservations", protect, getMyReservations);
router.get("/reservations/:id", protect, getReservationById);
router.patch("/reservations/:id/cancel", protect, cancelReservation);

export default router;
