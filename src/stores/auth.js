import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api/client.js';

const TOKEN_KEY = 'pau_token';

export const useAuthStore = defineStore('auth', () => {
  // ── State ────────────────────────────────────────────────────────────────────
  const token = ref(localStorage.getItem(TOKEN_KEY) || null);
  const user  = ref(null);
  const error = ref(null);
  const loading = ref(false);

  // ── Getters ──────────────────────────────────────────────────────────────────
  const isLoggedIn = computed(() => !!token.value);

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Persist token + fetch the user profile */
  function setSession(newToken, newUser) {
    token.value = newToken;
    user.value  = newUser;
    localStorage.setItem(TOKEN_KEY, newToken);
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

  /** GET /api/auth/me — re-hydrate user after a page refresh */
  async function fetchMe() {
    if (!token.value) return;
    try {
      const data = await api.get('/api/auth/me');
      user.value = data.user;
    } catch {
      logout(); // token is invalid / expired
    }
  }

  /** Clear everything */
  function logout() {
    token.value = null;
    user.value  = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  return { token, user, error, loading, isLoggedIn, setSession, login, register, fetchMe, logout };
});
