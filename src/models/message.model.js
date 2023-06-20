const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    author: {
        required: true,
        type: String
    },
    date: {
        required: true,
        type: String
    },
    content: {
        required: true,
        type: String
    },
    connectionState: {
        required: false,
        type: String
    }
})

const MessageModel = mongoose.model('Message', messageSchema)

module.exports = MessageModel