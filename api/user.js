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
  approveAllUser,
  fetchAllStudents,
  changePassword,
} = require("../controllers/userController");

app.post("/register", register);
app.post("/login", login);
app.get("/user", verifyToken, getUser);
app.put("/user", verifyToken, updateUser);
app.delete("/user", verifyToken, deleteUser);
app.put("/approveUser", verifyToken, approveUser);

app.get("/notifications", verifyToken, getNotifications);
app.delete("/rejectAllUsers", verifyToken, rejectAllUsers);
app.put("/approveAllUsers", verifyToken, approveAllUser);
app.get("/fetchAllStudents", verifyToken, fetchAllStudents);
app.post("/changePassword", changePassword)

module.exports = app;
