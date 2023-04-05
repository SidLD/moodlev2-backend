
const express = require("express");
const app = express();

const verifyToken = require("../Utilities/VerifyToken");

const {
  register,
  login,
  updateUser,
  deleteUser,
  getUser,

  approveUser,
  getNotifications,
  rejectAllUsers,
  approveAllUser
} = require("../controllers/userController");

app.post("/register", verifyToken, register);
app.post("/login", verifyToken, login);
app.get("/user", verifyToken, getUser);
app.put("/user", verifyToken, updateUser);
app.delete("/user", verifyToken, deleteUser);
app.post("/approveUser", verifyToken, approveUser)

app.put("/getNotifications", verifyToken, getNotifications);
app.delete("/rejectAllUsers", verifyToken, rejectAllUsers);
app.post("/approveAllUser", verifyToken, approveAllUser)

module.exports = app;
