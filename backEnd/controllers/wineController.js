const Wine = require('../models/Wine');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Obtener todos los vinos
// @route   GET /api/wines
// @access  Private
exports.getWines = async (req, res) => {
  try {
    // Mostrar todos los vinos (sean públicos o asociados)
    const wines = await Wine.find({}).sort({ updatedAt: -1 });

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

    // En una bodega compartida, cualquier usuario autenticado puede ver vinos

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
    const userName = req.user?.name || 'Alguien';

    // Notificar a todos los demás usuarios que se agregó un nuevo vino
    const otherUsers = await User.find({ _id: { $ne: req.user?._id } }, '_id');
    
    if (otherUsers.length > 0) {
      const docs = otherUsers.map(u => ({
        user: u._id,
        createdBy: req.user?._id,
        type: 'wine-added',
        icon: 'FiPlusCircle',
        title: 'Nuevo vino agregado',
        message: `**${userName}** ha agregado **${wine.name}** al almacén${wine.stock > 0 ? ` con ${wine.stock} unidades` : ''}.`,
        wineId: wine._id,
        unread: true,
        actions: ['Ver bodega'],
        createdAt: new Date(),
      }));
      await Notification.insertMany(docs);
    }

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

    // En una bodega compartida, cualquier usuario autenticado puede modificar vinos
    // Ya no verificamos propiedad del vino

    const prevStock = wine.stock || 0;
    const prevRestaurant = wine.restaurantStock || 0;

    wine = await Wine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    const newStock = wine.stock || 0;
    const newRestaurant = wine.restaurantStock || 0;
    const userName = req.user?.name || 'Alguien';

    // Calcular diferencias
    const stockDiff = newStock - prevStock;
    const restaurantDiff = newRestaurant - prevRestaurant;

    // Obtener todos los usuarios EXCEPTO el que hizo el cambio
    const otherUsers = await User.find({ _id: { $ne: req.user?._id } }, '_id');

    // Notificación cuando cambia el stock del almacén
    if (stockDiff !== 0 && otherUsers.length > 0) {
      const action = stockDiff > 0 ? 'sumó' : 'restó';
      const amount = Math.abs(stockDiff);
      const icon = stockDiff > 0 ? 'FiPackage' : 'FiBox';
      const title = stockDiff > 0 ? 'Stock añadido en bodega' : 'Stock reducido en bodega';
      
      const docs = otherUsers.map(u => ({
        user: u._id,
        createdBy: req.user?._id,
        type: 'stock-change',
        icon,
        title,
        message: `**${userName}** ${action} **${amount}** unidades de **${wine.name}** en bodega. Stock: ${prevStock} → ${newStock}`,
        wineId: wine._id,
        unread: true,
        actions: ['Ver bodega'],
        createdAt: new Date(),
      }));
      await Notification.insertMany(docs);
    }

    // Notificación cuando cambia el stock del restaurante
    if (restaurantDiff !== 0 && otherUsers.length > 0) {
      const action = restaurantDiff > 0 ? 'sumó' : 'restó';
      const amount = Math.abs(restaurantDiff);
      const icon = restaurantDiff > 0 ? 'FiPackage' : 'FiBox';
      const title = restaurantDiff > 0 ? 'Stock añadido en restaurante' : 'Stock reducido en restaurante';
      
      const docs = otherUsers.map(u => ({
        user: u._id,
        createdBy: req.user?._id,
        type: 'stock-change',
        icon,
        title,
        message: `**${userName}** ${action} **${amount}** unidades de **${wine.name}** en restaurante. Stock: ${prevRestaurant} → ${newRestaurant}`,
        wineId: wine._id,
        unread: true,
        actions: ['Ver bodega'],
        createdAt: new Date(),
      }));
      await Notification.insertMany(docs);
    }

    // Alerta especial: stock muy bajo (<=2) en bodega
    if (newStock <= 2 && newStock < prevStock && otherUsers.length > 0) {
      const docs = otherUsers.map(u => ({
        user: u._id,
        createdBy: req.user?._id,
        type: 'stock-bajo-bodega',
        icon: 'FiBox',
        title: '⚠️ Stock bajo en bodega',
        message: `**${wine.name}** tiene solo **${newStock}** unidades en bodega. Modificado por **${userName}**.`,
        wineId: wine._id,
        unread: true,
        actions: ['Ver bodega', 'Hacer pedido'],
        createdAt: new Date(),
      }));
      await Notification.insertMany(docs);
    }

    // Alerta especial: stock muy bajo (<=2) en restaurante
    if (newRestaurant <= 2 && newRestaurant < prevRestaurant && otherUsers.length > 0) {
      const docs = otherUsers.map(u => ({
        user: u._id,
        createdBy: req.user?._id,
        type: 'stock-bajo-restaurante',
        icon: 'FiBox',
        title: '⚠️ Stock bajo en restaurante',
        message: `**${wine.name}** tiene solo **${newRestaurant}** unidades en restaurante. Modificado por **${userName}**.`,
        wineId: wine._id,
        unread: true,
        actions: ['Ver bodega'],
        createdAt: new Date(),
      }));
      await Notification.insertMany(docs);
    }

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

    // Guardar info del vino antes de eliminarlo para la notificación
    const wineName = wine.name;
    const userName = req.user?.name || 'Alguien';

    // En una bodega compartida, cualquier usuario autenticado puede eliminar vinos
    await wine.deleteOne();

    // Notificar a todos los demás usuarios que se eliminó un vino
    const otherUsers = await User.find({ _id: { $ne: req.user?._id } }, '_id');
    
    if (otherUsers.length > 0) {
      const docs = otherUsers.map(u => ({
        user: u._id,
        createdBy: req.user?._id,
        type: 'wine-deleted',
        icon: 'FiTrash2',
        title: 'Vino eliminado',
        message: `**${userName}** ha eliminado **${wineName}** del almacén.`,
        unread: true,
        actions: ['Ver bodega'],
        createdAt: new Date(),
      }));
      await Notification.insertMany(docs);
    }

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

// @desc    Toggle like en un vino
// @route   POST /api/wines/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
  try {
    const wine = await Wine.findById(req.params.id);

    if (!wine) {
      return res.status(404).json({
        success: false,
        message: 'Vino no encontrado'
      });
    }

    const userId = req.user.id;

    // Inicializar likes si no existe
    if (!wine.likes) {
      wine.likes = { count: 0, users: [] };
    }

    // Verificar si el usuario ya dio like
    const userIndex = wine.likes.users.indexOf(userId);

    if (userIndex > -1) {
      // Si ya dio like, removerlo
      wine.likes.users.splice(userIndex, 1);
      wine.likes.count = Math.max(0, wine.likes.count - 1);
    } else {
      // Si no ha dado like, agregarlo
      wine.likes.users.push(userId);
      wine.likes.count += 1;
    }

    await wine.save();

    res.status(200).json({
      success: true,
      data: {
        wineId: wine._id,
        likes: wine.likes.count,
        liked: wine.likes.users.includes(userId)
      }
    });
  } catch (error) {
    console.error('Error en toggleLike:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar like',
      error: error.message
    });
  }
};

