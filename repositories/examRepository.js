const mongoose = require("mongoose");
const Exam = require("../schemas/examSchema");
const userSchema = require("../schemas/userSchema");
const { ObjectId } = mongoose.Types;

const ifExamExist = async (data, exam) => {
  let i;
  let ret = -1
  for (i = 0; i < data.length; i++) {
    if (data[i].toString() == exam) {
      ret = i;
    }
  }
  return ret
}
const updateRecentAccess = async(userId,examId) => {
  const user = await userSchema.findById(userId)
  let recentAccess = user.recentAccess
 try {
  if(recentAccess != undefined || recentAccess != null){
    
    const indexKunNaExist = await ifExamExist(recentAccess, examId)
    if(indexKunNaExist > -1){
      recentAccess.splice(indexKunNaExist, 1)
    }
    
    recentAccess.push(recentAccess[recentAccess.length-1])
    
    for (let index = recentAccess.length-1; index > 0; index--) {
       recentAccess[index] = recentAccess[index-1];
    }
    recentAccess[0] = ObjectId(examId)

    // recentAccess.splice(1,5);
    if(recentAccess.length > 5){
      recentAccess.splice(5,1);
    }
  }else{
    recentAccess = [(ObjectId(examId))]
  }
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
