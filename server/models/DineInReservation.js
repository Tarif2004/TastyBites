import mongoose from "mongoose";

const dineInReservationSchema = new mongoose.Schema(
  {
    reservationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
    },
    time: {
      type: String, // HH:mm (24h)
      required: true,
      index: true,
      match: [/^\d{2}:\d{2}$/, "Time must be in HH:mm format"],
    },
    partyType: {
      type: String,
      required: true,
      enum: ["single", "double", "four", "family"],
      index: true,
    },
    numberOfPeople: {
      type: Number,
      required: true,
      min: [1, "Party size must be at least 1 person"],
      max: [10, "Maximum party size allowed is 10 people"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "confirmed",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast lookups and capacity aggregation
dineInReservationSchema.index({ date: 1, time: 1, status: 1 });
dineInReservationSchema.index({ user: 1, createdAt: -1 });

const DineInReservation = mongoose.model(
  "DineInReservation",
  dineInReservationSchema
);

export default DineInReservation;
