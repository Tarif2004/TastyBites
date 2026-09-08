import Discount from "../models/Discount.js";

/* =========================================
   HELPER: CALCULATE DISCOUNT
========================================= */

export const calculateDiscountAmount = (discount, subtotal) => {
  let discountAmount = 0;

  if (discount.type === "percentage") {
    const rawDiscount = Math.round((subtotal * discount.value) / 100);
    discountAmount = discount.maximumDiscountAmount
      ? Math.min(rawDiscount, discount.maximumDiscountAmount)
      : rawDiscount;
  } else if (discount.type === "fixed") {
    discountAmount = Math.min(discount.value, subtotal);
  }

  return Math.max(0, discountAmount);
};

/* =========================================
   HELPER: VALIDATE DISCOUNT ELIGIBILITY
========================================= */

export const validateDiscountEligibility = (discount, userId, subtotal) => {
  if (!discount || !discount.active) {
    return { valid: false, message: "Invalid or inactive discount coupon code." };
  }

  const now = new Date();

  if (discount.startDate && new Date(discount.startDate) > now) {
    return { valid: false, message: "This coupon is not active yet." };
  }

  if (new Date(discount.endDate) < now) {
    return { valid: false, message: "This discount code has expired." };
  }

  if (subtotal < (discount.minimumOrderAmount || 0)) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${discount.minimumOrderAmount} is required for this coupon.`,
    };
  }

  if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
    return { valid: false, message: "This coupon has reached its total usage limit." };
  }

  if (userId && discount.perUserLimit) {
    const userUses = discount.usedBy.filter(
      (u) => u.user.toString() === userId.toString()
    ).length;

    if (userUses >= discount.perUserLimit) {
      return {
        valid: false,
        message: `You have already redeemed this coupon the maximum allowed times (${discount.perUserLimit}).`,
      };
    }
  }

  return { valid: true };
};

/* =========================================
   CUSTOMER: APPLY DISCOUNT
   POST /api/discounts/apply
========================================= */

export const applyDiscount = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a coupon code.",
      });
    }

    const numericSubtotal = Number(subtotal);
    if (isNaN(numericSubtotal) || numericSubtotal < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subtotal amount.",
      });
    }

    const normalizedCode = code.trim().toUpperCase();
    const discount = await Discount.findOne({ code: normalizedCode });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code. Please verify and try again.",
      });
    }

    const validation = validateDiscountEligibility(
      discount,
      req.user?._id,
      numericSubtotal
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const discountAmount = calculateDiscountAmount(discount, numericSubtotal);
    const newSubtotal = Math.max(0, numericSubtotal - discountAmount);

    return res.status(200).json({
      success: true,
      message: `Coupon ${discount.code} applied successfully!`,
      discount: {
        id: discount._id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        discountAmount,
        newSubtotal,
      },
    });
  } catch (error) {
    console.error("Apply discount error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while validating coupon code",
    });
  }
};

/* =========================================
   CUSTOMER: GET ACTIVE DISCOUNTS
   GET /api/discounts/active
========================================= */

export const getActiveDiscounts = async (req, res) => {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      active: true,
      endDate: { $gte: now },
      startDate: { $lte: now },
    })
      .select("name code type value minimumOrderAmount maximumDiscountAmount endDate description")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: discounts.length,
      discounts,
    });
  } catch (error) {
    console.error("Get active discounts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active discounts",
    });
  }
};

/* =========================================
   OWNER ONLY: GET ALL DISCOUNTS
   GET /api/owner/discounts
========================================= */

export const getOwnerDiscounts = async (req, res) => {
  try {
    const { status, search } = req.query;
    const now = new Date();
    const filter = {};

    if (status === "active") {
      filter.active = true;
      filter.endDate = { $gte: now };
      filter.startDate = { $lte: now };
    } else if (status === "scheduled") {
      filter.startDate = { $gt: now };
    } else if (status === "expired") {
      filter.endDate = { $lt: now };
    } else if (status === "inactive") {
      filter.active = false;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: regex }, { code: regex }];
    }

    const discounts = await Discount.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email")
      .lean();

    // Summary metrics for Owner
    const allDiscounts = await Discount.find().lean();
    const metrics = {
      total: allDiscounts.length,
      active: allDiscounts.filter(
        (d) => d.active && new Date(d.endDate) >= now && new Date(d.startDate) <= now
      ).length,
      totalRedemptions: allDiscounts.reduce((sum, d) => sum + (d.usageCount || 0), 0),
    };

    return res.status(200).json({
      success: true,
      metrics,
      count: discounts.length,
      discounts,
    });
  } catch (error) {
    console.error("Owner get discounts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve discounts list",
    });
  }
};

/* =========================================
   OWNER ONLY: CREATE DISCOUNT
   POST /api/owner/discounts
========================================= */

export const createDiscount = async (req, res) => {
  try {
    const {
      name,
      code,
      type,
      value,
      minimumOrderAmount,
      maximumDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      active,
      description,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Discount name is required." });
    }

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Coupon code is required." });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check duplicate code
    const existing = await Discount.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Coupon code '${normalizedCode}' already exists. Please choose a unique code.`,
      });
    }

    if (!["percentage", "fixed"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Discount type must be either percentage or fixed.",
      });
    }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than zero.",
      });
    }

    if (type === "percentage" && (numValue < 1 || numValue > 100)) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount must be between 1% and 100%.",
      });
    }

    if (!endDate) {
      return res.status(400).json({ success: false, message: "Expiry date is required." });
    }

    const parsedStart = startDate ? new Date(startDate) : new Date();
    const parsedEnd = new Date(endDate);

    if (parsedStart >= parsedEnd) {
      return res.status(400).json({
        success: false,
        message: "Start date must be earlier than expiry date.",
      });
    }

    const discount = await Discount.create({
      name: name.trim(),
      code: normalizedCode,
      type,
      value: numValue,
      minimumOrderAmount: Number(minimumOrderAmount) || 0,
      maximumDiscountAmount:
        type === "percentage" && maximumDiscountAmount ? Number(maximumDiscountAmount) : null,
      startDate: parsedStart,
      endDate: parsedEnd,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
      active: active !== undefined ? Boolean(active) : true,
      description: description ? description.trim() : "",
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: `Discount code '${discount.code}' created successfully!`,
      discount,
    });
  } catch (error) {
    console.error("Create discount error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create discount offer",
    });
  }
};

/* =========================================
   OWNER ONLY: UPDATE DISCOUNT
   PUT /api/owner/discounts/:id
========================================= */

export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await Discount.findById(id);

    if (!discount) {
      return res.status(404).json({ success: false, message: "Discount not found." });
    }

    const {
      name,
      code,
      type,
      value,
      minimumOrderAmount,
      maximumDiscountAmount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      active,
      description,
    } = req.body;

    if (code) {
      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode !== discount.code) {
        const existing = await Discount.findOne({ code: normalizedCode, _id: { $ne: id } });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: `Coupon code '${normalizedCode}' is already in use by another offer.`,
          });
        }
        discount.code = normalizedCode;
      }
    }

    if (name) discount.name = name.trim();
    if (type) discount.type = type;

    if (value !== undefined) {
      const numValue = Number(value);
      if (discount.type === "percentage" && (numValue < 1 || numValue > 100)) {
        return res.status(400).json({
          success: false,
          message: "Percentage discount must be between 1% and 100%.",
        });
      }
      discount.value = numValue;
    }

    if (minimumOrderAmount !== undefined) {
      discount.minimumOrderAmount = Number(minimumOrderAmount) || 0;
    }

    if (maximumDiscountAmount !== undefined) {
      discount.maximumDiscountAmount = maximumDiscountAmount ? Number(maximumDiscountAmount) : null;
    }

    if (startDate) discount.startDate = new Date(startDate);
    if (endDate) discount.endDate = new Date(endDate);

    if (new Date(discount.startDate) >= new Date(discount.endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date must be earlier than expiry date.",
      });
    }

    if (usageLimit !== undefined) {
      discount.usageLimit = usageLimit ? Number(usageLimit) : null;
    }

    if (perUserLimit !== undefined) {
      discount.perUserLimit = Number(perUserLimit) || 1;
    }

    if (active !== undefined) {
      discount.active = Boolean(active);
    }

    if (description !== undefined) {
      discount.description = description.trim();
    }

    await discount.save();

    return res.status(200).json({
      success: true,
      message: `Discount '${discount.code}' updated successfully!`,
      discount,
    });
  } catch (error) {
    console.error("Update discount error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update discount offer",
    });
  }
};

/* =========================================
   OWNER ONLY: TOGGLE DISCOUNT STATUS
   PATCH /api/owner/discounts/:id/status
========================================= */

export const toggleDiscountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await Discount.findById(id);

    if (!discount) {
      return res.status(404).json({ success: false, message: "Discount not found." });
    }

    if (req.body.active !== undefined) {
      discount.active = Boolean(req.body.active);
    } else {
      discount.active = !discount.active;
    }

    await discount.save();

    return res.status(200).json({
      success: true,
      message: `Discount '${discount.code}' is now ${discount.active ? "Active" : "Deactivated"}.`,
      discount,
    });
  } catch (error) {
    console.error("Toggle discount status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update discount status",
    });
  }
};

/* =========================================
   OWNER ONLY: DELETE DISCOUNT
   DELETE /api/owner/discounts/:id
========================================= */

export const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Discount.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Discount not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Discount '${deleted.code}' deleted successfully.`,
    });
  } catch (error) {
    console.error("Delete discount error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete discount",
    });
  }
};
