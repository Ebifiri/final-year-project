import { v2 as cloudinary } from 'cloudinary';

// Cloudinary is configured via CLOUDINARY_URL env var (set on Render)
// Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
}

export default cloudinary;
