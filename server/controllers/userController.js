import mongoose from "mongoose";
import User from "../models/User.js";

/*
  GET ALL USERS

  GET /api/users
*/

export const getUsers = async (req, res) => {
  try {

    const users = await User.find({})
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });

  } catch (error) {

    console.error(
      "Get users error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
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

    /*
      Validate MongoDB ObjectId
    */

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    /*
      Prevent admin from deleting
      the currently logged-in admin.
    */

    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete your own admin account",
      });
    }

    /*
      Find user first
    */

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /*
      Delete user
    */

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {

    console.error(
      "Delete user error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};