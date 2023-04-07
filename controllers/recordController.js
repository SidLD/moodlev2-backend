const mongoose = require("mongoose");
const Record = require("../schemas/recordSchema");

const { ObjectId } = mongoose.Types;

//magamit didi _id para sa record._id
const getRecord = async (req, res) => {
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
};

//Pag add la ine san question/answers
const updateRecord = async (req, res) => {
  const params = req.body;
  try {
    let record = await Record.findOne({
      exam: ObjectId(params.exam),
      student: ObjectId(req.user.id),
    });
    if (record) {
      let ifExist = false;
      record.answers.forEach((recordAnswer) => {
        if (recordAnswer.question.equals(ObjectId(params.question))) {
          recordAnswer.answer = params.answer;
          ifExist = true;
        }
      });
      if (!ifExist) {
        record.answers.push({
          question: ObjectId(params.question),
          answer: params.answer,
        });
      }
      await record.save();
      res.status(201).send({ message: "Success", record: record });
    } else {
      res.status(400).send({ message: "Record Not Found" });
    }
  } catch (error) {
    console.log("ERR: ", error);
  }
};

const deleteRecord = async (req, res) => {
  const params = req.body;
  let record = await Record.findOne({
    exam: ObjectId(params.exam),
    student: ObjectId(req.user.id),
  });
  if (record) {
    await record.deleteOne({ _id: ObjectId(record._id) });
    res.status(201).send({ message: "Success", record: record });
  } else {
    res.status(400).send({ message: "Record Not Found" });
  }
};

const getCurrentRecord = async (req, res) => {
  try {
    const params = req.query;

    let data = await Record.findOne({
      exam: ObjectId(params.exam),
      student: ObjectId(req.user.id),
    });
    res.status(200).send({ message: "Success", data: data });
  } catch (error) {
    res.status(400).send({ message: "Error", error: error.message });
  }
};

exports.getRecord = getRecord;
exports.deleteRecord = deleteRecord;
exports.updateRecord = updateRecord;
exports.getCurrentRecord = getCurrentRecord;
