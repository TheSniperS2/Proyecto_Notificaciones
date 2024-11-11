const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Notification = require('./models/Notification');

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

// Almacenar usuarios conectados y sus sockets
let connectedUsers = {};

// Manejar la conexión de los clientes
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Evento cuando un usuario selecciona un nombre de usuario
  socket.on('join', (userId) => {
    connectedUsers[socket.id] = userId;
    console.log(`Usuario ${userId} conectado`);

    // Notificar a otros usuarios que alguien se ha conectado
    socket.broadcast.emit('userConnected', `${userId} se ha conectado`);
  });

  // Manejar la recepción de una notificación
  socket.on('sendNotification', async (data) => {
    const { recipients, message } = data;
    const timestamp = new Date();

    // Guardar la notificación en MongoDB para cada destinatario
    for (let recipient of recipients) {
      const notification = new Notification({
        userId: recipient,
        message: message,
        timestamp: timestamp
      });
      await notification.save();

      // Emitir la notificación a cada destinatario específico
      for (let [socketId, userId] of Object.entries(connectedUsers)) {
        if (recipients.includes(userId)) {
          io.to(socketId).emit('receiveNotification', notification);
        }
      }
    }
  });

  // Evento de desconexión de usuario
  socket.on('disconnect', () => {
    const userId = connectedUsers[socket.id];
    delete connectedUsers[socket.id];
    console.log(`Usuario ${userId} desconectado`);
    socket.broadcast.emit('userDisconnected', `${userId} se ha desconectado`);
  });
});

app.post('/sendNotification', (req, res) => {
  const { recipients, message } = req.body;
  io.emit('sendNotification', { recipients, message });
  res.sendStatus(200);
});

app.get('/notifications/:userId', async (req, res) => {
  const notifications = await Notification.find({ userId: req.params.userId }).limit(10).sort({ timestamp: -1 });
  res.json(notifications);
});


// Iniciar el servidor
server.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
