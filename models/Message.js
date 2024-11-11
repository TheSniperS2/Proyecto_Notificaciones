// models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ['chat', 'notification'], default: 'chat' },  // 'chat' o 'notification'
});

module.exports = mongoose.model('Message', messageSchema);
