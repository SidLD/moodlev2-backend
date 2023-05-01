
const mongoose = require("mongoose");

const Compare = require("../schemas/compareSchema");

const getCompareR = async (params) => {
    return await Compare.where(params)
    .populate({
      path: "exam",
      select: "title _id",
    })
    .populate({
      path: "user",
      select: "_id firstName lastName",
    })
    .exec().then( async (docs) => docs);
 
}



exports.getCompareR = getCompareR;
