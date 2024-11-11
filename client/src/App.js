import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:4000');
const USERS = ['Usuario 1', 'Usuario 2', 'Usuario 3', 'Usuario 4'];

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on('user_update', (users) => {
      setUsers(users);
    });

    socket.on('chat_message', (message) => {
      if (message.receiver === user || message.sender === user) {
        setChatMessages((prevMessages) => [...prevMessages, message]);
        if (message.receiver === user) {
          setNotifications((prevNotifications) => [
            ...prevNotifications,
            { text: `Nuevo mensaje de ${message.sender}`, timestamp: new Date().toLocaleTimeString() },
          ]);
          setUnreadNotifications((prev) => [...prev, message]);
          setUnreadCount((prev) => prev + 1);
        }
      }
    });

    return () => {
      socket.off('user_update');
      socket.off('chat_message');
    };
  }, [user]);

  const handleUserClick = (username) => {
    setUser(username);
    socket.emit('user_connected', username);
    setIsConnected(true);
    setUnreadCount(0);
  };

  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser);
    setChatMessages([]);
  };

  const handleSendMessage = () => {
    if (message.trim() && selectedUser) {
      const chatMessage = {
        sender: user,
        receiver: selectedUser,
        message: message,
        timestamp: new Date().toLocaleTimeString(),
      };
      socket.emit('send_chat_message', chatMessage);
      setMessage('');
      setChatMessages((prevMessages) => [...prevMessages, chatMessage]);
    }
  };

  const handleBellClick = () => {
    setNotifications((prev) => [...prev, ...unreadNotifications]);
    setUnreadNotifications([]);
    setUnreadCount(0);
  };

  const toggleConnection = () => {
    if (isConnected) {
      socket.emit('disconnectUser', user);
      setIsConnected(false);
      setUnreadCount(unreadNotifications.length);
    } else {
      socket.emit('connectUser', user);
      setIsConnected(true);
      setUnreadCount(0);
    }
  };

  return (
    <div className="flex h-screen">
      {!user ? (
        <div className="flex justify-center items-center w-full">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Selecciona tu usuario</h2>
            {USERS.map((username) => (
              <button
                key={username}
                className="bg-blue-500 text-white py-2 px-4 rounded-md m-2"
                onClick={() => handleUserClick(username)}
              >
                {username}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="w-1/4 bg-gray-100 border-r border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="font-semibold">{user}</div>
                <div
                  className="status-indicator"
                  style={{ backgroundColor: isConnected ? 'green' : 'red' }}
                ></div>
                <button className="connect-button" onClick={toggleConnection}>
                  {isConnected ? 'Desconectar' : 'Conectar'}
                </button>
              </div>
            </div>
            <div className="p-4">
              <h2 className="font-semibold mb-2">Usuarios Conectados</h2>
              {users.map(
                (u) =>
                  u !== user && (
                    <div
                      key={u}
                      className="flex items-center p-2 bg-purple-100 rounded-lg cursor-pointer"
                      onClick={() => handleUserSelect(u)}
                    >
                      <span className="font-semibold">{u}</span>
                    </div>
                  )
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              {selectedUser ? (
                <div className="font-semibold">{selectedUser}</div>
              ) : (
                <h3>Selecciona un usuario para empezar a chatear</h3>
              )}
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-4 ${msg.sender === user ? 'text-right' : 'text-left'}`}
                >
                  <div
                    className={`inline-block p-2 rounded-lg ${
                      msg.sender === user ? 'bg-purple-500 text-white' : 'bg-gray-200 text-black'
                    }`}
                  >
                    <strong>{msg.sender}:</strong> {msg.message}{' '}
                    <span className="text-sm text-gray-500">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <input
                className="w-full p-2 border rounded mb-2"
                type="text"
                placeholder="Escribe tu mensaje..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-500 text-white py-2 px-4 rounded-md w-full"
              >
                Enviar
              </button>
            </div>
          </div>

          <div className="absolute top-4 right-4">
            <button className="text-2xl" onClick={handleBellClick}>
              {unreadCount > 0 ? (
                <span className="relative">
                  <i className="fas fa-bell"></i>
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex justify-center items-center">
                    {unreadCount}
                  </span>
                </span>
              ) : (
                <i className="fas fa-bell"></i>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
