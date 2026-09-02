import User from "../models/User.js";
import MenuItem from "../models/MenuItem.js";
import Order from "../models/Order.js";

/*
  GET /api/admin/dashboard
*/

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalMenuItems,
      totalUsers,
      totalOrders,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      MenuItem.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$total" },
          },
        },
      ]),
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "_id name email")
        .lean(),
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].total
        : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalMenuItems,
        totalUsers,
        totalOrders,
        totalRevenue,
        recentOrders,
      },
    });

  } catch (error) {
    console.error(
      "Dashboard stats error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics",
    });
  }
};