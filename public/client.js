const socket = io();

// Suponiendo que cada usuario tiene un ID único
const userId = prompt("Ingrese su ID de usuario (por ejemplo, user1, user2, user3):");

// Conectar el usuario al servidor
socket.emit('join', userId);

// Escuchar las notificaciones recibidas
socket.on('receiveNotification', (notification) => {
  displayNotification(notification);
});

// Función para mostrar las notificaciones en la interfaz
function displayNotification(notification) {
  const notificationElement = document.createElement('div');
  notificationElement.classList.add('notification');
  notificationElement.textContent = `${notification.userId}: ${notification.message}`;
  document.getElementById('notifications').appendChild(notificationElement);
}

// Enviar notificación desde el cliente
function sendNotification(event, message) {
  const extraData = {}; // Información extra si se necesita
  socket.emit('sendNotification', { userId, event, message, extraData });
}

// Ejemplo de envío de mensaje
document.getElementById('sendBtn').addEventListener('click', () => {
  const message = document.getElementById('messageInput').value;
  sendNotification('message', message);
});
