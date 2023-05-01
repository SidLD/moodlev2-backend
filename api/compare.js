const express = require("express");
const app = express();

const verifyToken = require("../Utilities/VerifyToken");

const {
  getCompareData,
  createCompare
} = require("../controllers/compareController");

app.post("/compare", verifyToken, createCompare);
app.get("/compare", verifyToken, getCompareData);

module.exports = app;
