const express = require("express");
const router = express.Router();
const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  addProjectMember,
} = require("../controllers/projectController");
const auth = require("../middleware/authMiddleware");
const { requireProjectMember } = require("../utils/projectAccess");

router.use(auth);

router.post("/", createProject);
router.get("/", getProjects);
router.post("/:id/members", requireProjectMember, addProjectMember);
router.put("/:id", requireProjectMember, updateProject);
router.delete("/:id", requireProjectMember, deleteProject);

module.exports = router;