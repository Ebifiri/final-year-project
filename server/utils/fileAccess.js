/**
 * fileAccess.js — shared helper for fetching resource files server-side.
 *
 * Cloudinary raw resources can require signed URLs when the account has
 * access-control settings that block unauthenticated delivery.
 * We generate a signed URL using the API secret stored in CLOUDINARY_URL
 * so server-side fetches always succeed regardless of account settings.
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
 * - If the resource has a filePublicId (Cloudinary), return a signed URL.
 * - Otherwise return the raw fileUrl (may be a local path or unsigned URL).
 */
export function getServerFetchUrl(resource) {
  const { fileUrl, filePublicId, mimeType } = resource;
  if (!fileUrl) return null;

  // For Cloudinary files use a signed URL — bypasses 401 from access control
  if (fileUrl.startsWith('http') && filePublicId) {
    return cloudinary.url(filePublicId, {
      resource_type: resourceType(mimeType),
      type:          'upload',
      sign_url:      true,   // includes HMAC-SHA1 signature using API_SECRET
      secure:        true,
    });
  }

  // Local filesystem path or unsigned URL (fallback)
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
