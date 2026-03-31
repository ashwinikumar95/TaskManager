const mongoose = require('mongoose');
const Task = require('../models/Task');
const projectAccess = require('../utils/projectAccess');
const Project = require('../models/Project');

const TASK_STATUSES = ['open', 'in-progress', 'completed'];

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function handleMongooseError(res, err, serverStatus = 500) {
  if (err && err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  const message = err && err.message ? err.message : 'Server error';
  return res.status(serverStatus).json({ message });
}

function assigneeMustBeProjectMember(project, assignedTo) {
  if (assignedTo == null || assignedTo === '') {
    return { ok: true };
  }
  if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
    return { ok: false, message: 'Invalid assignedTo' };
  }
  if (!projectAccess.userIsProjectMember(project, assignedTo)) {
    return { ok: false, message: 'Assignee must be a project member' };
  }
  return { ok: true };
}

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, assignedTo, projectId: rawProjectId } =
      req.body;
    let projectId =
      rawProjectId == null ? '' : String(rawProjectId).trim();
    if (!projectId) {
      const fallback = await Project.findOne({
        $or: [{ createdBy: req.user.id }, { members: req.user.id }],
      })
        .sort({ _id: 1 })
        .select('_id');
      if (!fallback) {
        return res.status(400).json({
          message:
            'No project available; create a project first or pass projectId',
        });
      }
      projectId = String(fallback._id);
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid projectId' });
    }

    const access = await projectAccess.memberCheck(projectId, req.user.id);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const assigneeCheck = assigneeMustBeProjectMember(
      access.project,
      assignedTo
    );
    if (!assigneeCheck.ok) {
      return res.status(400).json({ message: assigneeCheck.message });
    }

    const assigneeId =
      assignedTo != null && assignedTo !== '' ? assignedTo : undefined;

    const task = await Task.create({
      title,
      description,
      dueDate,
      assignedTo: assigneeId,
      createdBy: req.user.id,
      projectId,
    });

    res.status(201).json(task);
  } catch (err) {
    handleMongooseError(res, err, 500);
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { status, search, mine, projectId: rawProjectId } = req.query;
    const userId = req.user.id;
    const projectIdParam =
      rawProjectId != null && rawProjectId !== ''
        ? String(rawProjectId).trim()
        : '';

    const filter = {};
    if (projectIdParam && !mongoose.Types.ObjectId.isValid(projectIdParam)) {
      return res.status(400).json({ message: 'Invalid projectId' });
    }
    if (projectIdParam) {
      const access = await projectAccess.memberCheck(projectIdParam, userId);
      if (!access.ok) {
        return res.status(access.status).json({ message: access.message });
      }
      filter.projectId = projectIdParam;
    } else {
      const myProjects = await Project.find({
        $or: [{ createdBy: userId }, { members: userId }],
      }).select('_id');
      const projectIds = myProjects.map((p) => p._id);
      filter.projectId = { $in: projectIds };
    }

    if (['true', '1', 'yes'].includes(String(mine).toLowerCase())) {
      filter.assignedTo = userId;
    }
    const statusParam = status != null ? String(status).trim() : '';
    if (statusParam) {
      if (!TASK_STATUSES.includes(statusParam)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      filter.status = statusParam;
    }

    const trimmedSearch = search != null ? String(search).trim() : '';
    if (trimmedSearch !== '') {
      const safe = escapeRegex(trimmedSearch);
      filter.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(filter).populate('assignedTo', 'name email');

    res.json(tasks);
  } catch (err) {
    handleMongooseError(res, err, 500);
  }
};

exports.updateTask = async (req, res) => {
  try {
    const access = await projectAccess.memberCheck(
      req.task.projectId,
      req.user.id
    );
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.description !== undefined)
      updates.description = req.body.description;
    if (req.body.status !== undefined) {
      if (!TASK_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      updates.status = req.body.status;
    }
    if (req.body.dueDate !== undefined) updates.dueDate = req.body.dueDate;
    if (req.body.assignedTo !== undefined) {
      const a = req.body.assignedTo;
      if (a != null && a !== '' && !mongoose.Types.ObjectId.isValid(a)) {
        return res.status(400).json({ message: 'Invalid assignedTo' });
      }
      const assigneeCheck = assigneeMustBeProjectMember(access.project, a);
      if (!assigneeCheck.ok) {
        return res.status(400).json({ message: assigneeCheck.message });
      }
      updates.assignedTo =
        a === '' || a == null ? null : req.body.assignedTo;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: 'No updatable fields provided',
      });
    }

    const task = await Task.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    handleMongooseError(res, err, 500);
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const access = await projectAccess.memberCheck(
      req.task.projectId,
      req.user.id
    );
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    handleMongooseError(res, err, 500);
  }
};
