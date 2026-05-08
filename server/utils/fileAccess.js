/**
 * fileAccess.js — shared helper for fetching resource files server-side.
 *
 * WHY private_download_url instead of signed delivery URLs?
 * ---------------------------------------------------------
 * cloudinary.url() + sign_url:true generates a *delivery* URL
 * (res.cloudinary.com) which can still return 401 when the Cloudinary
 * account has strict access-control or CDN restrictions on the free plan.
 *
 * cloudinary.utils.private_download_url() generates a URL that hits the
 * Cloudinary *API* endpoint (api.cloudinary.com/v1_1/…) instead, which:
 *  - Always authenticates with your API key + secret (no CDN restrictions)
 *  - Returns the original file bytes directly
 *  - Works regardless of the account's delivery access-control settings
 */
import { v2 as cloudinary } from 'cloudinary';

// Map MIME type → Cloudinary resource_type
function resourceType(mimeType = '') {
  if (mimeType.startsWith('image/'))  return 'image';
  if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return 'video';
  return 'raw'; // PDFs, Office files, archives, etc.
}

/**
 * Return the best URL for server-side fetching of a resource.
 * - If the resource has a filePublicId (Cloudinary), return a private download URL.
 * - Otherwise return the raw fileUrl (local filesystem path in dev).
 */
export function getServerFetchUrl(resource) {
  const { fileUrl, filePublicId, mimeType } = resource;
  if (!fileUrl) return null;

  if (fileUrl.startsWith('http') && filePublicId) {
    const resType = resourceType(mimeType);

    // Extract the file extension from the public_id so Cloudinary knows the format.
    // public_id is stored as e.g. "pau-lms/1234567890-filename.pdf"
    const lastSegment = filePublicId.split('/').pop() ?? '';
    const dotIdx      = lastSegment.lastIndexOf('.');
    const format      = dotIdx > -1 ? lastSegment.slice(dotIdx + 1) : '';

    // private_download_url hits api.cloudinary.com (not the delivery CDN),
    // so it is immune to access-control 401s on the free plan.
    return cloudinary.utils.private_download_url(filePublicId, format, {
      resource_type: resType,
      expires_at:    Math.floor(Date.now() / 1000) + 3600, // valid for 1 hour
    });
  }

  // Local filesystem path (dev — CLOUDINARY_URL not set)
  return fileUrl;
}

/**
 * Fetch a resource's file and return a Node.js Buffer.
 * Throws an Error (with a descriptive message) if the file cannot be loaded.
 */
export async function fetchResourceBuffer(resource) {
  const url = getServerFetchUrl(resource);
  if (!url) throw new Error('Resource has no file URL');

  if (url.startsWith('http')) {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      throw new Error(
        `Cloudinary returned HTTP ${upstream.status} ${upstream.statusText}. ` +
        'Check that CLOUDINARY_URL is correctly set in your Render environment.'
      );
    }
    return Buffer.from(await upstream.arrayBuffer());
  }

  // Local filesystem
  const { readFile } = await import('fs/promises');
  const { existsSync } = await import('fs');
  if (!existsSync(url)) {
    throw new Error(
      'File not found on disk. This usually means the file was uploaded before ' +
      'CLOUDINARY_URL was set. Re-upload the file to persist it on Cloudinary.'
    );
  }
  return readFile(url);
}
