const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

// Crear app de Express
const app = express();

// Middleware (aumentamos límite para imágenes base64 pequeñas)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/wines', require('./routes/wineRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🍷 API de VinosStK funcionando correctamente',
    version: '1.0.0'
  });
});

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
});

// Error handler (debe ir al final)
app.use(errorHandler);

// Puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en modo ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🍷 API: http://localhost:${PORT}/api`);
  console.log(`\n✨ Presiona CTRL+C para detener el servidor\n`);
});

// Manejar errores no capturados
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});

