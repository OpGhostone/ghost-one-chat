const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        required: true,
        type: String
    },
    hashPassword: {
        required: true,
        type: String
    },
    description: {
        required: false,
        type: String
    }
})

const UserModel = mongoose.model('User', userSchema)

module.exports = UserModel