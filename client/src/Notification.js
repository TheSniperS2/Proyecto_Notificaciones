import React, { useState } from 'react';

function Notification({ notifications }) {
    const [viewPast, setViewPast] = useState(false);

    return (
        <div>
            <h3>Notificaciones</h3>
            {notifications.slice(0, 10).map((notification, index) => (
                <div key={index}>
                    <p>{notification.message}</p>
                    <small>{new Date(notification.date).toLocaleString()}</small>
                </div>
            ))}
            {notifications.length > 10 && !viewPast && (
                <button onClick={() => setViewPast(true)}>Ver Notificaciones Pasadas</button>
            )}
            {viewPast && notifications.slice(10).map((notification, index) => (
                <div key={index}>
                    <p>{notification.message}</p>
                    <small>{new Date(notification.date).toLocaleString()}</small>
                </div>
            ))}
        </div>
    );
}

export default Notification;
