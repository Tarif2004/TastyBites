import mongoose from "mongoose";

const dineInSettingsSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    openingTime: {
      type: String,
      default: "11:00",
      trim: true,
    },
    closingTime: {
      type: String,
      default: "22:00",
      trim: true,
    },
    maxCapacity: {
      type: Number,
      default: 30,
      min: [1, "Maximum capacity must be at least 1 person"],
    },
    slotInterval: {
      type: Number,
      default: 30,
      min: [15, "Slot interval must be at least 15 minutes"],
      max: [120, "Slot interval cannot exceed 120 minutes"],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Singleton helper: get or initialize settings document
dineInSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      enabled: true,
      openingTime: "11:00",
      closingTime: "22:00",
      maxCapacity: 30,
      slotInterval: 30,
    });
  }
  return settings;
};

const DineInSettings = mongoose.model("DineInSettings", dineInSettingsSchema);

export default DineInSettings;
