/**
 * fileAccess.js — shared helper for fetching resource files server-side.
 *
 * Strategy: fetch the Cloudinary secure_url (stored as resource.fileUrl) directly.
 * For upload-type Cloudinary resources the secure_url is publicly accessible —
 * no signing required. Previous attempts to use private_download_url caused
 * HTTP 404 errors because Cloudinary misinterprets the format parameter when
 * the file extension is already embedded in the public_id.
 */

/**
 * Return the URL to use for server-side fetching.
 * - Cloudinary (http) → fileUrl directly (the secure_url from upload)
 * - Local filesystem  → the raw path (dev fallback)
 */
export function getServerFetchUrl(resource) {
  return resource.fileUrl || null;
}

/**
 * Fetch a resource's file and return a Node.js Buffer.
 * Throws a descriptive Error if the file cannot be loaded.
 */
export async function fetchResourceBuffer(resource) {
  const url = getServerFetchUrl(resource);
  if (!url) throw new Error('Resource has no file URL');

  if (url.startsWith('http')) {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      throw new Error(
        `Failed to fetch file from Cloudinary (HTTP ${upstream.status} ${upstream.statusText}). ` +
        'Make sure CLOUDINARY_URL is set in your Render environment and the file was uploaded after Cloudinary was configured.'
      );
    }
    return Buffer.from(await upstream.arrayBuffer());
  }

  // Local filesystem (dev — CLOUDINARY_URL not set)
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
