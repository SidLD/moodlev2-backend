const express = require("express");
const app = express();

const verifyToken = require("../Utilities/VerifyToken");

const {
  createCategory,
  getCategory,
  deleteCategory,
  updateCategory
} = require("../controllers/categoryControllers");

app.post("/category", verifyToken, createCategory);
app.get("/category", verifyToken, getCategory);
app.put("/category", verifyToken, updateCategory);
app.delete("/category", verifyToken, deleteCategory);

module.exports = app;
