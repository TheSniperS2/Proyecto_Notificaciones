const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: String,          // ID del destinatario
  sender: String,           // ID del remitente
  message: String,          // Contenido del mensaje
  timestamp: { type: Date, default: Date.now }  // Fecha y hora del mensaje
});

module.exports = mongoose.model('Notification', notificationSchema);
