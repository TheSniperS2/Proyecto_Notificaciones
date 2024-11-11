const mongoose = require('mongoose');

// Establecer `strictQuery` a `false` para el comportamiento no estricto
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/notis', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 20000, // Tiempo de espera extendido
      maxPoolSize: 10,                 // Limitar el tamaño máximo de conexiones en el pool
      minPoolSize: 5                   // Tamaño mínimo de conexiones en el pool
    });
    console.log('MongoDB conectado');
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1); // Salir del proceso si no se puede conectar a MongoDB
  }
};

module.exports = connectDB;
