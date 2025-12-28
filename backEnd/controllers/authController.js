const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generar JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const emailNorm = email?.toLowerCase().trim();

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email: emailNorm });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe'
      });
    }

    // Crear usuario
    const user = await User.create({
      name,
      email: emailNorm,
      password
    });

    // Generar token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('📱 Login attempt from:', req.ip, '| Origin:', req.headers.origin);
    console.log('📝 Body recibido:', { ...req.body, password: '***' });
    
    // Debug: ver cuántos usuarios hay
    const allUsers = await User.find({}).select('name email');
    console.log('👥 Usuarios en BD:', allUsers.length, allUsers.map(u => ({ name: u.name, email: u.email })));
    
    const { email, identifier: rawIdentifier, password: rawPassword } = req.body;
    const raw = rawIdentifier || email;
    const identifier = raw ? raw.toLowerCase().trim() : '';
    const password = rawPassword ? rawPassword.trim() : ''; // Quitar espacios de la contraseña

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Validar identificador y password
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa usuario y contraseña'
      });
    }

    // Buscar usuario por email o por nombre (case-insensitive), incluir password
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { name: { $regex: new RegExp(`^${escapeRegex(identifier)}$`, 'i') } }
      ]
    }).select('+password');

    if (!user) {
      console.log('❌ Usuario no encontrado:', identifier);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    console.log('✅ Usuario encontrado:', user.name, user.email);

    // Verificar contraseña
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log('❌ Contraseña incorrecta para:', user.name);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Opcional: actualizar último login sin rehashear contraseña
    // user.lastLogin = Date.now();
    // await user.save({ validateBeforeSave: false });

    // Generar token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// @desc    Obtener perfil del usuario actual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

