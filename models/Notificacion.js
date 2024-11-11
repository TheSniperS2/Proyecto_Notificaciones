const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: String,
  event: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  extraData: Object
});

module.exports = mongoose.model('Notification', notificationSchema);
