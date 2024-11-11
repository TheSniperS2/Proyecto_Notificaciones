// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let connectedUsers = [];

io.on('connection', (socket) => {
  console.log('Usuario conectado');

  // Evento para cuando un usuario se conecta
  socket.on('user_connected', (username) => {
    connectedUsers.push(username);
    io.emit('user_update', connectedUsers); // Enviar lista de usuarios conectados a todos
    console.log(`${username} se ha conectado`);
  });

  // Evento para cuando un usuario se desconecta
  socket.on('disconnect', () => {
    connectedUsers = connectedUsers.filter((user) => user !== socket.username);
    io.emit('user_update', connectedUsers); // Actualizar la lista
    console.log('Usuario desconectado');
  });

  // Evento para manejar los mensajes del chat
  socket.on('send_chat_message', (message) => {
    io.emit('chat_message', message); // Emitir mensaje a todos
  });
});

server.listen(4000, () => {
  console.log('Servidor escuchando en el puerto 4000');
});
