const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    user: { type: String, required: true },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
