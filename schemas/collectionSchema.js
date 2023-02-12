const mongoose = require('mongoose');

//student status is pending or approved
const collectionSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    }
}, {
    timeStampt: true}
)

module.exports = mongoose.model("Collection", collectionSchema);