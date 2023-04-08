const recordSchema = require("../schemas/recordSchema");

const fetchStudentRecords = async () => {
  try {
    const records = await recordSchema.aggregate([
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