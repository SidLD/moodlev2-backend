const Exam = require("../schemas/examSchema");
const Record = require("../schemas/recordSchema");
const Question = require("../schemas/questionSchema");
const mongoose = require("mongoose");
const { attemptExamination, updateRecentAccess} = require("../repositories/examRepository");
const userSchema = require("../schemas/userSchema");
const e = require("express");
const recordSchema = require("../schemas/recordSchema");

const { ObjectId } = mongoose.Types;
/**
 *     ****** Structure *****
    exam: id / _id
    dateTimeStart : Date
    dateTimeEnd : Date
    category : id
    duration : number
    itemNumber : number
    log: [{
            user: id,
            detail: String,
            createdAt: Date
    }]
 */

const createExam = async (req, res) => {
  const params = req.body;
  if (req.user.role === "admin" || req.user.role === "superadmin") {
    try {
      const {
        dateTimeStart,
        dateTimeEnd,
        category,
        duration,
        itemNumber,
        title,
        description,
        password,
        reviewDuration
      } = params;
      if (dateTimeStart > dateTimeEnd) {
        res.status(300).send({ message: "Invalid Time" });
        return;
      }
      const newExam = new Exam({
        title: title,
        description: description,
        dateTimeStart: new Date(dateTimeStart),
        dateTimeEnd: new Date(dateTimeEnd),
        duration: duration,
        reviewDuration: reviewDuration,
        itemNumber: itemNumber,
        password: password,
        category: mongoose.Types.ObjectId(category),
      });
      newExam.log.push({
        user: mongoose.Types.ObjectId(req.user.id),
        detail: "Created Exam",
      });
      await newExam.save(async (err, data) => {
        if (err) {
          res.status(401).send({ message: "Error", error: err.message });
          return;
        } else {
          res.status(200).send({ message: "Success", data: data });
          return;
        }
      });
    } catch (error) {
      res
        .status(300)
        .send({ message: "Something Went Wrong", error: error.message });
    }
  } else {
    res.status(401).send({ message: "Access Denied" });
    return;
  }
};

const getExams = async (req, res) => {
  const params = req.query;
  try {
    // if (req.user.role === "admin" || req.user.role === "superadmin") {
    Exam.where(params)
      .populate({
        path: "log.user",
        select: "firstName lastName updatedAt",
      })
      .populate({
        path: "category",
        select: "name _id",
      })
      .sort({"updatedAt": -1})
      .exec(async (err, data) => {
        if (err) {
          res.status(400).send({ message: "Error", err: err.message });
          return;
        } else {
          res.status(200).send({ message: "Success", data: data });
          return;
        }
      });
  } catch (error) {
    res.status(400).send({ message: "Error", error: error.message });
    return;
  }
};

const updateExam = async (req, res) => {
  const params = req.body;
  if (req.user.role === "admin" || req.user.role === "superadmin") {
    try {
      let dataToUpdate = {
        category: params.category,
        dateTimeEnd: params.dateTimeEnd,
        dateTimeStart: params.dateTimeStart,
        description: params.description,
        duration: params.duration,
        reviewDuration: params.reviewDuration,
        itemNumber: params.itemNumber,
        title: params.title,
        password: params.password,
      }
      const examData = await Exam.updateOne(
        { _id: params.exam},
        { $set: dataToUpdate },
        { upsert: true }
      )

      //Update didi an recent access
      await updateRecentAccess(req.user.id, params.exam)
      res.status(200).send({message: "Success", data: examData})
    } catch (error) {
      return res
        .status(400)
        .send({ message: "Something Went Wrong", error: error.message });
    }
  } else {
    res.status(401).send({ message: "Access Denied" });
    return;
  }
};

const deleteExam = async (req, res) => {
  const params = req.body;
  try {
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      await Exam.deleteOne({ _id: mongoose.Types.ObjectId(params.exam) })
        .then(async (data) => {
          await Record.deleteMany({exam: params.exam})
          return await Question.deleteMany({
            exam: mongoose.Types.ObjectId(params.exam),
          });
        })
        .then(async (doc) => {
          if (doc.deletedCount > 0) {
            res
              .status(200)
              .send({ message: "Success", deletedCount: doc.deletedCount });
            return;
          } else {
            res
              .status(400)
              .send({ message: "Error", deletedCount: doc.deletedCount });
            return;
          }
        })
        .catch((err) => {
          res.status(400).send({ message: "Error", error: err.message });
          return;
        });
    } else {
      res.status(401).send({ message: "Access Denied" });
      return;
    }
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};

const attemptExam = async (req, res) => {
  const params = req.body;
  try {
    Exam.findOne({ _id: params.exam })
      .populate({
        path: "questions",
        select: "question choices type",
      })
      .populate({
        path: "category",
        select: "_id name",
      })
      .select([
        "dateTimeStart",
        "dateTimeEnd",
        "duration",
        "itemNumber",
        "category",
        "title",
        "description",
        "password",
      ])
      .exec(async (err, data) => {
        if (err) {
          res.status(400).send({ message: "Error", error: err.message });
          return;
        } else if (data === null) {
          res.status(404).send({ message: "Exam not Found" });
          return;
        } else {
          let isContinue = true;
          const today = new Date();

          if (today < new Date(data.dateTimeStart)) {
            data.questions = undefined;
            return res.status(401).send({ message: "Exam is not open yet." });
          } else if (today > new Date(data.dateTimeEnd)) {
            data.questions = undefined;
            return res.status(401).send({ message: "Exam is closed." });
          } else {
            //Para ine kun continuing pa
            let record = await Record.where({
              exam:mongoose.Types.ObjectId(params.exam),
              student: mongoose.Types.ObjectId(req.user.id),
              isComplete:false
            })

            let message = ""
            if(record == null){
              message = "Attempt PreTest"
                record = new recordSchema({
                exam : ObjectId(data._id),
                student: ObjectId(req.user.id),
                isComplete: false,
                preTest: {
                  timeStart: new Date(),
                  isComplete: false
                }
              })
            }
            else if(record.PreTest.isComplete == false &&  record.Postest == null){
              message = "Continue PreTest"
              isContinue = true
            }
            else if(record.PreTest.isComplete && record.Postest == null){
              message = "Attempt Postest"
              record.postTest.timeStart = new Date()
              record.postTest.isComplete = false
            }
            else if(record.PreTest.isComplete && record.Postest.isComplete == false){
              message = "Continue PostTest"
            }
            else if(record.isComplete){
              message = "Exam is Closed"
            }
            await record.save()
            await updateRecentAccess(req.user.id, params.exam)
            res.status(200).send({
              message: "Success",
              exam: data,
              record: record,
              isContinue: isContinue,
            });
            return;
          }
        }
      });
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};

const submitExam = async (req, res) => {
  const params = req.body;
  try {
    Record.findById(mongoose.Types.ObjectId(params._id))
      .populate({
        path: "exam",
        populate: {
          path: "questions",
        },
      })
      .populate("student")
      .exec(async (err, data) => {
        if (err) {
          res.status(400).send({ message: "Error", error: err.message });
          return;
        } else if (!data) {
          res.status(400).send({ message: "Error", error: "Data not found" });
          return;
        } else {
         if(data.preTest.isComplete = false){
          const questions = data.exam.questions;
          const answers = data.preTest.answers;
          let score = 0;
          answers.forEach((answer) => {
            questions.forEach((question) => {
              if (answer.question && answer.question._id.equals(question._id)) {
                if (answer.answer === question.answer) {
                  answer.isCorrect === true;
                  score++;
                } else {
                  answer.isCorrect === false;
                }
              }
            });
          });
            data.preTest.score = score;
            data.preTest.answers = answers;
            data.preTest.isComplete = true;
            data.preTest.timeEnd = Date.now();
            await data.save();
         }else{
          const questions = data.exam.questions;
          const answers = data.postTest.answers;
          let score = 0;
          answers.forEach((answer) => {
            questions.forEach((question) => {
              if (answer.question && answer.question._id.equals(question._id)) {
                if (answer.answer === question.answer) {
                  answer.isCorrect === true;
                  score++;
                } else {
                  answer.isCorrect === false;
                }
              }
            });
          });
            data.postTest.score = score;
            data.postTest.answers = answers;
            data.postTest.isComplete = true;
            data.postTest.timeEnd = Date.now();
            await data.save();
         }
         
          data.exam.questions = undefined;
          data.exam.log = undefined;
          data.student.log = undefined;
          data.student.password = undefined;
          data.student.schoolId = undefined;
          data.student.createdAt = undefined;
          data.student.updatedAt = undefined;
          await updateRecentAccess(req.user.id, data.exam._id)
          
         
          return res.status(200).send({ message: "Success", data: data });
          
        }
      });
  } catch (error) {
    res.status(500).send({ message: "Error", err: error.message });
  }
};

const triggerReviewDuration = async (req, res) => {
  
  const params = req.body;
  try {
    const exam = Exam.findById(Object(params.examId))
    const reviewDuration = exam.reviewDuration
    const start = new Date(exam.dateTimeStart)
    const end = new Date(exam.dateTimeEnd)
    start.setDate(start.getDay + reviewDuration)
    end.setDate(end.getDay + reviewDuration)
    exam.start = start
    exam.end = end
    await exam.save(async (data, err) => {
      if(err){
        return res
          .status(400)
          .send({ message: "Something went wrong", err: err.message });
      }else{
        return res
        .status(200)
        .send({ message: "Success", data: data });
      }
    })
  } catch (error) {
    return res
      .status(400)
      .send({ message: "Something went wrong", err: error.message });
  
  }
};

const recentAccess = async (req, res) => {
  const user = userSchema.findById(req.user.id)
  return res.status(200).send({message:"OK", data: user.recentAccess})
};


exports.recentAccess = recentAccess
exports.createExam = createExam;
exports.getExams = getExams;
exports.updateExam = updateExam;
exports.deleteExam = deleteExam;
exports.attemptExam = attemptExam;
exports.submitExam = submitExam;
exports.triggerReviewDuration = triggerReviewDuration;
