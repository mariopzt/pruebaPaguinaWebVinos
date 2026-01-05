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

// CORS - permitir acceso desde localhost y cualquier IP de red local
app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (como apps móviles o Postman)
    if (!origin) return callback(null, true);
    
    // Permitir localhost y cualquier IP de red local
    const allowedPatterns = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/
    ];
    
    const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS bloqueado para:', origin);
      callback(null, true); // En desarrollo, permitir todo
    }
  },
  credentials: true
}));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/wines', require('./routes/wineRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/pending', require('./routes/pendingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

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

// Iniciar servidor en todas las interfaces (0.0.0.0) para acceso desde red local
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor corriendo en modo ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL Local: http://localhost:${PORT}`);
  console.log(`🌐 URL Red: http://0.0.0.0:${PORT} (usa tu IP local)`);
  console.log(`🍷 API: http://localhost:${PORT}/api`);
  console.log(`\n✨ Presiona CTRL+C para detener el servidor\n`);
});

// Manejar errores no capturados
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});

