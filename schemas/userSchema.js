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
      lowercase: true,
      min:10,
      validate: {
        validator: function(v) {
            return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: "Please enter a valid email"
      },
      required: [true, "Email required"]
    },
    gender: {
      type: Boolean
    },
    age:{
      type: Number,
      min:1,
      max:100,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      index: true,
      enum: ["admin", "student", "superadmin"],
    },
    status:{
        type: String,
        default: 'pending',
        trim: true,
        required: true,
        enum: ["pending", "approved"],
    },log: [
      {
          _id: mongoose.SchemaTypes.ObjectId,
          detail: String,
          createdAt: {
              type: Date,
              default: Date.now()
          }
      }
  ]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("user", userSchema);
