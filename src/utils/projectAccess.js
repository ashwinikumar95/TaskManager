const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");

function userIsProjectMember(project, userId) {
  if (!project) return false;
  const uid = String(userId);
  if (project.createdBy && String(project.createdBy) === uid) {
    return true;
  }
  const members = project.members || [];
  return members.some((m) => String(m) === uid);
}

/**
 * @param {string} projectId
 * @param {string} userId
 * @returns {Promise<{ ok: true, project } | { ok: false, status: number, message: string }>}
 */
async function memberCheck(projectId, userId) {
  if (!projectId) {
    return { ok: false, status: 400, message: "projectId is required" };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return { ok: false, status: 404, message: "Project not found" };
  }

  if (!userIsProjectMember(project, userId)) {
    return { ok: false, status: 403, message: "Forbidden: not a project member" };
  }

  return { ok: true, project };
}

/**
 * Express middleware: project id in req.params.id (e.g. PUT /projects/:id).
 * Sets req.project when allowed.
 */
async function requireProjectMember(req, res, next) {
  try {
    const result = await memberCheck(req.params.id, req.user.id);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    req.project = result.project;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Express middleware: task id in req.params.taskId (e.g. /comments/:taskId).
 * Reuses memberCheck on task.projectId. Sets req.task (lean, projectId only).
 */
async function requireTaskProjectMember(req, res, next) {
  try {
    const { taskId } = req.params;
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "Invalid taskId" });
    }

    const task = await Task.findById(taskId).select("projectId").lean();
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const result = await memberCheck(String(task.projectId), req.user.id);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    req.task = task;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  userIsProjectMember,
  memberCheck,
  requireProjectMember,
  requireTaskProjectMember,
};
