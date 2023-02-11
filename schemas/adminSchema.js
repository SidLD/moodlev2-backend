const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
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
    }
}, {
    timeStampt: true}
)

module.exports = mongoose.model("Admin", adminSchema);