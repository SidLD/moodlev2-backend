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
//student status is pending or approved
const examSchema = mongoose.Schema(
  {
    dateTimeStart: {
      type: Date,
    },
    dateTimeEnd: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    itemNumber: {
      type: Number,
      min: 1,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    log: [logSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Exam", examSchema);
