const express = require("express");
const router = express.Router();
const { profile , updateProfile} = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");

router.get("/profile", auth, profile);
router.patch("/profile", auth, updateProfile);

module.exports = router;