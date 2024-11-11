const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Notification = require('./models/Notificacion');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/notificaciones', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.log('Error al conectar a MongoDB:', err));

// Configuración del servidor
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Escuchar conexiones de clientes
io.on('connection', (socket) => {
  console.log('Usuario conectado');
  
  socket.on('sendNotification', async (data) => {
    const notification = new Notification({
      userId: data.userId,
      event: data.event,
      message: data.message,
      timestamp: new Date(),
      isRead: false,
      extraData: data.extraData
    });
    await notification.save();
    io.emit(`notification:${data.userId}`, notification);
  });
});

// Iniciar el servidor
server.listen(4000, () => {
  console.log('Servidor corriendo en http://localhost:4000');
});
