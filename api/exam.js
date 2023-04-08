const express = require("express");
const app = express();

const verifyToken = require("../Utilities/VerifyToken");

const {
  createExam,
  getExams,
  updateExam,
  deleteExam,
  attemptExam,
  submitExam,
  fetchExamProgress,
} = require("../controllers/examControllers");

app.post("/exam", verifyToken, createExam);
app.get("/exam", verifyToken, getExams);
app.put("/exam", verifyToken, updateExam);
app.delete("/exam", verifyToken, deleteExam);
app.post("/exam/attempt", verifyToken, attemptExam);
app.post("/exam/submit", verifyToken, submitExam);
app.get("/fetchExamProgress", verifyToken, fetchExamProgress);

module.exports = app;
