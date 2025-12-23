const Task = require('../models/Task');

exports.getTasks = async (req, res, next) => {
  try {
    // Mostrar todas las tareas, sin filtrar por usuario, e incluir nombre/avatar del usuario si existe
    const tasks = await Task.find({})
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (req.user && !payload.user) payload.user = req.user._id;
    const task = await Task.create(payload);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('user', 'name avatar');
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

