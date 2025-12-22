const Wine = require('../models/Wine');

// @desc    Obtener todos los vinos
// @route   GET /api/wines
// @access  Private
exports.getWines = async (req, res) => {
  try {
    const query = req.user?.id ? { user: req.user.id } : {};
    const wines = await Wine.find(query).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: wines.length,
      data: wines
    });
  } catch (error) {
    console.error('Error en getWines:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vinos',
      error: error.message
    });
  }
};

// @desc    Obtener un vino por ID
// @route   GET /api/wines/:id
// @access  Private
exports.getWine = async (req, res) => {
  try {
    const wine = await Wine.findById(req.params.id);

    if (!wine) {
      return res.status(404).json({
        success: false,
        message: 'Vino no encontrado'
      });
    }

    // Verificar que el vino pertenezca al usuario (si se guardó un usuario)
    if (wine.user && req.user && wine.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    res.status(200).json({
      success: true,
      data: wine
    });
  } catch (error) {
    console.error('Error en getWine:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener vino',
      error: error.message
    });
  }
};

// @desc    Crear nuevo vino
// @route   POST /api/wines
// @access  Private
exports.createWine = async (req, res) => {
  try {
    // Agregar usuario al body
    if (req.user?.id) {
      req.body.user = req.user.id;
    }

    const wine = await Wine.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Vino creado exitosamente',
      data: wine
    });
  } catch (error) {
    console.error('Error en createWine:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear vino',
      error: error.message
    });
  }
};

// @desc    Actualizar vino
// @route   PUT /api/wines/:id
// @access  Private
exports.updateWine = async (req, res) => {
  try {
    let wine = await Wine.findById(req.params.id);

    if (!wine) {
      return res.status(404).json({
        success: false,
        message: 'Vino no encontrado'
      });
    }

    // Verificar que el vino pertenezca al usuario (si aplica)
    if (wine.user && req.user && wine.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    wine = await Wine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Vino actualizado exitosamente',
      data: wine
    });
  } catch (error) {
    console.error('Error en updateWine:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar vino',
      error: error.message
    });
  }
};

// @desc    Eliminar vino
// @route   DELETE /api/wines/:id
// @access  Private
exports.deleteWine = async (req, res) => {
  try {
    const wine = await Wine.findById(req.params.id);

    if (!wine) {
      return res.status(404).json({
        success: false,
        message: 'Vino no encontrado'
      });
    }

    // Verificar que el vino pertenezca al usuario (si aplica)
    if (wine.user && req.user && wine.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    await wine.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Vino eliminado exitosamente',
      data: {}
    });
  } catch (error) {
    console.error('Error en deleteWine:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar vino',
      error: error.message
    });
  }
};

