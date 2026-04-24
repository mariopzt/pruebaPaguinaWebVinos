const CataUser = require('../models/CataUser');

exports.login = async (req, res) => {
  try {
    const username = String(req.body.username || req.body.user || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contrasena requeridos',
      });
    }

    const user = await CataUser.findOne({ username });

    if (!user || !user.checkPassword(password)) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contrasena incorrectos',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        user: user.username,
        displayName: user.displayName || user.username,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesion',
      error: error.message,
    });
  }
};
