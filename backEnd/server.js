const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

app.use(cors({
  origin: function allowLocalAndApps(origin, callback) {
    if (!origin) return callback(null, true);

    const allowedPatterns = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
      /^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+(:\d+)?$/,
    ];

    const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin));
    if (!isAllowed) {
      console.log('CORS permitido fuera de red local:', origin);
    }
    callback(null, true);
  },
  credentials: true,
}));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/catas', require('./routes/cataRoutes'));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Catas funcionando correctamente',
    version: '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando',
    database: process.env.MONGODB_DB || 'catas',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nServidor de Catas en modo ${process.env.NODE_ENV || 'development'}`);
  console.log(`Puerto: ${PORT}`);
  console.log(`URL Local: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/catas`);
  console.log('\nPresiona CTRL+C para detener el servidor\n');
});

process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
