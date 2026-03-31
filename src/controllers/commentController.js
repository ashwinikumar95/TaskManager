const Comment = require('../models/Comment');

function buildAttachmentsFromFiles(files) {
  if (!files || !files.length) return [];
  return files.map((f) => ({
    originalName: f.originalname || 'file',
    storedName: f.filename,
    mimeType: f.mimetype,
    size: f.size,
    urlPath: `/uploads/${f.filename}`,
  }));
}

exports.addComment = async (req, res) => {
  try {
    const text =
      req.body.text != null && typeof req.body.text === 'string'
        ? req.body.text.trim()
        : '';
    const attachments = buildAttachmentsFromFiles(req.files);

    if (!text && attachments.length === 0) {
      return res.status(400).json({
        message: 'Provide comment text and/or at least one file',
      });
    }

    const comment = await Comment.create({
      text,
      attachments,
      userId: req.user.id,
      taskId: req.params.taskId,
    });

    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      taskId: req.params.taskId,
    }).populate('userId', 'name');

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
