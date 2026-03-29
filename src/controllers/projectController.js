const Project = require("../models/Project");

const createProject = async (req, res) => {
  try {
    console.log(req.body);
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

module.exports = {
  createProject,
  getProjects, 
  updateProject,
  deleteProject
};