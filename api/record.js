const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

const verifyToken = require("../Utilities/VerifyToken");
const Exam = require("../schemas/examSchema");
const User = require("../schemas/userSchema");
const Record = require("../schemas/recordSchema");

const objectId = mongoose.Types.ObjectId;
//magamit didi _id para sa record._id
app.get("/record", verifyToken, async (req, res) => {
  const params = req.query;
  Record.where(params)
    .populate({
      path: "exam",
      select: "_id dateTimeStart dateTimeEnd duration itemNumer category",
      populate: {
        path: "category",
        select: "name _id",
      },
    })
    .populate({
      path: "student",
      select: "_id firstName lastName",
    })
    .populate({
      path: "answers.question",
    })
    .exec(async (err, data) => {
      //array of data
      try {
        if (req.user.role === "admin" || req.user.role === "superadmin") {
          res.status(200).send({ message: "Success", data: data });
        } else {
          data.forEach((record) => {
            //an records na
            let answers = record.answers;
            answers.forEach((room) => {
              if (room.answer === room.question.answer) {
                answers.isCorrect == true;
              } else {
                answers.isCorrect == false;
              }
              room.question.answer = undefined;
              room.question.choices = undefined;
            });
          });
          res.status(200).send({ message: "Success", data: data });
        }
      } catch (error) {
        res.status(400).send({ message: "Error", error: error.message });
      }
    });
});

//Pag add la ine san question/answers
app.put("/record", verifyToken, async (req, res) => {
  const params = req.body;
  try {
    let record = await Record.findOne({
      exam: objectId(params.exam),
      student: objectId(req.user.id),
    });
    if (record) {
      let ifExist = false;
      record.answers.forEach((recordAnswer) => {
        if (recordAnswer.question.equals(objectId(params.question))) {
          recordAnswer.answer = params.answer;
          ifExist = true;
        }
      });
      if (!ifExist) {
        record.answers.push({
          question: objectId(params.question),
          answer: params.answer,
        });
      }
      await record.save();
      res.status(201).send({ message: "Success" });
    } else {
      res.status(400).send({ message: "Record Not Found" });
    }
  } catch (error) {
    console.log("ERR: ", error);
  }
});

app.delete("/record", verifyToken, async (req, res) => {
  const params = req.body;
  let record = await Record.findOne({
    exam: objectId(params.exam),
    student: objectId(req.user.id),
  });
  if (record) {
    await record.deleteOne({ _id: objectId(record._id) });
    res.status(201).send({ message: "Success", record: record });
  } else {
    res.status(400).send({ message: "Record Not Found" });
  }
});
module.exports = app;
