const express = require("express");
const app = express();

const verifyToken = require("../Utilities/VerifyToken");

const {
  forecast
} = require("../controllers/forecastController");

app.get("/forecast", forecast);

module.exports = app;
