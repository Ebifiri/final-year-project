import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── MIME → Cloudinary resource_type ───────────────────────────────────────────
// Cloudinary only accepts 'image', 'video', or 'raw'.
// Office docs, PDFs, archives, code files etc. MUST use 'raw'.
function cloudinaryResourceType(mimetype = '') {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/') || mimetype.startsWith('audio/')) return 'video';
  return 'raw';
}

let storage;

if (process.env.CLOUDINARY_URL) {
  // ── Production: Cloudinary ─────────────────────────────────────────────────
  console.log('📦 Upload storage: Cloudinary');
  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:        'pau-lms',
      resource_type: cloudinaryResourceType(file.mimetype),
      public_id:     `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`,
    }),
  });
} else {
  // ── Development: local disk ────────────────────────────────────────────────
  // Use a folder inside the project so it works cross-platform (Windows + Linux)
  const uploadDir = join(__dirname, '../../uploads');
  mkdirSync(uploadDir, { recursive: true }); // create if it doesn't exist
  console.log(`📦 Upload storage: local disk (${uploadDir})`);
  console.log('⚠️  CLOUDINARY_URL not set — files saved locally and will not persist on Render');

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
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
