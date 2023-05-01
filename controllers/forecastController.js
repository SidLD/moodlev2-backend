const express = require('express');
const {
  getForecast
  } = require("../Utilities/Forecast");

const User = require("../schemas/userSchema");
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
    const users = await User.find({role: "student", status: "approved"})
    let result = {
        passedStudent : [],
        failedStudent : []      
    }
    const passingPercentage = 75;
    let rates = []; 
     
    

    for(const user of users){
      const records = await Record.where({ student: ObjectId(user._id), isComplete: true})
      .populate({
        path: "student",
        select: "_id firstName lastName schoolId",
      })
      .populate({
        path: "timeEnd score",
      })
      .populate({
        path: "exam",
        select: "title _id itemNumber"
      })
      .exec().then( async (docs) => docs);
      let scores = []
      let testData = []  
      let record = []
      if(records.length > 1){
        records.forEach(d => {
          console.log(d)
          let total = 0
          try {
            total = d.exam.itemNumber
          } catch (error) {
            
          }
          scores.push((100 * d.score) / total)

          testData.push({
            date: d.timeEnd,
            score: ( d.score  / total ) * 100
          })

          record.push({
            exam: d.exam.title,
            rate:  ( d.score  / total ) * 100
          })
        })
      }


      const passingScores = scores.filter(score => score >= passingPercentage);
      const passingResult = (passingScores.length / scores.length) * 100; 

         try {
          let f = 0
          if(testData.length > 1){
            f = await getForecast(testData);
          }
          if(f.score > passingPercentage){
          
           result.passedStudent.push(
             {
               firstName: user.firstName,
               lastName: user.lastName,
               schoolId: user.schoolId,
               passingRate: passingResult,
               forecast: f,
               record: record
             }
           )
          rates.push(passingResult)
         }else if(f.score < passingPercentage){ 
           result.failedStudent.push(
             {
               firstName: user.firstName,
               lastName: user.lastName,
               schoolId: user.schoolId,
               passingRate: passingResult,
               forecast: f,
               
               record: record
             }
           )

           rates.push(passingResult)
         }
         } catch (error) {
            return res.status(400).send({message: "Error", err: error.message})
         }
    }
    let sum = 0
    rates.forEach(rating => {
      sum += rating
    })

    return res.status(200).send({message: "Success", data: result, rate: sum/rates.length })  
  } catch (error) {
    return res.status(400).send({message: "Error", err: error.message})
  }  
}

exports.getPassingRate = getPassingRate;
exports.forecast = forecast;
