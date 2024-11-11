// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Message = require('./models/Message'); // Modelo de mensaje

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 4000;
const DB_URI = 'mongodb://127.0.0.1:27017/notis';

mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conexión a MongoDB exitosa'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

app.use(express.json());

let users = {}; // { socketId: username }
let userSockets = {}; // { username: socketId }

function sendRandomNotification() {
  const userIds = Object.keys(users);
  if (userIds.length === 0) return;

  const randomIndex = Math.floor(Math.random() * userIds.length);
  const randomUser = userIds[randomIndex];
  const isGlobal = Math.random() > 0.5;

  const message = isGlobal
    ? 'Mensaje global para todos los usuarios.'
    : `Notificación privada para ${randomUser}.`;

  const newMessage = new Message({
    sender: 'Sistema', // El emisor puede ser un sistema o similar
    receiver: isGlobal ? null : randomUser, // En caso de notificación global, no hay receptor específico
    message,
    type: 'notification', // Indica que es una notificación
    read: false,
  });

  newMessage.save().then(() => {
    if (isGlobal) {
      io.emit('notification', newMessage);
    } else if (userSockets[randomUser]) {
      io.to(userSockets[randomUser]).emit('notification', newMessage);
    }
  });
}

io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado:', socket.id);

    socket.on('user_connected', async (username) => {
        users[socket.id] = username;
        userSockets[username] = socket.id;

        // Enviar mensajes y notificaciones no leídas al usuario que se conecta
        const unreadMessages = await Message.find({ receiver: username, read: false });
        const notifications = await Message.find({ receiver: username, type: 'notification', read: false });
        
        socket.emit('new_messages', unreadMessages);
        socket.emit('load_notifications', notifications);

        io.emit('user_update', Object.values(users)); // Actualizar lista de usuarios conectados
        console.log(`${username} conectado`);
    });

    socket.on('send_chat_message', async (chatMessage) => {
        const { sender, receiver, message } = chatMessage;

        const newMessage = new Message({
            sender,
            receiver,
            message,
            date: new Date(),
            type: 'chat', // Esto lo marca como mensaje de chat
            read: false,
        });
        await newMessage.save();

        // Enviar mensaje si el receptor está conectado
        if (userSockets[receiver]) {
            io.to(userSockets[receiver]).emit('chat_message', newMessage);
        }
        io.to(userSockets[sender]).emit('chat_message', newMessage);
    });

    socket.on('send_notification', async (notification) => {
        const newNotification = new Message({
            message: notification.message,
            date: new Date(),
            receiver: notification.user, // Receptor de la notificación
            type: 'notification', // Esto lo marca como notificación
            read: false,
        });
        await newNotification.save();

        if (notification.target === 'all') {
            io.emit('notification', newNotification);
        } else if (userSockets[notification.target]) {
            io.to(userSockets[notification.target]).emit('notification', newNotification);
        }
    });

    socket.on('disconnect', () => {
        const username = users[socket.id];
        if (username) {
            delete users[socket.id];
            delete userSockets[username];
            io.emit('user_update', Object.values(users));
            console.log(`${username} se ha desconectado`);
        }
    });
});

// Enviar notificaciones aleatorias cada 5 segundos
setInterval(sendRandomNotification, 5000);

app.use(express.static('client/build'));

app.get('/', (req, res) => {
    res.send('¡Servidor Express funcionando!');
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
