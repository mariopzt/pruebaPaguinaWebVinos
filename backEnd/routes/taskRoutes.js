const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { optionalAuth } = require('../middleware/auth');

router.route('/')
  .get(optionalAuth, getTasks)
  .post(optionalAuth, createTask);

router.route('/:id')
  .put(optionalAuth, updateTask)
  .delete(optionalAuth, deleteTask);

module.exports = router;

