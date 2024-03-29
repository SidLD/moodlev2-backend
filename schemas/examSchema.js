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
    title: {
      type: String,
      required: true,
    },
    isReviewTrigger:{
      default: false
    },
    description: {
      type: String,
    },
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
    reviewDuration:{
      type: Number
    },
    password: {
      type: String,
    },
    attempts: {
      type: Number,
      default: 2,
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
    isTriggerReviewDuration:{
      type: Boolean,
      default: false
    },
    forceTakeExamStudents:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    log: [logSchema],
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Exam", examSchema);