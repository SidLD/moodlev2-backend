const mongoose = require('mongoose');

//student status is pending or approved
const examSchema = mongoose.Schema({
    dateTimeStart:{
        type: Date
    },
    dateTimeEnd:{
        type: Date
    },
    duration : {
        type: Number
    },
    itemNumber:{
        type: Number,
        min: 1
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }, 
    questions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question'
        }
    ],
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

module.exports = mongoose.model("Exam", examSchema);