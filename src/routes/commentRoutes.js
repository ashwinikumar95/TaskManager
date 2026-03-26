const express = require('express');
const router = express.Router();

const { addComment, getComments } = require('../controllers/commentController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.post('/:taskId', addComment);
router.get('/:taskId', getComments);

module.exports = router;