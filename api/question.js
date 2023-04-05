const express = require("express");
const app = express();

const verifyToken = require("../Utilities/VerifyToken");

const {
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion
} = require("../controllers/questionControllers");

app.post("/question", verifyToken, createQuestion);
app.get("/question", verifyToken, getQuestion);
app.put("/question", verifyToken, updateQuestion);
app.delete("/question", verifyToken, deleteQuestion);

module.exports = app;
