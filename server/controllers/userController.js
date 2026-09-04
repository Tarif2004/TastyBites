import mongoose from "mongoose";
import User from "../models/User.js";

/*
  GET ALL USERS
  GET /api/users
*/
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id name email phone role adminStatus aadhaarNumber createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/*
  GET PENDING ADMIN APPLICATIONS (OWNER ONLY)
  GET /api/users/pending-admins
*/
export const getPendingAdmins = async (req, res) => {
  try {
    const pendingAdmins = await User.find({
      role: "admin",
      adminStatus: "pending",
    })
      .select("_id name email phone aadhaarNumber adminStatus createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: pendingAdmins.length,
      pendingAdmins,
    });
  } catch (error) {
    console.error("Get pending admins error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending admin applications",
    });
  }
};

/*
  VERIFY / APPROVE ADMIN APPLICATION (OWNER ONLY)
  PATCH /api/users/verify-admin/:id
*/
export const verifyAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "approved" or "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'approved' or 'rejected'",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID",
      });
    }

    const adminUser = await User.findById(id);

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: "Admin application not found",
      });
    }

    adminUser.adminStatus = status;
    await adminUser.save();

    return res.status(200).json({
      success: true,
      message: `Admin application has been ${status}`,
      admin: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        adminStatus: adminUser.adminStatus,
      },
    });
  } catch (error) {
    console.error("Verify admin error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update admin verification status",
    });
  }
};

/*
  DELETE USER
  DELETE /api/users/:id
*/
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};