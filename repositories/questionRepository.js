const questionSchema = require("../schemas/questionSchema");
const Exam = require("../schemas/examSchema");
const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const createArrayOfQuestions = async (questions, exam) => {
  const data = await questionSchema.create(questions);
  if (!data) {
    res.status(400).send({ message: "Error", error: err.message });
  } else {
    let examData = await Exam.findById(ObjectId(exam));
    data.forEach((temp) => {
      examData.questions.push(ObjectId(temp._id));
    });
    await examData.save(async (err, room) => {
      if (err) {
        return err.message;
      }
      {
        return data;
      }
    });
  }
};
const updateArrayOfQuestions = async (questions, exam) => {
  const data = await questionSchema.up(questions);
  if (!data) {
    res.status(400).send({ message: "Error", error: err.message });
  } else {
    let examData = await Exam.findById(ObjectId(exam));
    data.forEach((temp) => {
      examData.questions.push(ObjectId(temp._id));
    });
    await examData.save(async (err, room) => {
      if (err) {
        res.status(400).send({ message: "Error", error: err.message });
      }
      {
        res.status(200).send({ message: "Success", data: data });
      }
    });
  }
};

exports.createArrayOfQuestions = createArrayOfQuestions;
