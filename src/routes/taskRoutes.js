const express = require('express');
const router = express.Router();

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const auth = require('../middleware/authMiddleware');
const tasksOwnerMiddleware = require('../middleware/tasksOwnerMiddleware');

// protect all routes
router.use(auth);

router.post('/', createTask);
router.get('/', getTasks);
router.put('/:id', tasksOwnerMiddleware, updateTask);//checks the ownership of the task
router.delete('/:id', tasksOwnerMiddleware, deleteTask);//checks the ownership of the task

module.exports = router;