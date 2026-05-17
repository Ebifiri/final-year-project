import { v2 as cloudinary } from 'cloudinary';

/**
 * fileAccess.js — Cloudinary file fetching with triple-strategy fallback.
 *
 * Strategy 1: Direct secure_url (works for images, videos, and PDFs if delivery is enabled).
 * Strategy 2: Signed delivery URL using cloudinary.url() with sign_url:true.
 * Strategy 3: Cloudinary private_download_url (API-level signed download).
 *
 * For the "redirect" approach, we generate a URL and redirect the client
 * directly to Cloudinary instead of proxying (avoids timeout/memory issues).
 */

// ── MIME → Cloudinary resource_type ─────────────────────────────────────────
function getResourceType(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return 'video';
  return 'raw';
}

// ── Strategy 2: Signed delivery URL ─────────────────────────────────────────
function buildSignedDeliveryUrl(resource) {
  if (!resource.filePublicId) return null;
  const resourceType = getResourceType(resource.mimeType);
  try {
    // Generate a signed URL: https://res.cloudinary.com/.../s--SIGNATURE--/publicId
    return cloudinary.url(resource.filePublicId, {
      resource_type: resourceType,
      type: 'upload',
      sign_url: true,
      secure: true,
    });
  } catch (err) {
    console.error('[fileAccess] Signed delivery URL failed:', err.message);
    return null;
  }
}

// ── Strategy 3: Private download URL (API-level) ────────────────────────────
function buildPrivateDownloadUrl(resource) {
  if (!resource.filePublicId) return null;
  const resourceType = getResourceType(resource.mimeType);
  try {
    return cloudinary.utils.private_download_url(
      resource.filePublicId,
      '', // no format suffix — publicId already has the extension
      { resource_type: resourceType }
    );
  } catch (err) {
    console.error('[fileAccess] private_download_url failed:', err.message);
    return null;
  }
}

/**
 * Get ALL possible download URLs for a resource — useful for diagnostics.
 */
export function getAllUrls(resource) {
  return {
    directUrl:         resource.fileUrl || null,
    signedDeliveryUrl: buildSignedDeliveryUrl(resource),
    privateDownloadUrl: buildPrivateDownloadUrl(resource),
  };
}

/**
 * Return the best URL to use for server-side fetching.
 */
export function getServerFetchUrl(resource) {
  if (!resource.fileUrl) return null;
  if (!resource.fileUrl.startsWith('http')) return resource.fileUrl; // local path
  return resource.fileUrl;
}

/**
 * Try fetching from a URL. Returns { ok, status, response } or { ok: false, status, error }.
 */
async function tryFetch(url, label) {
  try {
    console.log(`[fileAccess] ${label}: ${url}`);
    const resp = await fetch(url);
    if (resp.ok) {
      console.log(`[fileAccess] ${label}: SUCCESS (${resp.status})`);
      return { ok: true, status: resp.status, response: resp };
    }
    console.warn(`[fileAccess] ${label}: FAILED (${resp.status})`);
    return { ok: false, status: resp.status };
  } catch (err) {
    console.error(`[fileAccess] ${label}: ERROR - ${err.message}`);
    return { ok: false, status: 0, error: err.message };
  }
}

/**
 * Fetch a resource as a Buffer — tries all 3 strategies.
 */
export async function fetchResourceBuffer(resource) {
  if (!resource.fileUrl) throw new Error('Resource has no file URL');

  // Local filesystem
  if (!resource.fileUrl.startsWith('http')) {
    const { readFile } = await import('fs/promises');
    const { existsSync } = await import('fs');
    if (!existsSync(resource.fileUrl)) {
      throw new Error('File not found on disk. Re-upload with CLOUDINARY_URL configured.');
    }
    return readFile(resource.fileUrl);
  }

  // Strategy 1: Direct secure_url
  const direct = await tryFetch(resource.fileUrl, 'Strategy1-DirectURL');
  if (direct.ok) return Buffer.from(await direct.response.arrayBuffer());

  // Strategy 2: Signed delivery URL
  const signedUrl = buildSignedDeliveryUrl(resource);
  if (signedUrl) {
    const signed = await tryFetch(signedUrl, 'Strategy2-SignedDelivery');
    if (signed.ok) return Buffer.from(await signed.response.arrayBuffer());
  }

  // Strategy 3: Private download URL (API)
  const apiUrl = buildPrivateDownloadUrl(resource);
  if (apiUrl) {
    const api = await tryFetch(apiUrl, 'Strategy3-PrivateDownload');
    if (api.ok) return Buffer.from(await api.response.arrayBuffer());
  }

  throw new Error(
    `All download strategies failed for "${resource.title}". ` +
    `Direct: HTTP ${direct.status}. ` +
    (signedUrl ? `Signed: tried. ` : 'Signed: no publicId. ') +
    (apiUrl    ? `API: tried. `    : 'API: no publicId. ') +
    'Check Cloudinary Settings → Security → "Restricted media types" — ensure PDF is NOT listed.'
  );
}

/**
 * Fetch a resource as a readable stream — tries all 3 strategies.
 */
export async function fetchResourceStream(resource) {
  if (!resource.fileUrl) throw new Error('Resource has no file URL');

  if (!resource.fileUrl.startsWith('http')) {
    const { createReadStream, existsSync, statSync } = await import('fs');
    if (!existsSync(resource.fileUrl)) throw new Error('File not found on disk.');
    return { stream: createReadStream(resource.fileUrl), size: statSync(resource.fileUrl).size };
  }

  // Try strategies in order
  const urls = [
    { url: resource.fileUrl,                 label: 'DirectURL' },
    { url: buildSignedDeliveryUrl(resource), label: 'SignedDelivery' },
    { url: buildPrivateDownloadUrl(resource), label: 'PrivateDownload' },
  ].filter(u => u.url);

  for (const { url, label } of urls) {
    const result = await tryFetch(url, label);
    if (result.ok) {
      const len = result.response.headers.get('content-length');
      return { stream: result.response.body, size: len ? parseInt(len, 10) : null, isWeb: true };
    }
  }

  throw new Error(`Failed to fetch file — all ${urls.length} strategies failed.`);
}

/**
 * Get a working download URL for client-side redirect (avoids proxying entirely).
 * Tests each URL with a HEAD request and returns the first one that responds 200.
 * Returns null if none work.
 */
export async function getWorkingDownloadUrl(resource) {
  if (!resource.fileUrl || !resource.fileUrl.startsWith('http')) return null;

  const urls = [
    { url: resource.fileUrl,                 label: 'DirectURL' },
    { url: buildSignedDeliveryUrl(resource), label: 'SignedDelivery' },
    { url: buildPrivateDownloadUrl(resource), label: 'PrivateDownload' },
  ].filter(u => u.url);

  for (const { url, label } of urls) {
    try {
      console.log(`[getWorkingUrl] HEAD ${label}: ${url}`);
      const resp = await fetch(url, { method: 'HEAD' });
      if (resp.ok) {
        console.log(`[getWorkingUrl] ${label} works! (${resp.status})`);
        return url;
      }
      console.warn(`[getWorkingUrl] ${label} failed: ${resp.status}`);
    } catch (err) {
      console.warn(`[getWorkingUrl] ${label} error: ${err.message}`);
    }
  }

  return null;
}
