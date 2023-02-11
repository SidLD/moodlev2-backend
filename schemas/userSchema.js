const mongoose = require('mongoose');

//student status is pending or approved
const studentSchema = mongoose.Schema({
    username: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    gender: {
        type: Boolean
    },
    status:{
        type: String,
        default: 'pending'
    }
}, {
    timeStampt: true}
)

module.exports = mongoose.model("Student", studentSchema);