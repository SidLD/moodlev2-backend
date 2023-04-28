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
 try {
  Record.where({ student: ObjectId(req.query.studentId), isComplete: true})
  .populate({
    path: "student",
    select: "_id firstName lastName schoolId",
  })
  .populate({
    path: "timeEnd score",
  })
  .exec(async (err, data) => {
    try {
      
    if(err){
      res.status(500).send({message: "Something Went Wrong", err: err})  
    }else{
    let testData = [];
    if(data.length < 2){
      return res.status(200).send({message: "Forecast requires atleast more than 1 time data"})  
    }
    else{
      const passingPercentage = 4;

      let total = 0;
      let scores = [];
      data.forEach(d => {
        testData.push({
          date: d.timeEnd,
          score:d.score
        })
        scores.push(d.score)
        total += d.score;
      });
      const average = total / data.length;
      let result = await getForecast(testData);
      const passingScores = scores.filter(score => score >= passingPercentage);
      const passingResult = (passingScores.length / scores.length) * 100; 
        const d = {
          student: {
            firstName: data[0].student.firstName,
            lastName: data[0].student.lastName,
            schoolId: data[0].student.schoolId
          },
          forecast: result,
          passingRate: passingResult
        }
       return res.status(200).send({message: "Success", data: d})  
      }
    }
    } catch (error) {
      return res.status(500).send({message: "Error", err: error})
    }
  })
 } catch (error) {
   return res.status(500).send({message: "Error", err: error})
 }    
}

const getPassingRate =  async (req,res) => {
  try {
    
  } catch (error) {
    return res.status(500).send({message: "Error", err: error})
  }  
}

exports.forecast = forecast;
