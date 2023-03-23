const mongoose = require("mongoose");

const logSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    detail: String,
  },
  { timestamps: true }
);

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      require: true,
    },
    middleName: String,
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      min: 10,
      validate: {
        validator: function (v) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please enter a valid email",
      },
      required: [true, "Email required"],
    },
    gender: {
      type: String,
    },
    age: {
      type: Number,
      min: 1,
      max: 100,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      index: true,
      enum: ["admin", "student", "superadmin"],
    },
    status: {
      type: String,
      default: "pending",
      trim: true,
      required: true,
      enum: ["pending", "approved"],
    },
    log: [logSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
