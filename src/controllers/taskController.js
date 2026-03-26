const Task = require('../models/Task');

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, assignedTo } = req.body;

    const task = await Task.create({
      title,
      description,
      dueDate,
      assignedTo,
      createdBy: req.user.id
    });

    res.status(201).json(task);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getTasks = async (req, res) => {
    try {
      const { status, search, mine } = req.query;
  
      let filter = {};
  
      if (["true", "1", "yes"].includes(String(mine).toLowerCase())) {
        filter.assignedTo = req.user.id;
      }
      // filter by status
      if (status) {
        filter.status = status;
      }
  
      // search by title/description
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
  
      const tasks = await Task.find(filter)
        .populate('assignedTo', 'name email');
  
      res.json(tasks);
  
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  exports.updateTask = async (req, res) => {
    try {
      const updates = {};
      if (req.body.title !== undefined) updates.title = req.body.title;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.status !== undefined) updates.status = req.body.status;
      if (req.body.dueDate !== undefined) updates.dueDate = req.body.dueDate;
      if (req.body.assignedTo !== undefined) updates.assignedTo = req.body.assignedTo;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          message: 'No updatable fields provided'
        });
      }

      const task = await Task.findByIdAndUpdate(
        req.params.id,
        updates,
        {
          returnDocument: 'after',
          runValidators: true
        }
      );
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
  
      res.json(task);
  
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTask = await Task.findByIdAndDelete(id);
        if (!deletedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};