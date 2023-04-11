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

const questionSchema = mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
    },
    question: {
      type: String,
      required: true,
    },
    choices: [{
      chocie: String,
      grade: Number,
      feedback: String
    }],
    log: [logSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Question", questionSchema);
