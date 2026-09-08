import mongoose from "mongoose";

const discountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Discount name is required"],
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
      match: [/^[A-Z0-9_-]{3,20}$/, "Coupon code must be 3-20 alphanumeric characters"],
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type must be percentage or fixed"],
    },
    value: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [1, "Discount value must be at least 1"],
      validate: {
        validator: function (val) {
          if (this.type === "percentage") {
            return val >= 1 && val <= 100;
          }
          return val > 0;
        },
        message: "Percentage discount must be between 1 and 100",
      },
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: [0, "Minimum order amount cannot be negative"],
    },
    maximumDiscountAmount: {
      type: Number,
      default: null,
      min: [0, "Maximum discount amount cannot be negative"],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, "Per-user limit must be at least 1"],
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for active coupon lookups
discountSchema.index({ code: 1, active: 1, endDate: 1 });

const Discount = mongoose.model("Discount", discountSchema);

export default Discount;
