const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Cambia esto si tu frontend está en otro puerto
    methods: ['GET', 'POST']
  }
});

// Configuración de Express
app.use(cors());
app.use(express.json());

// Conectar a la base de datos (MongoDB)
mongoose.connect('mongodb://127.0.0.1:27017/notificaciones', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Definir el modelo de Notificación
const Notification = mongoose.model('Notification', new mongoose.Schema({
  date: { type: Date, default: Date.now },
  message: String,
  user: String,
}));

const users = {};

// Función para enviar notificaciones aleatorias
function sendRandomNotification() {
  const userIds = Object.keys(users);
  if (userIds.length === 0) return;

  const randomIndex = Math.floor(Math.random() * userIds.length);
  const randomUser   = userIds[randomIndex];
  const isGlobal = Math.random() > 0.5;

  const message = isGlobal
    ? 'Mensaje global para todos los usuarios.'
    : `Notificación privada para ${randomUser }.`;

  if (isGlobal) {
    io.emit('receiveNotification', { message });
  } else {
    // Enviar notificación privada al usuario específico solo si está conectado
    if (users[randomUser ]) {
      io.to(users[randomUser ]).emit(`receiveNotification_${randomUser }`, { message });
      console.log(`Notificación enviada a ${randomUser }: ${message}`);
    } else {
      console.log(`El usuario ${randomUser } no está conectado. No se envía la notificación.`);
    }
  }
}

// Manejo de conexiones de Socket.IO
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('connectUser ', (userId) => {
    users[userId] = socket.id;
    console.log(`Usuario ${userId} conectado.`);
  });

  socket.on('disconnect', () => {
    const disconnectedUser  = Object.keys(users).find((key) => users[key] === socket.id);
    if (disconnectedUser ) {
      delete users[disconnectedUser ];
      console.log(`Usuario ${disconnectedUser } desconectado.`);
    }
  });

  socket.on('sendNotification', async (data) => {
    const notification = new Notification(data);
    await notification.save();
    io.emit('notification', data);
  });
});

const toggleConnection = () => {
    if (isConnected) {
      socket.emit('disconnect User  ', userId);
      setIsConnected(false);
      setUnreadCount(unreadNotifications.length); // Mantener conteo si se desconecta
    } else {
      socket.emit('connectUser  ', userId);
      setIsConnected(true);
      setUnreadCount(0); // Resetear contador al conectarse
    }
  };

// Iniciar el servidor y enviar notificaciones aleatorias
const PORT = 4000; // Cambia el puerto si es necesario
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Enviar notificaciones aleatorias cada 5 segundos
setInterval(sendRandomNotification, 5000);