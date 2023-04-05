const express = require("express");
const app = express();

const verifyToken = require("../Utilities/VerifyToken");

const {
  getRecord,
  updateRecord,
  deleteRecord,
} = require("../controllers/recordController");


app.get("/record", verifyToken, getRecord);
app.put("/record", verifyToken, updateRecord);
app.delete("/record", verifyToken, deleteRecord);

module.exports = app;
