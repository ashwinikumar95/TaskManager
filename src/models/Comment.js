const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: String,
    size: Number,
    urlPath: { type: String, required: true },
  },
  { _id: true }
);

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, default: '' },

    attachments: [attachmentSchema],

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);