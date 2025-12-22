const Task = require('../models/Task');

exports.getTasks = async (req, res, next) => {
  try {
    const query = {};
    if (req.user) query.$or = [{ user: req.user._id }, { user: null }];
    const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();
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
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
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

