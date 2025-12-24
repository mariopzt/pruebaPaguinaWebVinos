const User = require('../models/User')

// @desc    Obtener usuario por ID
// @route   GET /api/users/:id
// @access  Private
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }
    
    res.json(user)
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

// @desc    Actualizar perfil de usuario
// @route   PUT /api/users/:id
// @access  Private
const updateUser = async (req, res) => {
  try {
    const { name, email, avatar } = req.body
    const userId = req.params.id
    
    console.log('[updateUser] userId:', userId, 'body:', { name, email, avatar }, 'req.user:', req.user?._id?.toString?.())
    
    // Verificar que el usuario solo pueda actualizar su propio perfil
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'No autorizado' })
    }
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'No autorizado para actualizar este perfil' })
    }
    
    const updateData = {}
    if (name) updateData.name = name
    if (email) updateData.email = email.toLowerCase().trim()
    if (avatar) updateData.avatar = avatar
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      // Nota: evitamos runValidators para no exigir password en updates
      { new: true }
    ).select('-password')
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }
    
    res.json(updatedUser)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    if (error?.stack) console.error(error.stack)
    // Duplicado de email
    if (error.code === 11000) {
      return res.status(400).json({ message: 'El email ya está en uso' })
    }
    // Validaciones de mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    res.status(500).json({ 
      message: error?.message || 'Error del servidor',
      error: error?.message,
      stack: error?.stack
    })
  }
}

module.exports = {
  getUser,
  updateUser
}

