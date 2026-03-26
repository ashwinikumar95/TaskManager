const Comment = require('../models/Comment');

exports.addComment = async (req, res) => {
  try {
    const comment = await Comment.create({
      text: req.body.text,
      userId: req.user.id,     // from middleware
      taskId: req.params.taskId
    });

    res.status(201).json(comment);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getComments = async (req, res) => {
    try {
      const comments = await Comment.find({
        taskId: req.params.taskId
      }).populate('userId', 'name');
  
      res.json(comments);
  
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };