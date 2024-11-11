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

// Conectar a la base de datos
mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conexión a MongoDB exitosa'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

// Middleware para parsear JSON
app.use(express.json());

// Evento de conexión con Socket.IO
let users = {}; // Almacena los usuarios conectados

io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado:', socket.id);

    // Guardar al usuario cuando se conecta
    socket.on('user_connected', (user) => {
        users[socket.id] = user;
        io.emit('user_update', users); // Notificar a todos los usuarios
        console.log(`${user} conectado`);
    });

    // Enviar notificación a usuarios específicos o a todos
    socket.on('send_notification', async (notification) => {
        const message = new Message({
            message: notification.message,
            date: new Date(),
            user: notification.user
        });
        await message.save();

        if (notification.target === 'all') {
            io.emit('notification', message);
        } else {
            io.to(notification.target).emit('notification', message);
        }
    });

    // Desconectar un usuario
    socket.on('user_disconnect', () => {
        console.log(`${socket.id} se ha desconectado`);
        // Aquí podrías realizar otras acciones como eliminar al usuario de la lista de usuarios activos
        io.emit('user_update', users);  // Emitir la lista de usuarios actualizada
    });   
});

// Servir el frontend en React
app.use(express.static('client/build'));

app.get('/', (req, res) => {
  res.send('¡Servidor Express funcionando!');
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
