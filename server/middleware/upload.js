import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── MIME → Cloudinary resource_type ───────────────────────────────────────────
function cloudinaryResourceType(mimetype = '') {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/') || mimetype.startsWith('audio/')) return 'video';
  return 'raw';
}

// ── Custom Cloudinary storage engine (replaces multer-storage-cloudinary) ─────
// Pipes the incoming file stream directly into Cloudinary's upload_stream API.
// This avoids the multer-storage-cloudinary peer-dependency conflict entirely.
class CloudinaryStorage {
  _handleFile(req, file, cb) {
    const resourceType = cloudinaryResourceType(file.mimetype);
    const publicId     = `pau-lms/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, public_id: publicId },
      (err, result) => {
        if (err) return cb(err);
        // multer stores these on req.file:
        //   path     → fileUrl  (the Cloudinary secure_url)
        //   filename → filePublicId
        cb(null, {
          path:     result.secure_url,
          filename: result.public_id,
          size:     result.bytes,
        });
      }
    );

    file.stream.pipe(uploadStream);
  }

  _removeFile(_req, file, cb) {
    const resourceType = cloudinaryResourceType(file.mimetype);
    cloudinary.uploader.destroy(file.filename, { resource_type: resourceType }, cb);
  }
}

// ── Storage selection ─────────────────────────────────────────────────────────
let storage;

if (process.env.CLOUDINARY_URL) {
  console.log('📦 Upload storage: Cloudinary');
  storage = new CloudinaryStorage();
} else {
  const uploadDir = join(__dirname, '../../uploads');
  mkdirSync(uploadDir, { recursive: true });
  console.log(`📦 Upload storage: local disk (${uploadDir})`);
  console.log('⚠️  CLOUDINARY_URL not set — files saved locally and will not persist on Render');

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  });
}

// ── Multer instance ───────────────────────────────────────────────────────────
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB (Cloudinary free plan limit)
const MAX_OTHER_SIZE =  50 * 1024 * 1024; //  50 MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (_req, _file, cb) => cb(null, true),
});

export default upload;
