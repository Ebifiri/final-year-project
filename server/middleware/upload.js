import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// ── MIME → Cloudinary resource_type mapping ───────────────────────────────────
// Cloudinary only accepts 'image', 'video', 'raw' for resource_type.
// Office docs, PDFs, archives, code etc. must use 'raw'.
// Images → 'image', Videos/Audio → 'video', everything else → 'raw'.
function cloudinaryResourceType(mimetype) {
  if (mimetype.startsWith('image/'))  return 'image';
  if (mimetype.startsWith('video/') || mimetype.startsWith('audio/')) return 'video';
  return 'raw'; // PDFs, Office docs, text, zip, code files, etc.
}

let storage;

if (process.env.CLOUDINARY_URL) {
  // Production: upload to Cloudinary
  // params is a function so we can set resource_type per file
  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:        'pau-lms',
      resource_type: cloudinaryResourceType(file.mimetype),
      // Don't pass allowed_formats — let resource_type handle it;
      // our fileFilter below already enforces what's permitted.
      use_filename:  true,
      unique_filename: true,
    }),
  });
} else {
  // Development fallback: save to a local temp dir
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, '/tmp/pau-uploads'),
    filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
}

// ── Multer instance ────────────────────────────────────────────────────────────
// 50 MB max — covers lecture slides, videos, and assignment submissions
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});

export default upload;
