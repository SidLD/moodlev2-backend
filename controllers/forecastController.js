const express = require('express');
const {
  getForecast
  } = require("../Utilities/Forecast");

/**
 * An params id didi is '_id'.
 */

const forecast =  async (req,res) => {
    let testData = [{
        date: "Sdsd",
        score:20
      },
      {
        date: "Sdsd",
        score:78
      },
      {
        date: "Sdsd",
        score:30
      },
      {
        date: "Sdsd",
        score:90
      },
      {
        date: "Sdsd",
        score:110
      }
    ];

    let data = getForecast(testData);
    
    res.status(200).send({message: "Success", data: data})

    
}
exports.forecast = forecast;
