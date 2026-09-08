import DineInSettings from "../models/DineInSettings.js";
import DineInReservation from "../models/DineInReservation.js";

// Helper: converts "HH:mm" to minutes
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Formats "HH:mm" into "hh:mm AM/PM"
const formatDisplayTime = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

/* =========================================
   ADMIN: GET DINE-IN SETTINGS
   GET /api/admin/dine-in/settings
========================================= */
export const getAdminSettings = async (req, res) => {
  try {
    const settings = await DineInSettings.getSettings();
    return res.status(200).json({
      success: true,
      settings: {
        id: settings._id,
        enabled: settings.enabled,
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        openingTimeFormatted: formatDisplayTime(settings.openingTime),
        closingTimeFormatted: formatDisplayTime(settings.closingTime),
        maxCapacity: settings.maxCapacity,
        slotInterval: settings.slotInterval,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching admin dine-in settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load restaurant dine-in settings",
    });
  }
};

/* =========================================
   ADMIN: UPDATE DINE-IN SETTINGS
   PUT /api/admin/dine-in/settings
========================================= */
export const updateAdminSettings = async (req, res) => {
  try {
    const { enabled, openingTime, closingTime, maxCapacity, slotInterval } =
      req.body;

    // Validate opening & closing times
    if (openingTime && !/^\d{2}:\d{2}$/.test(openingTime)) {
      return res.status(400).json({
        success: false,
        message: "Opening time must be in HH:mm format (24-hour)",
      });
    }

    if (closingTime && !/^\d{2}:\d{2}$/.test(closingTime)) {
      return res.status(400).json({
        success: false,
        message: "Closing time must be in HH:mm format (24-hour)",
      });
    }

    const settings = await DineInSettings.getSettings();

    const newOpening = openingTime || settings.openingTime;
    const newClosing = closingTime || settings.closingTime;

    if (timeToMinutes(newOpening) >= timeToMinutes(newClosing)) {
      return res.status(400).json({
        success: false,
        message: "Opening time must be earlier than closing time",
      });
    }

    // Validate capacity
    if (maxCapacity !== undefined) {
      const parsedCapacity = parseInt(maxCapacity, 10);
      if (isNaN(parsedCapacity) || parsedCapacity < 1) {
        return res.status(400).json({
          success: false,
          message: "Maximum capacity must be at least 1 person",
        });
      }
      settings.maxCapacity = parsedCapacity;
    }

    // Validate slot interval
    if (slotInterval !== undefined) {
      const parsedInterval = parseInt(slotInterval, 10);
      if (isNaN(parsedInterval) || parsedInterval < 15 || parsedInterval > 120) {
        return res.status(400).json({
          success: false,
          message: "Slot interval must be between 15 and 120 minutes",
        });
      }
      settings.slotInterval = parsedInterval;
    }

    if (enabled !== undefined) {
      settings.enabled = Boolean(enabled);
    }

    settings.openingTime = newOpening;
    settings.closingTime = newClosing;
    settings.updatedBy = req.user._id;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Dine-In configuration saved successfully!",
      settings: {
        id: settings._id,
        enabled: settings.enabled,
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        openingTimeFormatted: formatDisplayTime(settings.openingTime),
        closingTimeFormatted: formatDisplayTime(settings.closingTime),
        maxCapacity: settings.maxCapacity,
        slotInterval: settings.slotInterval,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating admin dine-in settings:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update dine-in settings",
    });
  }
};

/* =========================================
   ADMIN: GET RESERVATIONS LIST
   GET /api/admin/dine-in/reservations
========================================= */
export const getAdminReservations = async (req, res) => {
  try {
    const { date, status, search } = req.query;

    const filter = {};

    if (date) {
      filter.date = date;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { customerName: searchRegex },
        { phone: searchRegex },
        { reservationCode: searchRegex },
      ];
    }

    const reservations = await DineInReservation.find(filter)
      .sort({ date: -1, time: 1 })
      .populate("user", "name email")
      .lean();

    const formatted = reservations.map((r) => ({
      ...r,
      displayTime: formatDisplayTime(r.time),
    }));

    // Today's summary stats
    const today = new Date().toISOString().split("T")[0];
    const todayReservations = await DineInReservation.find({ date: today }).lean();

    const stats = {
      totalToday: todayReservations.length,
      confirmedToday: todayReservations.filter((r) => r.status === "confirmed").length,
      completedToday: todayReservations.filter((r) => r.status === "completed").length,
      cancelledToday: todayReservations.filter((r) => r.status === "cancelled").length,
      guestsToday: todayReservations
        .filter((r) => r.status !== "cancelled")
        .reduce((sum, r) => sum + (r.numberOfPeople || 0), 0),
    };

    return res.status(200).json({
      success: true,
      stats,
      reservations: formatted,
    });
  } catch (error) {
    console.error("Error fetching admin reservations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load restaurant reservations",
    });
  }
};

/* =========================================
   ADMIN: UPDATE RESERVATION STATUS
   PATCH /api/admin/dine-in/reservations/:id/status
========================================= */
export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Choose one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const reservation = await DineInReservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    reservation.status = status;
    await reservation.save();

    return res.status(200).json({
      success: true,
      message: `Reservation marked as ${status}`,
      reservation: {
        ...reservation.toObject(),
        displayTime: formatDisplayTime(reservation.time),
      },
    });
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update reservation status",
    });
  }
};
