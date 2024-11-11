const socket = io();

socket.on('connect', () => {
  console.log('Conectado al servidor');
});

const userId = "1234567890"; // ID de usuario ejemplo, reemplázalo según el usuario

// Escuchar notificaciones específicas para el usuario
socket.on(`notification:${userId}`, (notification) => {
  displayNotification(notification);
});

function displayNotification(notification) {
  const notificationElement = document.createElement('div');
  notificationElement.classList.add('notification');
  notificationElement.textContent = notification.message;
  document.getElementById('notifications').appendChild(notificationElement);
}
