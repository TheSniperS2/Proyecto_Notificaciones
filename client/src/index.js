import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // Este archivo es el de estilos globales
import App from './App'; // Asegúrate de que App.js esté correctamente importado
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root') // Verifica que el contenedor con id 'root' esté en tu index.html
);

// Si tienes la función para medir el rendimiento:
reportWebVitals();
