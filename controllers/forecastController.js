const express = require('express');
const {
  getForecast
  } = require("../Utilities/Forecast");

const mongoose = require("mongoose");
const Record = require("../schemas/recordSchema");
const { ObjectId } = mongoose.Types;
/**
 * An params id didi is '_id'.
 */


const forecast =  async (req,res) => {
  Record.where({ student: ObjectId(req.query.studentId), isComplete: true})
  .populate({
    path: "student",
    select: "_id firstName lastName",
  })
  .populate({
    path: "timeEnd score",
  })
  .exec(async (err, data) => {
    if(err){
      res.status(500).send({message: "Something Went Wrong", err: err})  
    }else{
        
    let testData = [];

    if(data.length < 2){
      res.status(200).send({message: "Forecast requires atleast more than 1 time data", data: data[0].student})  
    }
    else{
      data.forEach(d => {
        testData.push({
          date: d.timeEnd,
          score:d.score
        })
      });
  
      let result = await getForecast(testData);
      
      res.status(200).send({message: "Success", data: data})  
      }
    }
  })
    
}
exports.forecast = forecast;
