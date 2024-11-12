import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css'; // Asegúrate de que los estilos estén en este archivo

const socket = io('http://localhost:4000'); // Cambia el puerto si es necesario
const USERS = ['Usuario 1', 'Usuario 2', 'Usuario 3', 'Usuario 4', 'Usuario 5', 'Usuario 6']; // Seis usuarios

function UserComponent({ userId }) {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [viewedNotifications, setViewedNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false); // Estado para mostrar/ocultar notificaciones

  // Función para conectar/desconectar usuario
  const toggleConnection = () => {
    if (isConnected) {
      socket.emit('disconnectUser ', userId);
      setIsConnected(false);
      setUnreadCount(unreadNotifications.length); // Mantener conteo si se desconecta
    } else {
      socket.emit('connectUser ', userId);
      setIsConnected(true);
      setUnreadCount(0); // Resetear contador al conectarse
    }
  };

  // Escuchar notificaciones en tiempo real solo si está conectado
  useEffect(() => {
    const handleNotification = (notification) => {
      if (isConnected) {
        // Mostrar notificación si está conectado
        setNotifications((prev) => [...prev, notification]);
      } else {
        // Almacenar en no vistas si está desconectado
        setUnreadNotifications((prev) => {
          const updated = [...prev, notification];
          // Limitar a 20 notificaciones no vistas
          return updated.length > 20 ? updated.slice(-20) : updated;
        });
        setUnreadCount((prev) => prev + 1);
      }
    };

    socket.on(`receiveNotification_${userId}`, handleNotification);
    socket.on('receiveNotification', handleNotification);

    return () => {
      socket.off(`receiveNotification_${userId}`, handleNotification);
      socket.off('receiveNotification', handleNotification);
    };
  }, [isConnected, userId]);

  // Mostrar mensajes no vistos al pulsar la campana
  const handleBellClick = () => {
    if (showNotifications) {
      // Si las notificaciones están visibles, ocultarlas
      setShowNotifications(false);
      setViewedNotifications([]); // Limpiar las notificaciones vistas al cerrar
    } else {
      // Si están ocultas, mostrarlas
      setViewedNotifications((prev) => [...prev, ...unreadNotifications]);
      setUnreadNotifications([]); // Limpiar las no vistas
      setUnreadCount(0);
      setShowNotifications(true);
    }
  };

  return (
    <div className="user-box">
      <div className="user-info">
        <div className="user-avatar"></div>
        <div className="status-indicator" style={{ backgroundColor: isConnected ? 'green' : 'red' }}></div>
        <button className="connect-button" onClick={toggleConnection}>
          {isConnected ? 'Desconectar' : 'Conectar'}
        </button>
      </div>
      <div className="notifications-box">
        <div className="notifications-header">
          <span>Notificaciones</span>
          <button className="clear-button" onClick={handleBellClick}>
            <i className="bell-icon">🔔</i>
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
        </div>
        {showNotifications && (
          <div className="notifications-list">
            {/* Historial de notificaciones vistas */}
            {viewedNotifications.map((notif, index) => (
              <div key={index} className="notification-item">
                {notif.message}
              </div>
            ))}
            {/* Mostrar las últimas 10 notificaciones */}
            {notifications.slice(-10).map((notif, index) => (
              <div key={index} className="notification-item">
                {notif.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="container">
      <h2>Usuarios</h2>
      <div className="user-grid">
        {USERS.map((user) => (
          <UserComponent key={user} userId={user} />
        ))}
      </div>
    </div>
  );
}

export default App;