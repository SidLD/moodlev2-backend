const mongoose = require('mongoose');

//student status is pending or approved
const examSchema = mongoose.Schema({
    collection_id:{
        type: String,
        required: true
    },
    dateTimeStart:{
        type: Date
    },
    dateTimeEnd:{
        type: Date
    },
    duration : {
        type: String
    },
    itemNumber:{
        type: Number
    },
    admin_id: {
        type: String
    }

}, {
    timeStampt: true}
)

module.exports = mongoose.model("Exam", examSchema);