import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// ── MIME → Cloudinary resource_type ───────────────────────────────────────────
// Cloudinary only accepts 'image', 'video', or 'raw'.
// Office docs, PDFs, archives, code etc. MUST use 'raw'.
function cloudinaryResourceType(mimetype = '') {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/') || mimetype.startsWith('audio/')) return 'video';
  return 'raw';
}

let storage;

if (process.env.CLOUDINARY_URL) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:          'pau-lms',
      resource_type:   cloudinaryResourceType(file.mimetype),
      // public_id is derived from timestamp + original name (spaces → underscores)
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
    }),
  });
} else {
  // Development fallback — save locally
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, '/tmp/pau-uploads'),
    filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
}

// ── Multer instance — 50 MB limit, any file type ──────────────────────────────
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});

export default upload;
