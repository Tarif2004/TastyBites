import mongoose from "mongoose";

import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";

/* =========================================
   CREATE ORDER
   POST /api/orders
========================================= */

export const createOrder = async (req, res) => {
  try {
    const {
      items,
      customer,
      location,
      paymentMethod = "COD",
    } = req.body;

    /* ================================
       VALIDATE ITEMS
    ================================= */

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Too many items in one order",
      });
    }

    /* ================================
       VALIDATE CUSTOMER & LOCATION
    ================================= */

    if (
      !customer ||
      !customer.name?.trim() ||
      !customer.phone?.trim() ||
      !customer.address?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Customer name, phone and address are required",
      });
    }

    if (
      !location ||
      location.latitude === undefined ||
      location.longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Exact live GPS location is required to place an order",
      });
    }

    /* ================================
       VALIDATE PAYMENT
    ================================= */

    if (paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Only Cash on Delivery is supported",
      });
    }

    /* ================================
       VALIDATE ITEMS
    ================================= */

    for (const item of items) {
      if (!mongoose.isValidObjectId(item.menuItem)) {
        return res.status(400).json({
          success: false,
          message: "Invalid menu item ID",
        });
      }

      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be an integer between 1 and 50",
        });
      }
    }

    /* ================================
       MERGE DUPLICATE ITEMS
    ================================= */

    const quantityMap = new Map();

    for (const item of items) {
      const id = item.menuItem;
      const quantity = Number(item.quantity);

      quantityMap.set(id, (quantityMap.get(id) || 0) + quantity);
    }

    /* ================================
       FETCH MENU ITEMS
    ================================= */

    const menuItemIds = [...quantityMap.keys()];

    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      availability: true,
    })
      .select("_id name price image")
      .lean();

    /* ================================
       CHECK AVAILABILITY
    ================================= */

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more menu items are unavailable",
      });
    }

    /* ================================
       CREATE O(1) MENU MAP
    ================================= */

    const menuMap = new Map(
      menuItems.map((item) => [item._id.toString(), item])
    );

    /* ================================
       BUILD ORDER ITEMS
    ================================= */

    const orderItems = [];
    let subtotal = 0;

    for (const [menuItemId, quantity] of quantityMap) {
      const menuItem = menuMap.get(menuItemId);

      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: "One or more menu items are unavailable",
        });
      }

      const itemTotal = menuItem.price * quantity;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        image: menuItem.image || "",
      });

      subtotal += itemTotal;
    }

    /* ================================
       DELIVERY FEE
    ================================= */

    const deliveryFee = 40;
    const total = subtotal + deliveryFee;

    /* ================================
       CREATE ORDER
    ================================= */

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
      },
      location: {
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        accuracy: Number(location.accuracy || 0),
        formattedAddress: location.formattedAddress || "",
      },
      paymentMethod,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

/* =========================================
   GET MY ORDERS
   GET /api/orders/my-orders
========================================= */

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

/* =========================================
   GET ALL ORDERS
   GET /api/orders
   ADMIN / OWNER
========================================= */

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "_id name email phone")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get all orders error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

/* =========================================
   GET SINGLE ORDER
   GET /api/orders/:id
========================================= */

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id)
      .populate("user", "_id name email phone")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isCustomerOwner =
      order.user?._id?.toString() === req.user._id.toString();

    const isStaff =
      req.user.role === "admin" || req.user.role === "owner";

    if (!isCustomerOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

/* =========================================
   UPDATE ORDER STATUS
   PUT /api/orders/:id/status
   ADMIN / OWNER
========================================= */

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("user", "_id name email")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
};