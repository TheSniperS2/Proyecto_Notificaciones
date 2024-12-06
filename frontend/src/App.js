import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:4000');
const USERS = ['Usuario 1', 'Usuario 2', 'Usuario 3', 'Usuario 4'];

function UserComponent({ userId }) {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [viewedNotifications, setViewedNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false); // Estado para mostrar/ocultar las notificaciones

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        console.log(`Cargando notificaciones para ${userId}`); // Log para depuración
        const response = await fetch(`http://localhost:4000/notifications/${userId}`);
        const data = await response.json();
  
        const unread = data.filter(notification => notification.status === 'No Leido');
        setUnreadNotifications(unread);
        setUnreadCount(unread.length);
        setViewedNotifications(data.filter(notification => notification.status === 'Leido'));
      } catch (error) {
        console.error(`Error al cargar notificaciones para ${userId}:`, error);
      }
    };
    fetchNotifications();
  }, [userId]);
  
  
  

  const toggleConnection = () => {
    if (isConnected) {
      socket.emit('disconnectUser', userId);
      setIsConnected(false);
      setShowNotifications(false); // Cierra las notificaciones al desconectar
    } else {
      socket.emit('connectUser', userId);
      setIsConnected(true);
    }
  };

  useEffect(() => {
    const handleNotification = (notification) => {
      if (isConnected) {
        setViewedNotifications((prev) => [...prev, notification]);
      } else {
        setUnreadNotifications((prev) => [...prev, notification]);
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

  const handleBellClick = async () => {
    if (showNotifications) {
      setShowNotifications(false); // Oculta notificaciones si ya están visibles
      return;
    }

    const updatedNotifications = unreadNotifications.map(notif => ({
      ...notif,
      status: 'Leido'
    }));

    setViewedNotifications((prev) => [...prev, ...updatedNotifications]);
    setUnreadNotifications([]);
    setUnreadCount(0);
    setShowNotifications(true); // Muestra las notificaciones

    try {
      await fetch(`http://localhost:4000/notifications/markAsRead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notifications: updatedNotifications })
      });
    } catch (error) {
      console.error('Error al marcar como visto:', error);
    }
  };

  const clearNotifications = async () => {
    if (viewedNotifications.length === 0) return;

    try {
      await fetch(`http://localhost:4000/notifications/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      setViewedNotifications([]);
    } catch (error) {
      console.error('Error al eliminar notificaciones:', error);
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
          <button
  className="clear-button"
  onClick={handleBellClick}
  disabled={!isConnected} // Desactiva si no está conectado
>
  <i className="bell-icon">🔔</i>
  {unreadCount > 0 && (
    <span className="badge">
      {unreadCount > 10 ? '10+' : unreadCount} {/* Limita a 10 */}
    </span>
  )}
</button>

<button
  className="clear-button"
  onClick={clearNotifications}
  disabled={!isConnected} // Desactiva si no está conectado
>
  Limpiar
</button>
        </div>
        {showNotifications && ( // Condicional para mostrar u ocultar la lista
          <div className="notifications-list">
            {viewedNotifications.map((notif, index) => (
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
