const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
    examId:String,
    question: {
        type: String,
        required: true
    },
    type:{
        type: String
    },
    answer:{
        type: String
    },
    choices: [String]
}, {
    timeStampt: true}
)

module.exports = mongoose.model("Question", questionSchema);