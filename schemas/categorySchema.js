const mongoose = require('mongoose');
const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
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
}, 
)

module.exports = mongoose.model("Category", categorySchema);