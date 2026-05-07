import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

let storage;

if (process.env.CLOUDINARY_URL) {
  // Production: upload to Cloudinary
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:        'pau-lms',
      resource_type: 'auto',   // handles PDFs, Office docs, images, video, etc.
      allowed_formats: [
        'pdf',
        'doc', 'docx',
        'ppt', 'pptx',
        'xls', 'xlsx',
        'txt', 'csv',
        'zip', 'rar',
        'png', 'jpg', 'jpeg', 'gif', 'webp',
        'mp4', 'mov', 'avi', 'webm',
        'mp3', 'wav',
      ],
    },
  });
} else {
  // Development fallback: save to a local temp dir
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, '/tmp/pau-uploads'),
    filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
}

// ── Allowed MIME types ─────────────────────────────────────────────────────────
const ALLOWED_MIME = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Presentations
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Spreadsheets
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Text / data
  'text/plain',
  'text/csv',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-zip-compressed',
  // Images
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  // Video
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
  // Audio
  'audio/mpeg', 'audio/wav',
]);

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}. Please upload a PDF, Office document, image, or video.`));
  }
}

// ── Multer instance ────────────────────────────────────────────────────────────
// 50 MB max — covers lecture slides, videos, and assignment submissions
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export default upload;
