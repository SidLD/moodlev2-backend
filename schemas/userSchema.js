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
    schoolId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true
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
      enum: ["pending", "approved", "rejected"],
    },
    log: [logSchema],
    recentAccess: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
      }
    ]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
