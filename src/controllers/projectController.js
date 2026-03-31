const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");
const { normalizeEmail } = require("../utils/userInput");

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.create({
        name,
        description,
        createdBy: req.user.id,
        members: [req.user.id]
      });
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getProjects = async (req, res) => {
  try {
    const filter = {
        $or: [
          { createdBy: req.user.id },
          { members: req.user.id },
        ],
      };
    const projects = await Project.find(filter).populate('createdBy', 'name email').populate('members', 'name email');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const project = await Project.findByIdAndUpdate(id, { name, description }, { new: true });
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const addProjectMember = async (req, res) => {
  try {
    const project = req.project;
    if (String(project.createdBy) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "Only the project owner can add members" });
    }

    const { userId: rawUserId, email: rawEmail } = req.body;
    let memberId = null;

    if (rawUserId != null && String(rawUserId).trim() !== "") {
      const uid = String(rawUserId).trim();
      if (!mongoose.Types.ObjectId.isValid(uid)) {
        return res.status(400).json({ message: "Invalid userId" });
      }
      memberId = uid;
    } else if (rawEmail != null && String(rawEmail).trim() !== "") {
      const email = normalizeEmail(rawEmail);
      const user = await User.findOne({ email }).select("_id");
      if (!user) {
        return res
          .status(404)
          .json({ message: "No user registered with that email" });
      }
      memberId = String(user._id);
    } else {
      return res.status(400).json({ message: "Provide userId or email" });
    }

    if (
      project.members &&
      project.members.some((m) => String(m) === memberId)
    ) {
      return res.status(400).json({ message: "User is already a member" });
    }
    if (String(project.createdBy) === memberId) {
      return res.status(400).json({ message: "User is already the owner" });
    }

    const updated = await Project.findByIdAndUpdate(
      project._id,
      { $addToSet: { members: memberId } },
      { new: true }
    )
      .populate("createdBy", "name email")
      .populate("members", "name email");

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  addProjectMember,
};