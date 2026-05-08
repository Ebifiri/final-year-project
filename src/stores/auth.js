import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api/client.js';

const TOKEN_KEY      = 'pau_token';
const LOGIN_AT_KEY   = 'pau_login_at';
const ACTIVE_AT_KEY  = 'pau_active_at';

// ── Timeout constants ─────────────────────────────────────────────────────────
// No absolute cap — active users should never be kicked out mid-session.
// The JWT's server-side expiry (7d) handles truly stale tokens.
const INACTIVITY_MS = 60 * 60 * 1000; // 1 hour idle

export const useAuthStore = defineStore('auth', () => {
  // ── State ────────────────────────────────────────────────────────────────────
  const token   = ref(localStorage.getItem(TOKEN_KEY)    || null);
  const user    = ref(null);
  const error   = ref(null);
  const loading = ref(false);

  // ── Getters ──────────────────────────────────────────────────────────────────
  const isLoggedIn = computed(() => !!token.value);

  // ── Internal helpers ──────────────────────────────────────────────────────────

  /** Record the current time as the last activity timestamp */
  function touchActivity() {
    if (token.value) localStorage.setItem(ACTIVE_AT_KEY, Date.now().toString());
  }

  /** Returns true if the user has been idle for more than 1 hour */
  function isSessionExpired() {
    if (!token.value) return false;
    const activeAt = parseInt(localStorage.getItem(ACTIVE_AT_KEY) || '0', 10);
    return Date.now() - activeAt > INACTIVITY_MS;
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Persist token + record timestamps */
  function setSession(newToken, newUser) {
    const now = Date.now().toString();
    token.value = newToken;
    user.value  = newUser;
    localStorage.setItem(TOKEN_KEY,     newToken);
    localStorage.setItem(LOGIN_AT_KEY,  now);
    localStorage.setItem(ACTIVE_AT_KEY, now);
  }

  /** POST /api/auth/login */
  async function login(email, password) {
    error.value   = null;
    loading.value = true;
    try {
      const data = await api.post('/api/auth/login', { email, password });
      setSession(data.token, data.user);
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** POST /api/auth/register */
  async function register(name, email, password) {
    error.value   = null;
    loading.value = true;
    try {
      const data = await api.post('/api/auth/register', { name, email, password });
      setSession(data.token, data.user);
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** GET /api/auth/me — re-hydrate user after a page refresh, or check expiry */
  async function fetchMe() {
    if (!token.value) return;

    // Check client-side expiry first (avoids a round-trip)
    if (isSessionExpired()) {
      logout();
      return;
    }

    try {
      const data = await api.get('/api/auth/me');
      user.value = data.user;
      touchActivity(); // successful API call = activity
    } catch {
      logout(); // token is invalid / expired on the server side
    }
  }

  /** Call on every meaningful user interaction to reset the idle timer */
  function recordActivity() {
    if (!token.value) return;
    if (isSessionExpired()) {
      logout();
      return;
    }
    touchActivity();
  }

  /** Clear everything */
  function logout() {
    token.value = null;
    user.value  = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LOGIN_AT_KEY);
    localStorage.removeItem(ACTIVE_AT_KEY);
  }

  return {
    token, user, error, loading, isLoggedIn,
    setSession, login, register, fetchMe, logout,
    recordActivity, isSessionExpired,
    INACTIVITY_MS,
  };
});
