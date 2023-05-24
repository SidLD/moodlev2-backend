const recordSchema = require("../schemas/recordSchema");

const fetchStudentRecords = async (year) => {
  try {
    let min = new Date();
    min.setFullYear(year)
    min.setMonth(0)
    let max = new Date();
    max.setFullYear(year)
    max.setMonth(11)
    const records = await recordSchema.aggregate([
      { 
        $match: { 
          createdAt: { $gte: min, $lte: max } 
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: {
          path: "$student",
        },
      },
      {
        $lookup: {
          from: "exams",
          localField: "exam",
          foreignField: "_id",
          as: "exam",
        },
      },
      {
        $unwind: {
          path: "$exam",
        },
      }
    ]);

    return records;
  } catch (error) {
    console.log("FETCH ERR: ", error);
  }
}

exports.fetchStudentRecords = fetchStudentRecords;