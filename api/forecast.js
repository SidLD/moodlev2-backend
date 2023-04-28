const express = require("express");
const app = express();

const verifyToken = require("../Utilities/VerifyToken");

const {
  forecast, getPassingRate
} = require("../controllers/forecastController");

app.get("/forecast", forecast);
app.get("/getPassingRate", verifyToken, getPassingRate)

module.exports = app;
