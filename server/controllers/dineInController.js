import DineInSettings from "../models/DineInSettings.js";
import DineInReservation from "../models/DineInReservation.js";

/* =========================================
   HELPER UTILITIES
========================================= */

// Converts 24h "HH:mm" to minutes since midnight
const timeToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

// Converts minutes since midnight to 24h "HH:mm"
const minutesToTime = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// Formats "HH:mm" into "hh:mm AM/PM"
const formatDisplayTime = (timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
};

// Returns current local YYYY-MM-DD date string
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Returns current local time in minutes
const getCurrentTimeMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

/* =========================================
   PUBLIC: GET DINE-IN SETTINGS
   GET /api/dine-in/settings
========================================= */
export const getPublicSettings = async (req, res) => {
  try {
    const settings = await DineInSettings.getSettings();
    return res.status(200).json({
      success: true,
      settings: {
        enabled: settings.enabled,
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        openingTimeFormatted: formatDisplayTime(settings.openingTime),
        closingTimeFormatted: formatDisplayTime(settings.closingTime),
        maxCapacity: settings.maxCapacity,
        slotInterval: settings.slotInterval,
      },
    });
  } catch (error) {
    console.error("Error fetching dine-in settings:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve dine-in settings",
    });
  }
};

/* =========================================
   PUBLIC: GET DATE AVAILABILITY
   GET /api/dine-in/availability?date=YYYY-MM-DD
========================================= */
export const getAvailability = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date in YYYY-MM-DD format",
      });
    }

    const today = getTodayDateString();
    if (date < today) {
      return res.status(400).json({
        success: false,
        message: "Reservations cannot be booked for past dates",
      });
    }

    const settings = await DineInSettings.getSettings();

    if (!settings.enabled) {
      return res.status(200).json({
        success: true,
        date,
        enabled: false,
        message: "This restaurant is currently not accepting Dine-In reservations.",
        slots: [],
      });
    }

    // Generate slots
    const startMins = timeToMinutes(settings.openingTime);
    const endMins = timeToMinutes(settings.closingTime);
    const interval = settings.slotInterval || 30;

    const slotTimes = [];
    for (let m = startMins; m <= endMins; m += interval) {
      slotTimes.push(minutesToTime(m));
    }

    // Aggregate active bookings for this date
    const bookings = await DineInReservation.aggregate([
      {
        $match: {
          date,
          status: { $in: ["confirmed", "pending"] },
        },
      },
      {
        $group: {
          _id: "$time",
          bookedSeats: { $sum: "$numberOfPeople" },
        },
      },
    ]);

    const bookedMap = {};
    bookings.forEach((b) => {
      bookedMap[b._id] = b.bookedSeats;
    });

    const isToday = date === today;
    const currentMins = getCurrentTimeMinutes();

    const slots = slotTimes.map((time) => {
      const booked = bookedMap[time] || 0;
      const remaining = Math.max(0, settings.maxCapacity - booked);
      const slotMins = timeToMinutes(time);
      // Give 15 mins buffer for same day
      const isPast = isToday && slotMins <= currentMins + 15;

      return {
        time,
        displayTime: formatDisplayTime(time),
        capacity: settings.maxCapacity,
        booked,
        remaining,
        isPast,
        isAvailable: !isPast && remaining > 0,
      };
    });

    return res.status(200).json({
      success: true,
      date,
      enabled: true,
      maxCapacity: settings.maxCapacity,
      slotInterval: settings.slotInterval,
      openingTime: settings.openingTime,
      closingTime: settings.closingTime,
      slots,
    });
  } catch (error) {
    console.error("Error checking dine-in availability:", error);
    return res.status(500).json({
      success: false,
      message: "Server error checking table availability",
    });
  }
};

/* =========================================
   PROTECTED: CREATE RESERVATION
   POST /api/dine-in/reservations
========================================= */
export const createReservation = async (req, res) => {
  try {
    const {
      date,
      time,
      partyType,
      numberOfPeople,
      customerName,
      phone,
      email,
      notes,
    } = req.body;

    // 1. Check Dine-In Status
    const settings = await DineInSettings.getSettings();
    if (!settings.enabled) {
      return res.status(400).json({
        success: false,
        message: "This restaurant is currently not accepting Dine-In reservations.",
      });
    }

    // 2. Validate Customer Details
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    const cleanPhone = String(phone || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "A valid 10-digit phone number is required",
      });
    }

    // 3. Validate Date
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "A valid date (YYYY-MM-DD) is required",
      });
    }

    const today = getTodayDateString();
    if (date < today) {
      return res.status(400).json({
        success: false,
        message: "Reservations cannot be booked for past dates",
      });
    }

    // 4. Validate Time
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({
        success: false,
        message: "A valid time (HH:mm) is required",
      });
    }

    const slotMins = timeToMinutes(time);
    const startMins = timeToMinutes(settings.openingTime);
    const endMins = timeToMinutes(settings.closingTime);

    if (slotMins < startMins || slotMins > endMins) {
      return res.status(400).json({
        success: false,
        message: `Reservations are only available between ${formatDisplayTime(
          settings.openingTime
        )} and ${formatDisplayTime(settings.closingTime)}`,
      });
    }

    // Check same-day past time
    if (date === today) {
      const currentMins = getCurrentTimeMinutes();
      if (slotMins <= currentMins) {
        return res.status(400).json({
          success: false,
          message: "The selected time slot has already passed",
        });
      }
    }

    // 5. Validate Party Size & Type
    const peopleCount = parseInt(numberOfPeople, 10);
    if (isNaN(peopleCount) || peopleCount < 1 || peopleCount > 10) {
      return res.status(400).json({
        success: false,
        message: "Party size must be between 1 and 10 people",
      });
    }

    const normalizedPartyType = String(partyType || "").toLowerCase().trim();

    if (!["single", "double", "four", "family"].includes(normalizedPartyType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid party type. Choose single, double, four, or family.",
      });
    }

    if (normalizedPartyType === "single" && peopleCount !== 1) {
      return res.status(400).json({
        success: false,
        message: "Single party option is for exactly 1 person",
      });
    }

    if (normalizedPartyType === "double" && peopleCount !== 2) {
      return res.status(400).json({
        success: false,
        message: "Double party option is for exactly 2 people",
      });
    }

    if (normalizedPartyType === "four" && peopleCount !== 4) {
      return res.status(400).json({
        success: false,
        message: "4 Person party option is for exactly 4 people",
      });
    }

    if (normalizedPartyType === "family") {
      if (peopleCount < 5 || peopleCount > 10) {
        return res.status(400).json({
          success: false,
          message: "Family reservations must be between 5 and 10 people",
        });
      }
    }

    // 6. Real-time Capacity Check & Race Condition Protection
    const existingBookings = await DineInReservation.aggregate([
      {
        $match: {
          date,
          time,
          status: { $in: ["confirmed", "pending"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$numberOfPeople" },
        },
      },
    ]);

    const currentBooked = existingBookings[0]?.total || 0;
    const remainingCapacity = settings.maxCapacity - currentBooked;

    if (currentBooked + peopleCount > settings.maxCapacity) {
      return res.status(409).json({
        success: false,
        message: `Sorry, this time slot cannot accommodate ${peopleCount} guests. Only ${Math.max(
          0,
          remainingCapacity
        )} seats left.`,
        remainingCapacity: Math.max(0, remainingCapacity),
      });
    }

    // 7. Generate Unique Reservation Code (e.g. TB-DIN-K7A9X2)
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const reservationCode = `TB-DIN-${randomCode}`;

    // 8. Create Reservation
    const reservation = await DineInReservation.create({
      reservationCode,
      user: req.user._id,
      customerName: customerName.trim(),
      phone: cleanPhone,
      email: email ? email.trim().toLowerCase() : req.user.email || "",
      date,
      time,
      partyType: normalizedPartyType,
      numberOfPeople: peopleCount,
      status: "confirmed",
      notes: notes ? notes.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Table reservation confirmed successfully!",
      reservation: {
        id: reservation._id,
        reservationCode: reservation.reservationCode,
        date: reservation.date,
        time: reservation.time,
        displayTime: formatDisplayTime(reservation.time),
        partyType: reservation.partyType,
        numberOfPeople: reservation.numberOfPeople,
        customerName: reservation.customerName,
        phone: reservation.phone,
        status: reservation.status,
        notes: reservation.notes,
        createdAt: reservation.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating dine-in reservation:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while creating table reservation",
    });
  }
};

/* =========================================
   PROTECTED: GET MY RESERVATIONS
   GET /api/dine-in/my-reservations
========================================= */
export const getMyReservations = async (req, res) => {
  try {
    const reservations = await DineInReservation.find({ user: req.user._id })
      .sort({ date: -1, time: -1 })
      .lean();

    const formatted = reservations.map((r) => ({
      ...r,
      displayTime: formatDisplayTime(r.time),
    }));

    return res.status(200).json({
      success: true,
      reservations: formatted,
    });
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load your reservations",
    });
  }
};

/* =========================================
   PROTECTED: GET SINGLE RESERVATION
   GET /api/dine-in/reservations/:id
========================================= */
export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = id.startsWith("TB-DIN-")
      ? { reservationCode: id.toUpperCase() }
      : { _id: id };

    const reservation = await DineInReservation.findOne(query).lean();

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    // Ensure user owns this reservation or is admin/owner
    const isOwnerOrAdmin =
      req.user.role === "admin" || req.user.role === "owner";
    if (!isOwnerOrAdmin && reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this reservation",
      });
    }

    return res.status(200).json({
      success: true,
      reservation: {
        ...reservation,
        displayTime: formatDisplayTime(reservation.time),
      },
    });
  } catch (error) {
    console.error("Error getting reservation details:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve reservation details",
    });
  }
};

/* =========================================
   PROTECTED: CANCEL RESERVATION (CUSTOMER)
   PATCH /api/dine-in/reservations/:id/cancel
========================================= */
export const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await DineInReservation.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found",
      });
    }

    // Ownership check
    const isOwnerOrAdmin =
      req.user.role === "admin" || req.user.role === "owner";
    if (!isOwnerOrAdmin && reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this reservation",
      });
    }

    if (reservation.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Reservation is already cancelled",
      });
    }

    if (reservation.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed reservation",
      });
    }

    reservation.status = "cancelled";
    await reservation.save();

    return res.status(200).json({
      success: true,
      message: "Your reservation has been cancelled successfully",
      reservation: {
        ...reservation.toObject(),
        displayTime: formatDisplayTime(reservation.time),
      },
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel reservation",
    });
  }
};
