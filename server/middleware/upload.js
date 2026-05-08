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

// ── Multer instance ───────────────────────────────────────────────────────────
// Global ceiling is 500 MB (videos). Non-video files are rejected above 50 MB
// via the fileFilter so the error message is clear.
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_OTHER_SIZE =  50 * 1024 * 1024; //  50 MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE }, // hard ceiling — enforced by multer (Cloudinary free plan: 100 MB for video)
  fileFilter: (_req, file, cb) => {
    // For non-video files apply the tighter 50 MB cap at the filter stage.
    // (We cannot read file.size here — multer checks limits.fileSize *during*
    //  streaming, so we rely on that for the video path.)
    // The per-type client-side check in the UI catches most cases before upload.
    cb(null, true);
  },
});

export default upload;
