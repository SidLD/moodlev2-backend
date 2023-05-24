const mongoose = require("mongoose");
const Exam = require("../schemas/examSchema");
const userSchema = require("../schemas/userSchema");
const { ObjectId } = mongoose.Types;

const updateRecentAccess = async(userId,examId) => {
  const user = await userSchema.findById(userId)
  let recentAccess = user.recentAccess
 try {
  if(recentAccess != undefined){
    if(!(recentAccess[0] == examId)){
      for (let index = recentAccess.length-1; index > 0; index--) {
        recentAccess[index] = recentAccess[index-1];
      }
      recentAccess[0] = ObjectId(examId)
      if(user.recentAccess >= 6){
        recentAccess.shift()
       }
    }
  }else{
    recentAccess = [(ObjectId(examId))]
  }

  console.log(user)
  user.recentAccess = recentAccess;
  await user.save();
 } catch (error) {
  console.log(error)
 }
}

const attemptExamination = async (examId) => {
  try {
    const res = await Exam.aggregate([
      {
        $match: {
          _id: ObjectId(examId),
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
        },
      },
      {
        $lookup: {
          from: "questions",
          localField: "questions",
          foreignField: "_id",
          as: "questions",
        },
      },
      {
        $project: {
          "category._id": 1,
          "category.name": 1,
          "questions.question": 1,
          "questions.choices": 1,
          "questions.type": 1,
          dateTimeStart: 1,
          dateTimeEnd: 1,
          duration: 1,
          itemNumber: 1,
          title: 1,
          description: 1,
        },
      },
    ]);

    return res;
  } catch (error) {
    console.log("ERR: ", error);
  }
};

exports.attemptExamination = attemptExamination;
exports.updateRecentAccess = updateRecentAccess;
