const mongoose = require('mongoose');

//student status is pending or approved
const examSchema = mongoose.Schema({
    collection_id:{
        type: String
    },
    dateTimeStart:{
        type: Date
    },
    dateTimeEnd:{
        type: Date
    },
    Duration:{
        type: String
    },
    itemNumber:{
        type: Number
    },
    student_id: {
        type: String
    }

}, {
    timeStampt: true}
)

module.exports = mongoose.model("Exam", examSchema);