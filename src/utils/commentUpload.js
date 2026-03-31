const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../../config');

const MAX_FILES = 10;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
]);

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, config.uploadsDir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname || '') || '';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
  fileFilter(_req, file, cb) {
    const mime = file.mimetype || '';
    if (!ALLOWED_MIME.has(mime)) {
      return cb(new Error('UNSUPPORTED_MIME'));
    }
    cb(null, true);
  },
});

function optionalCommentFiles(req, res, next) {
  if (req.is('multipart/form-data')) {
    return upload.array('files', MAX_FILES)(req, res, (err) => {
      if (!err) return next();
      if (err.message === 'UNSUPPORTED_MIME') {
        return res.status(400).json({
          message: 'Unsupported file type; allowed: images, PDF, plain text',
        });
      }
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large (max 5MB each)' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ message: `Too many files (max ${MAX_FILES})` });
        }
        return res.status(400).json({ message: err.message });
      }
      return next(err);
    });
  }
  next();
}

module.exports = {
  upload,
  optionalCommentFiles,
  MAX_FILES,
};
