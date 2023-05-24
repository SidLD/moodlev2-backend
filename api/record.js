const express = require("express");
const app = express();

const verifyToken = require("../Utilities/VerifyToken");

const {
  getRecord,
  updateRecord,
  deleteRecord,
  getCurrentRecord,
  forceStartExam,
  fetchExamPercentage,
} = require("../controllers/recordController");

app.get("/record", verifyToken, getRecord);
app.put("/record", verifyToken, updateRecord);
app.delete("/record", verifyToken, deleteRecord);
app.get("/currentRecord", verifyToken, getCurrentRecord);
app.post("/forceStartExam", verifyToken, forceStartExam);
app.get("/fetchExamPercentage", fetchExamPercentage);


module.exports = app;
