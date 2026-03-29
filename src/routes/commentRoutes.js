const express = require('express');
const router = express.Router();

const { addComment, getComments } = require('../controllers/commentController');
const auth = require('../middleware/authMiddleware');
const { requireTaskProjectMember } = require('../utils/projectAccess');

router.use(auth);

router.post('/:taskId', requireTaskProjectMember, addComment);
router.get('/:taskId', requireTaskProjectMember, getComments);

module.exports = router;
