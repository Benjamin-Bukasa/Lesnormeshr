const fs = require('fs');
const path = require('path');

const multer = require('multer');

const talentUploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'talent');
const profileUploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'profiles');
const employeeUploadDirectory = path.join(__dirname, '..', '..', 'uploads', 'employees');

fs.mkdirSync(talentUploadDirectory, { recursive: true });
fs.mkdirSync(profileUploadDirectory, { recursive: true });
fs.mkdirSync(employeeUploadDirectory, { recursive: true });

function sanitizeFilename(value) {
  return String(value || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function createStorage(directory) {
  return multer.diskStorage({
    destination(req, file, cb) {
      cb(null, directory);
    },
    filename(req, file, cb) {
      const extension = path.extname(file.originalname || '');
      const baseName = path.basename(file.originalname || 'document', extension);
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${sanitizeFilename(baseName)}-${uniqueSuffix}${extension}`);
    },
  });
}

function imageFileFilter(req, file, cb) {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
    return;
  }

  cb(null, true);
}

const upload = multer({
  storage: createStorage(talentUploadDirectory),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const employeeDocumentUpload = multer({
  storage: createStorage(employeeUploadDirectory),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const profileAvatarUpload = multer({
  storage: createStorage(profileUploadDirectory),
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

module.exports = {
  employeeDocumentUpload,
  employeeUploadDirectory,
  profileAvatarUpload,
  profileUploadDirectory,
  upload,
  talentUploadDirectory,
};
