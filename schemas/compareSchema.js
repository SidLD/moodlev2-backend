const mongoose = require("mongoose");

const compareSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    forecast: Number,
    boardExamResult: Number,
    exam:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true,
    },

  },
  { timestamps: true }
);
module.exports = mongoose.model("Compare", compareSchema);
