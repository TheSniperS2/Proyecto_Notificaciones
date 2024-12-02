const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Conexión a la base de datos de MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/notificaciones', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Modelo de notificación
const notificationSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  message: String,
  user: String,
  isGlobal: { type: Boolean, default: false },
});

const Notification = mongoose.model('Notification', notificationSchema);

// Almacena los usuarios conectados y sus IDs de socket
const users = new Map(); // Usamos un Map para manejar mejor la conexión y desconexión

// Función para enviar notificaciones aleatorias
function sendRandomNotification() {
  const isGlobal = Math.random() > 0.5;
  const message = isGlobal
    ? 'Mensaje global para todos los usuarios.'
    : `Notificación privada para un usuario.` ;

  console.log(`Enviando notificación: ${message}`);

  const userId = isGlobal ? 'Todos' : Array.from(users.keys())[Math.floor(Math.random() * users.size)]; // Selecciona un usuario al azar

  // Guardar la notificación en la base de datos
  const newNotification = new Notification({
    message,
    user: isGlobal ? 'Todos' : userId, // Asigna el userId si no es global
    isGlobal,
  });

  newNotification.save()
    .then(() => console.log('Notificación guardada en la base de datos'))
    .catch((err) => console.error('Error al guardar la notificación:', err));

  // Enviar la notificación a todos los usuarios conectados si es global
  if (isGlobal) {
    io.emit('receiveNotification', { message });
  } else if (userId && users.has(userId)) {
    // Enviar notificación privada al usuario específico
    io.to(users.get(userId)).emit('receiveNotification', { message });
  }
}

// Manejo de conexiones de Socket.IO
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Enviar notificaciones guardadas a un nuevo usuario que se conecta
  Notification.find().then((notifications) => {
    notifications.forEach((notification) => {
      if (notification.isGlobal) {
        io.to(socket.id).emit('receiveNotification', { message: notification.message });
      }
    });
  });

  socket.on('connectUser', (userId) => {
    // Agregar al usuario a la lista de usuarios conectados
    users.set(userId, socket.id);
    console.log(`Usuario ${userId} conectado con socket ID: ${socket.id}`);
  });

  socket.on('disconnect', () => {
    // Buscar y eliminar al usuario que se ha desconectado
    for (let [userId, socketId] of users.entries()) {
      if (socketId === socket.id) {
        users.delete(userId);
        console.log(`Usuario ${userId} desconectado.`);

        // Emitir un evento de desconexión a todos los clientes para cerrar la campana
        io.emit('userDisconnected', { userId });

        break; // Terminamos el bucle, ya que solo puede haber un usuario por socket
      }
    }
  });
});

// Iniciar el servidor y enviar notificaciones aleatorias
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Enviar notificaciones aleatorias cada 10 segundos
setInterval(sendRandomNotification, 10000);
