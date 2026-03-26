// src/middleware/taskAccessMiddleware.js
const Task = require("../models/Task");

module.exports = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const userId = String(req.user.id);
    const isCreator = String(task.createdBy) === userId;
    const isAssignee = task.assignedTo && String(task.assignedTo) === userId;

    if (!isCreator && !isAssignee) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.task = task; // optional reuse in controller
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};