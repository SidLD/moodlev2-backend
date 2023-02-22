const mongoose = require('mongoose');
const category = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
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
}, 
)

module.exports = mongoose.model("category", category);