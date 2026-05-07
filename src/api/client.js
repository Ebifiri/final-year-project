/**
 * API client — thin fetch wrapper that:
 *  - Prefixes every request with the backend base URL
 *  - Attaches the JWT from localStorage as a Bearer token
 *  - Throws a unified Error on non-2xx responses
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const token = localStorage.getItem('pau_token');

  // Don't force Content-Type for FormData — browser sets it with the correct boundary
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed: ${res.status}`);
  }

  return data;
}

export const api = {
  get:      (path)         => request(path),
  post:     (path, body)   => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  postForm: (path, form)   => request(path, { method: 'POST',   body: form }),   // FormData
  patch:    (path, body)   => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete:   (path)         => request(path, { method: 'DELETE' }),
};
