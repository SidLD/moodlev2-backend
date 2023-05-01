const Exam = require("../schemas/examSchema");
const Record = require("../schemas/recordSchema");
const Question = require("../schemas/questionSchema");
const mongoose = require("mongoose");
const { attemptExamination } = require("../repositories/examRepository");
const userSchema = require("../schemas/userSchema");

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
        select: "firstName lastName",
      })
      .populate({
        path: "category",
        select: "name _id",
      })
      .exec(async (err, data) => {
        if (err) {
          res.status(400).send({ message: "Error", err: err.message });
          return;
        } else {
          // data.forEach(d => {
          //   data.questions = undefined
          // })

          res.status(200).send({ message: "Success", data: data });
          return;
        }
      });
    // } else {
    //   let record = await Record.findOne({
    //     exam: mongoose.Types.ObjectId(params.exam),
    //     student: mongoose.Types.ObjectId(req.user.id),
    //     isComplete: false,
    //   });
    //   let exam = await Exam.findOne({
    //     _id: mongoose.Types.ObjectId(params.exam),
    //   })
    //     .populate({
    //       path: "category",
    //       select: "_id name",
    //     })
    //     .select([
    //       "dateTimeStart",
    //       "dateTimeEnd",
    //       "duration",
    //       "itemNumber",
    //       "category",
    //       "title",
    //       "description",
    //     ]);
    //   let isContinue = false;
    //   if (record) {
    //     isContinue = record.isContinue;
    //   }
    //   if (exam !== null) {
    //     const today = new Date();
    //     const examStartDate = new Date(exam.dateTimeStart);
    //     const examEndDate = new Date(exam.dateTimeEnd);
    //     if (examStartDate < today && examEndDate > today) {
    //       if (record) {
    //         if (today - examEndDate < duration) {
    //           res.status(401).send({
    //             message: "Exam is Closed",
    //             isContinue: false,
    //             exam: exam,
    //           });
    //         } else {
    //           res.status(200).send({
    //             message: " Success",
    //             isContinue: isContinue,
    //             exam: exam,
    //           });
    //         }
    //       } else {
    //         res.status(200).send({
    //           message: " Success",
    //           isContinue: isContinue,
    //           exam: exam,
    //         });
    //       }
    //     } else {
    //       res.status(401).send({
    //         message: "Exam is Closed",
    //         isContinue: isContinue,
    //         exam: exam,
    //       });
    //     }
    //   } else {
    //     res.status(404).send({ message: "Exam not Found" });
    //   }
    // }
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
        itemNumber: params.itemNumber,
        title: params.title,
        password: params.password,
      }
      const examData = await Exam.updateOne(
      { _id: params.exam},
      { $set: dataToUpdate },
      { upsert: true }
      )
      res.status(200).send({message: "Success", data: examData})
      // await Exam.findOne({ _id: mongoose.Types.ObjectId(params.exam) }).then(
      //   async (exam) => {
      //     const doChangeDateTimeStart =
      //       params.dateTimeStart === undefined ? "" : "Modified Date Start, ";
      //     const doChangeDateTimeEnd =
      //       params.dateTimeEnd === undefined ? "" : "Modified End, ";
      //     const doChangeCategory =
      //       params.category === undefined ? "" : "Modified Category, ";
      //     const doChangeDuration =
      //       params.duration === undefined ? "" : "Modified Duration, ";
      //     const doChangeItemNumber =
      //       params.itemNumber === undefined ? "" : "Modified Item number, ";

      //     exam.dateTimeStart =
      //       doChangeDateTimeStart === ""
      //         ? new Date(exam.dateTimeStart)
      //         : new Date(params.dateTimeStart);
      //     exam.dateTimeEnd =
      //       doChangeDateTimeEnd === ""
      //         ? new Date(exam.dateTimeEnd)
      //         : new Date(params.dateTimeEnd);
      //     exam.duration =
      //       doChangeDuration === "" ? exam.duration : params.duration;
      //     exam.itemNumber =
      //       doChangeItemNumber === "" ? exam.itemNumber : params.itemNumber;
      //     exam.category =
      //       doChangeCategory === ""
      //         ? mongoose.Types.ObjectId(exam.category)
      //         : mongoose.Types.ObjectId(params.category);

      //     if (exam.dateTimeStart > exam.dateTimeEnd) {
      //       res.status(400).send({ message: "Invalid Time" });
      //       return;
      //     }
      //     exam.log.push({
      //       user: mongoose.Types.ObjectId(req.user.id),
      //       detail:
      //         doChangeDateTimeStart +
      //         doChangeDateTimeEnd +
      //         doChangeCategory +
      //         doChangeDuration +
      //         doChangeItemNumber,
      //     });
      //     await exam.save(async (err, data) => {
      //       if (err) {
      //         console.log("ERR? ", err);
      //         res.status(400).send({ message: "Error", error: err.message });
      //         return;
      //       } else {
      //         res.status(200).send({ message: "Success", data: data });
      //         return;
      //       }
      //     });
      //   }
      // );
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
          //Mag attemp ngae siya igCheck anay an date
          //Kun mayda record an user pati exam, dapat igContinue la iton

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
            let record = await Record.findById(mongoose.Types.ObjectId(params.record))
            if (record == null) {
              record = new Record({
                exam: mongoose.Types.ObjectId(params.exam),
                student: mongoose.Types.ObjectId(req.user.id),
                timeStart: today,
              });
              isContinue = false;
              await record.save();
            }
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
    Record.findById(mongoose.Types.ObjectId(params.record))
      .populate({
        path: "exam",
        populate: {
          path: "questions",
        },
      })
      .populate("student")
      .populate("answers.question")
      .exec(async (err, data) => {
        if (err) {
          res.status(400).send({ message: "Error", error: err.message });
          return;
        } else if (!data) {
          res.status(400).send({ message: "Error", error: "Data not found" });
          return;
        } else {
          const questions = data.exam.questions;
          const answers = data.answers;
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
          data.score = score;
          data.answers = answers;
          data.isComplete = true;
          data.timeEnd = Date.now();
          await data.save();
          data.exam.questions = undefined;
          data.exam.log = undefined;
          data.student.log = undefined;
          data.student.password = undefined;
          data.student.schoolId = undefined;
          data.student.createdAt = undefined;
          data.student.updatedAt = undefined;
          res.status(200).send({ message: "Success", data: data });
          return;
        }
      });
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};

const fetchExamProgress = async (req, res) => {
  try {
    const { examId } = req.query;
    let students = [];
    let checker = false;
    const noRecord = await userSchema.find({
      role: "student",
      status: "approved",
    });
    if (noRecord && noRecord.length > 0) {
      noRecord.map((rec) => students.push(rec._id));
    } else {
      return res.status(400).send({ message: "No user found" });
    }
    const examData = await attemptExamination(examId);
    if (examData && examData.length > 0) {
      const recordList = await Record.find(
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
          checker = true;
        } else {
          checker = false;
        }
      } else {
        checker = false;
      }
      res.status(200).send({ message: "Success", isTakenByAll: checker });
      return;
    }
  } catch (error) {
    res
      .status(400)
      .send({ message: "Something went wrong", err: error.message });
    return;
  }
};

exports.createExam = createExam;
exports.getExams = getExams;
exports.updateExam = updateExam;
exports.deleteExam = deleteExam;
exports.attemptExam = attemptExam;
exports.submitExam = submitExam;
exports.fetchExamProgress = fetchExamProgress;
