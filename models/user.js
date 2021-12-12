const mongoose = require('mongoose');

userSchema = mongoose.Schema({
    id: {
        type: String
    },
    username: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('User', userSchema);