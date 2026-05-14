import { v2 as cloudinary } from 'cloudinary';

/**
 * fileAccess.js — Cloudinary file fetching with dual-strategy fallback.
 *
 * Strategy 1: Fetch the stored secure_url (resource.fileUrl) directly.
 *             This works for images, videos, and — if the user has enabled
 *             PDF/ZIP delivery in Cloudinary settings — also for PDFs.
 *
 * Strategy 2: If the direct URL returns 401/403, fall back to a signed
 *             Cloudinary API download URL (private_download_url).
 *             This requires filePublicId to be set on the resource.
 */

/**
 * Build a signed Cloudinary API download URL as a fallback.
 * Returns null if filePublicId is missing.
 */
function buildSignedUrl(resource) {
  if (!resource.filePublicId) return null;

  const isImage = resource.mimeType?.startsWith('image/');
  const isVideo = resource.mimeType?.startsWith('video/') || resource.mimeType?.startsWith('audio/');
  const resourceType = isImage ? 'image' : isVideo ? 'video' : 'raw';

  try {
    return cloudinary.utils.private_download_url(
      resource.filePublicId,
      '',  // no format — publicId already includes the extension
      { resource_type: resourceType }
    );
  } catch (err) {
    console.error('[fileAccess] private_download_url failed:', err.message);
    return null;
  }
}

/**
 * Return the best URL to use for server-side fetching.
 * Prefers the direct secure_url; signed URL is available as fallback.
 */
export function getServerFetchUrl(resource) {
  if (!resource.fileUrl) return null;
  if (!resource.fileUrl.startsWith('http')) return resource.fileUrl; // local path
  return resource.fileUrl;
}

/**
 * Fetch a resource's file and return a Node.js Buffer.
 * Tries the direct URL first, then falls back to the signed API URL.
 * Throws a descriptive Error if both fail.
 */
export async function fetchResourceBuffer(resource) {
  if (!resource.fileUrl) throw new Error('Resource has no file URL');

  // Local filesystem (dev — CLOUDINARY_URL not set)
  if (!resource.fileUrl.startsWith('http')) {
    const { readFile } = await import('fs/promises');
    const { existsSync } = await import('fs');
    if (!existsSync(resource.fileUrl)) {
      throw new Error(
        'File not found on disk. Re-upload the file with CLOUDINARY_URL configured.'
      );
    }
    return readFile(resource.fileUrl);
  }

  // ── Strategy 1: Direct secure_url ──────────────────────────────────────────
  console.log(`[fileAccess] Trying direct URL: ${resource.fileUrl}`);
  const directRes = await fetch(resource.fileUrl);

  if (directRes.ok) {
    console.log('[fileAccess] Direct URL succeeded');
    return Buffer.from(await directRes.arrayBuffer());
  }

  console.warn(`[fileAccess] Direct URL failed: HTTP ${directRes.status}`);

  // ── Strategy 2: Signed API URL fallback ────────────────────────────────────
  const signedUrl = buildSignedUrl(resource);
  if (!signedUrl) {
    throw new Error(
      `Failed to fetch file (HTTP ${directRes.status}). ` +
      'No filePublicId available for signed fallback. Re-upload the file.'
    );
  }

  console.log(`[fileAccess] Trying signed URL: ${signedUrl}`);
  const signedRes = await fetch(signedUrl);

  if (signedRes.ok) {
    console.log('[fileAccess] Signed URL succeeded');
    return Buffer.from(await signedRes.arrayBuffer());
  }

  console.error(`[fileAccess] Signed URL also failed: HTTP ${signedRes.status}`);
  throw new Error(
    `Failed to fetch file. Direct URL: HTTP ${directRes.status}, Signed URL: HTTP ${signedRes.status}. ` +
    'Check Cloudinary dashboard → Settings → Security → ensure PDF/ZIP delivery is allowed.'
  );
}

/**
 * Fetch a resource's file as a readable stream (for piping to the HTTP response).
 * Same dual-strategy as fetchResourceBuffer but returns a web ReadableStream.
 */
export async function fetchResourceStream(resource) {
  if (!resource.fileUrl) throw new Error('Resource has no file URL');

  if (!resource.fileUrl.startsWith('http')) {
    const { createReadStream, existsSync, statSync } = await import('fs');
    if (!existsSync(resource.fileUrl)) {
      throw new Error('File not found on disk.');
    }
    return { stream: createReadStream(resource.fileUrl), size: statSync(resource.fileUrl).size };
  }

  // Strategy 1: Direct URL
  console.log(`[fetchStream] Trying direct URL: ${resource.fileUrl}`);
  let upstream = await fetch(resource.fileUrl);

  if (!upstream.ok) {
    console.warn(`[fetchStream] Direct URL failed: HTTP ${upstream.status}`);

    // Strategy 2: Signed URL
    const signedUrl = buildSignedUrl(resource);
    if (signedUrl) {
      console.log(`[fetchStream] Trying signed URL: ${signedUrl}`);
      upstream = await fetch(signedUrl);
    }

    if (!upstream.ok) {
      const status = upstream.status;
      console.error(`[fetchStream] All strategies failed: HTTP ${status}`);
      throw new Error(`Failed to fetch file (HTTP ${status})`);
    }
  }

  console.log('[fetchStream] Success');
  const len = upstream.headers.get('content-length');
  return { stream: upstream.body, size: len ? parseInt(len, 10) : null, isWeb: true };
}
