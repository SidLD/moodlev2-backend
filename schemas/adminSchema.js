const mongoose = require("mongoose");

const adminSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      index: true,
      enum: ["admin", "student"],
    },
    status:{
        type: String,
        default: 'pending'
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Admin", adminSchema);
