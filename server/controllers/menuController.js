import mongoose from "mongoose";
import MenuItem from "../models/MenuItem.js";

/* =========================================
   GET ALL MENU ITEMS
   GET /api/menu
========================================= */

export const getMenuItems = async (req, res) => {
  try {
    const {
      category,
      search,
      available,
    } = req.query;

    const filter = {};

    /* Category filter */

    if (category) {
      filter.category = category;
    }

    /* Availability filter */

    if (available !== undefined) {
      filter.availability = available === "true";
    }

    /* Search */

    if (search?.trim()) {
      filter.$text = {
        $search: search.trim(),
      };
    }

    const menuItems = await MenuItem.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: menuItems.length,
      menuItems,
    });

  } catch (error) {
    console.error(
      "Get menu error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu items",
    });
  }
};

/* =========================================
   GET SINGLE MENU ITEM
   GET /api/menu/:id
========================================= */

export const getMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const menuItem = await MenuItem.findById(id).lean();

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    return res.status(200).json({
      success: true,
      menuItem,
    });

  } catch (error) {
    console.error(
      "Get menu item error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu item",
    });
  }
};

/* =========================================
   CREATE MENU ITEM
   POST /api/menu
========================================= */

export const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      availability,
      image,
    } = req.body;

    /* Required fields */

    if (
      !name ||
      !description ||
      !category ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, description, category and price are required",
      });
    }

    /* Validate price */

    const numericPrice = Number(price);

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number",
      });
    }

    /* Create */

    const menuItem = await MenuItem.create({
      name: name.trim(),
      description: description.trim(),
      category,
      price: numericPrice,
      availability:
        availability === undefined
          ? true
          : Boolean(availability),
      image: image?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      menuItem,
    });

  } catch (error) {
    console.error(
      "Create menu error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create menu item",
    });
  }
};

/* =========================================
   UPDATE MENU ITEM
   PUT /api/menu/:id
========================================= */

export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const allowedFields = [
      "name",
      "description",
      "category",
      "price",
      "availability",
      "image",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    /* Nothing to update */

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided",
      });
    }

    /* Validate price */

    if (updates.price !== undefined) {
      updates.price = Number(updates.price);

      if (
        Number.isNaN(updates.price) ||
        updates.price < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid positive number",
        });
      }
    }

    /* Trim strings */

    if (updates.name) {
      updates.name = updates.name.trim();
    }

    if (updates.description) {
      updates.description =
        updates.description.trim();
    }

    if (updates.image) {
      updates.image = updates.image.trim();
    }

    const menuItem =
      await MenuItem.findByIdAndUpdate(
        id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      ).lean();

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      menuItem,
    });

  } catch (error) {
    console.error(
      "Update menu error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update menu item",
    });
  }
};

/* =========================================
   DELETE MENU ITEM
   DELETE /api/menu/:id
========================================= */

export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item ID",
      });
    }

    const deletedItem =
      await MenuItem.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete menu error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete menu item",
    });
  }
};