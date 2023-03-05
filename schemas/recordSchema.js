const mongoose = require('mongoose');

//student status is pending or approved
const recordSchema = mongoose.Schema({
    exam:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true,
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    timeStart:{
        type: Date,
        required: true,
    },
    timeEnd:{
        type: Date,
    },
    isComplete: {
        type: Boolean,
        default: false
    },
    answers: [
        {
            question: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Question'
            },
            answer: String,
            isCorrect: Boolean
        }
    ],
    score:{
        type: Number,
    }
}, {
    timestamps: true}
)

module.exports = mongoose.model("Record", recordSchema);