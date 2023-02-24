const mongoose = require('mongoose');

//student status is pending or approved
const recordSchema = mongoose.Schema({
    exam:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam'
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    timeStart:{
        type: Date
    },
    timeEnd:{
        type: Date
    },
    score:{
        type: Number
    }
}, {
    timeStampt: true}
)

module.exports = mongoose.model("Record", recordSchema);