const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
    exam:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam'
    },
    question: {
        type: String,
        required: true
    },
    type:{
        type: String,
        enum: ["MultipleChoice", "FillInTheBlank", "TrueOrFalse"]
    },
    answer:{
        type: String
    },
    choices: [String],
    log: [
        {
            user:{
                type: mongoose.Schema.Types.ObjectId,
                ref:'User'
            },
            detail: String,
            createdAt: {
                type: Date,
                default: Date.now()
            }
        }
    ]
}, {
    timestamps: true}
)

module.exports = mongoose.model("Question", questionSchema);