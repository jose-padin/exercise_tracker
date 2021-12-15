const mongoose = require('mongoose');

Exercise = mongoose.Schema({
    description: String,
    duration: Number,
    date: Date
})

userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    log: [
        Exercise
    ]
})

module.exports = mongoose.model('User', userSchema);