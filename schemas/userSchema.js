const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
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
      type: Boolean
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
        default: 'pending',
        trim: true,
        required: true,
        enum: ["pending", "approved"],
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("user", userSchema);
