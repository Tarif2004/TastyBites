import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    availability: {
      type: Boolean,
      default: true,
      index: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
  Search optimization
*/
menuItemSchema.index({
  name: "text",
  description: "text",
});

const MenuItem = mongoose.model(
  "MenuItem",
  menuItemSchema
);

export default MenuItem;