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
  triggerReviewDuration,
  recentAccess
} = require("../controllers/examControllers");

app.post("/exam", verifyToken, createExam);
app.get("/exam", verifyToken, getExams);
app.get("/recentAccess", verifyToken, recentAccess);
app.put("/exam", verifyToken, updateExam);
app.delete("/exam", verifyToken, deleteExam);
app.post("/exam/attempt", verifyToken, attemptExam);
app.post("/exam/submit", verifyToken, submitExam);
app.post("/triggerReviewDuration", verifyToken, triggerReviewDuration);

module.exports = app;
