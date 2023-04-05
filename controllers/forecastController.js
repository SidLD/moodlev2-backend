const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const Category = require("../schemas/categorySchema")

/**
 * An params id didi is '_id'.
 */

const forecast =  async (req,res) => {
    let testData = [89, 89.9 , 80, 83, 57, 52];

    
}
exports.forecast = forecast;
