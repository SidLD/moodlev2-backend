const mongoose = require('mongoose');

//student status is pending or approved
const recordSchema = mongoose.Schema({
    exam_id:{
        type: String
    },
    dateStart:{
        type: Date
    },
    dateEnd:{
        type: Date
    },
    student_id:{
        type: String
    },
    score:{
        type: Number
    },
    itemNumber:{
        type: Number
    }

}, {
    timeStampt: true}
)

module.exports = mongoose.model("Record", recordSchema);