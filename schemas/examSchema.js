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
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Category'
    }, 
    questions: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Question"
        }
    ],
    log: [
        {
            _id: mongoose.SchemaTypes.ObjectId,
            detail: String,
            createdAt: {
                type: Date,
                default: Date.now()
            }
        }
    ]

}, {
    timeStampt: true}
)

module.exports = mongoose.model("Exam", examSchema);