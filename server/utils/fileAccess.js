import { v2 as cloudinary } from 'cloudinary';

/**
 * Return the URL to use for server-side fetching.
 * - Cloudinary (http) → signed API URL to bypass PDF 401 restrictions
 * - Local filesystem  → the raw path (dev fallback)
 */
export function getServerFetchUrl(resource) {
  if (!resource.fileUrl) return null;

  // Local filesystem
  if (!resource.fileUrl.startsWith('http')) {
    return resource.fileUrl;
  }

  // Cloudinary — generate a signed download URL.
  // We DO NOT pass a format parameter because our publicIds already include
  // the file extension (e.g. pau-lms/12345-slides.pdf). If we passed 'pdf',
  // Cloudinary would look for '.pdf.pdf' and return a 404.
  const isVideo = resource.mimeType?.startsWith('video/') || resource.mimeType?.startsWith('audio/');
  const resourceType = isVideo ? 'video' : 'raw';

  return cloudinary.utils.private_download_url(
    resource.filePublicId,
    '', // empty format to avoid duplicate extensions!
    { resource_type: resourceType }
  );
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
