import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Notification from './Notification';
import './App.css'; // Importa el archivo CSS para estilos

const socket = io('http://localhost:4000');

function App() {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        socket.on('user_update', (users) => {
            setUsers(users);
        });

        socket.on('notification', (notification) => {
            setNotifications((prevNotifications) => {
                const newNotifications = [notification, ...prevNotifications];
                return newNotifications.slice(0, 10); // Limitar a 10 notificaciones
            });
        });

        return () => {
            socket.off('user_update');
            socket.off('notification');
        };
    }, []);

    const handleUserSelect = (user) => {
        setUser(user);
        socket.emit('user_connected', user);
    };

    const handleDisconnect = () => {
        socket.emit('user_disconnect'); // Cambié 'disconnect' a 'user_disconnect'
        setUser(null);
    };

    const handleSendNotification = () => {
        if (message.trim()) {
            socket.emit('send_notification', {
                message: message,
                user: user,
                target: 'all', // Puede cambiar a un usuario específico si es necesario
            });
            setMessage('');
        }
    };

    return (
        <div className="App">
            {!user ? (
                <div className="user-selection">
                    <button className="user-button" onClick={() => handleUserSelect('Usuario 1')}>Usuario 1</button>
                    <button className="user-button" onClick={() => handleUserSelect('Usuario 2')}>Usuario 2</button>
                    <button className="user-button" onClick={() => handleUserSelect('Usuario 3')}>Usuario 3</button>
                </div>
            ) : (
                <div className="dashboard">
                    <h2>Bienvenido, {user}</h2>
                    <button className="disconnect-button" onClick={handleDisconnect}>Desconectar</button>
                    <div className="notification-form">
                        <textarea
                            className="message-input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Escribe una notificación"
                        />
                        <button className="send-button" onClick={handleSendNotification}>Enviar Notificación</button>
                    </div>
                    <Notification notifications={notifications} />
                </div>
            )}
        </div>
    );
}

export default App;
