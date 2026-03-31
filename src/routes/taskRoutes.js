const express = require('express');
const router = express.Router();

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

const auth = require('../middleware/authMiddleware');
const { requireTaskProjectMemberById } = require('../utils/projectAccess');

router.use(auth);

router.post('/', createTask);
router.get('/', getTasks);
router.put('/:id', requireTaskProjectMemberById, updateTask);
router.delete('/:id', requireTaskProjectMemberById, deleteTask);

module.exports = router;