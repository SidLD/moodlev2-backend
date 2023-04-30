const Question = require("../schemas/questionSchema");
const Exam = require("../schemas/examSchema");
const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const createArrayOfQuestions = async (questions, exam) => {
  try {
    const data = await Question.create(questions);
    if (!data) {
      res.status(400).send({ message: "Error", error: err.message });
    } else {
      let examData = await Exam.findById(ObjectId(exam));
      console.log("nano an sulod: ", data, questions, exam);
      data.forEach((temp) => {
        examData.questions.push(ObjectId(temp._id));
      });
      let tamaNaNiedo = await examData.save();
      return tamaNaNiedo;
    }
  } catch (error) {
    return error.message;
  }
};
const updateArrayOfQuestions = async (questions, exam) => {
  try {
    let operations = questions.map(function (q) {
      return {
        updateOne: {
          filter: { _id: q.id },
          update: {
            $set: {
              question: q.question,
              type: q.type,
              answer: q.answer,
              choices: q.choices,
            },
          },
        },
      };
    });
    const result = await Question.bulkWrite(operations);
    return result;
  } catch (error) {
    return error.message;
  }
  // const data = await Question.up(questions);
  // if (!data) {
  //   res.status(400).send({ message: "Error", error: err.message });
  // } else {
  //   let examData = await Exam.findById(ObjectId(exam));
  //   data.forEach((temp) => {
  //     examData.questions.push(ObjectId(temp._id));
  //   });
  //   await examData.save(async (err, room) => {
  //     if (err) {
  //       res.status(400).send({ message: "Error", error: err.message });
  //     }
  //     {
  //       res.status(200).send({ message: "Success", data: data });
  //     }
  //   });
  // }
};

exports.createArrayOfQuestions = createArrayOfQuestions;
exports.updateArrayOfQuestions = updateArrayOfQuestions;
