const mongoose = require("mongoose");

const logSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    detail: String,
    image: { 
      data: Buffer, 
      contentType: String 
    },
  },
  { timestamps: true }
);
const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  log: [logSchema],
});

module.exports = mongoose.model("Category", categorySchema);
