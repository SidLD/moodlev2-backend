const mongoose = require("mongoose");
const Record = require("../schemas/recordSchema");
const userSchema = require("../schemas/userSchema");
const { attemptExamination, updateRecentAccess } = require("../repositories/examRepository");
const recordSchema = require("../schemas/recordSchema");
const examSchema = require("../schemas/examSchema");
const { ObjectId } = mongoose.Types;
//magamit didi _id para sa record._id
const getRecord = async (req, res) => {
  const params = req.query;
  try {
    Record.where({
      $expr: {
        $eq: [{ $year: "$createdAt" }, params.year]
      },
    })
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
            res.status(200).send({ message: "Success", data: data });
          });
          }
        } catch (error) {
          res.status(400).send({ message: "Error", error: error.message });
        }
      });
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};
//Pag add la ine san question/answers
const updateRecord = async (req, res) => {
  const params = req.body;
  console.log("sdasdsa")
  try {
    let record = await Record.findOne({
      exam: ObjectId(params.exam),
      student: ObjectId(req.user.id),
    });
    if (record) {
      if(record.preTest.isComplete == false){
        let ifExist = false;
        record.preTest.answers.forEach((recordAnswer) => {
          if (recordAnswer.question.equals(ObjectId(params.question))) {
            recordAnswer.answer = params.answer;
            ifExist = true;
          }
        });
        if (!ifExist) {
          record.preTest.answers.push({
            question: ObjectId(params.question),
            answer: params.answer,
          });
        }
      }else{
        let ifExist = false;
        record.postTest.answers.forEach((recordAnswer) => {
          if (recordAnswer.question.equals(ObjectId(params.question))) {
            recordAnswer.answer = params.answer;
            ifExist = true;
          }
        });
        if (!ifExist) {
          record.postTest.answers.push({
            question: ObjectId(params.question),
            answer: params.answer,
          });
        }
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
  try {
    let record = await Record.findOne({
      _id: params.recordId,
    });
    if (record) {
      await record.deleteOne({ _id: ObjectId(record._id) });
      res.status(201).send({ message: "Success", record: record });
    } else {
      res.status(400).send({ message: "Record Not Found" });
    }
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};
const getCurrentRecord = async (req, res) => {
  try {
    const params = req.query;
    let record = await Record.findOne({
      exam:mongoose.Types.ObjectId(params.exam),
      student: mongoose.Types.ObjectId(req.user.id),
    })
    let message = ""
    let isPreTest = null
    if(record == null || record == undefined){
      message = "Attempt PreTest"
      isPreTest = true
    }
    else if(!record.preTest.isComplete){
      message = "Continue PreTest"
      isContinue = true
      isPreTest = true 
    }
    else if(record.preTest.isComplete){
      const exam = await examSchema.findById(record.exam)
      if(exam.isTriggerReviewDuration == true){
        message = "Attempt Postest"
        isPreTest = false
      }else{
        message = "Review Duration"
        isPreTest = null
        console.log(message)
      }
     
    }
    else if(record.preTest.isComplete && record.postTest.isComplete == false){
      message = "Continue PostTest"
      isPreTest = false
    }
    else if(record.isComplete){
      message = "Exam is Close"
      record = null
      isPreTest = null
    }
    
    await updateRecentAccess(req.user.id, params.exam)
    res.status(200).send({ message: message, record: record, isPretest: isPreTest});
  } catch (error) {
    console.log(error)
    res.status(400).send({ message: "Error", error: error.message });
  }
};
const forceStartExam = async (req, res) => {
  try {
    const { examId } = req.body;
    const today = new Date();
    let payload = [];
    let students = [];
    const noRecord = await userSchema.find({
      role: "student",
      status: "approved",
    });
    if (noRecord && noRecord.length > 0) {
      noRecord.map((rec) => students.push(rec._id));
    } else {
      return res.status(400).send({ message: "No student found" });
    }
    const examData = await attemptExamination(examId);
    if (examData && examData.length > 0) {
      if (today < new Date(examData[0].dateTimeStart)) {
        return res.status(400).send({ message: "Exam is not open yet." });
      } else if (today > new Date(examData[0].dateTimeEnd)) {
        return res.status(400).send({ message: "Exam is closed." });
      } else {
        const recordList = await recordSchema.find(
          {
            student: {
              $in: students,
            },
            exam: examData[0]._id,
          },
          {
            _id: 0,
            student: 1,
          }
        );
        if (recordList && recordList.length > 0) {
          if (recordList.length === students.length) {
            students = [];
            payload = [];
            return res
              .status(200)
              .send({ message: "Exam is now started for all students" });
          } else {
            const filteredData = students.filter((e) => {
              return !recordList.some((f) => f.student.equals(e));
            });
            filteredData.forEach((e) => {
              payload.push({
                exam: examData[0]._id,
                student: e,
                timeStart: today,
              });
            });
          }
        } else {
          students.forEach((id) => {
            payload.push({
              exam: examData[0]._id,
              student: id,
              timeStart: today,
            });
          });
        }
        await recordSchema.insertMany(payload);
        students = [];
        payload = [];
        res
          .status(200)
          .send({ message: "Exam is now started for all students" });
      }
    } else {
      res.status(400).send({ message: "Exam not found" });
    }
  } catch (error) {
    res.status(400).send({ message: "Error", error: error.message });
  }
};
exports.getRecord = getRecord;
exports.deleteRecord = deleteRecord;
exports.updateRecord = updateRecord;
exports.getCurrentRecord = getCurrentRecord;
exports.forceStartExam = forceStartExam;
