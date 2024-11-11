const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./db');
const Notification = require('./models/Notification');

// Conectar a MongoDB usando la función connectDB de db.js
connectDB();

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
    connectedUsers[userId] = socket.id;
    console.log(`Usuario ${userId} conectado con el socket ID ${socket.id}`);
    socket.broadcast.emit('userStatus', `${userId} se ha conectado`);
  });

  // Manejar la recepción de un mensaje privado
  socket.on('sendMessage', async ({ sender, recipient, message }) => {
    const timestamp = new Date();

    // Crear y guardar el mensaje en la base de datos
    const notification = new Notification({
      userId: recipient,
      sender: sender,
      message: message,
      timestamp: timestamp
    });
    await notification.save();

    // Emitir el mensaje al destinatario si está conectado
    const recipientSocket = connectedUsers[recipient];
    if (recipientSocket) {
      io.to(recipientSocket).emit('receiveMessage', { sender, message, timestamp });
    }
    
    // Enviar el mensaje de vuelta al remitente para mostrar en su propia ventana de chat
    socket.emit('receiveMessage', { sender, message, timestamp });
  });

  // Manejar la desconexión
  socket.on('disconnect', () => {
    const userId = Object.keys(connectedUsers).find(key => connectedUsers[key] === socket.id);
    if (userId) {
      delete connectedUsers[userId];
      console.log(`Usuario ${userId} desconectado`);
      socket.broadcast.emit('userStatus', `${userId} se ha desconectado`);
    }
  });
});

// Rutas adicionales para cargar mensajes anteriores entre usuarios
app.get('/chatHistory/:userId/:recipientId', async (req, res) => {
  const { userId, recipientId } = req.params;
  const messages = await Notification.find({
    $or: [
      { userId: recipientId, sender: userId },
      { userId: userId, sender: recipientId }
    ]
  }).sort({ timestamp: 1 });
  res.json(messages);
});

// Iniciar el servidor en el puerto 3000
server.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
