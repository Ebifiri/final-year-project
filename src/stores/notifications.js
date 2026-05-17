/**
 * Notification store — manages in-app notifications with polling.
 * Polls /api/notifications/unread-count every 30s when the user is logged in.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api/client.js';

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([]);
  const unreadCount   = ref(0);
  const loaded        = ref(false);

  let _pollTimer = null;

  // ── Fetch unread count (lightweight — for badge) ───────────────────────────
  async function fetchUnreadCount() {
    try {
      const data = await api.get('/api/notifications/unread-count');
      unreadCount.value = data.count ?? 0;
    } catch {
      // silently ignore — user might be logged out
    }
  }

  // ── Fetch full notification list ───────────────────────────────────────────
  async function fetchNotifications() {
    try {
      const data = await api.get('/api/notifications');
      notifications.value = data.notifications ?? [];
      unreadCount.value = notifications.value.filter(n => !n.read).length;
      loaded.value = true;
    } catch {
      notifications.value = [];
    }
  }

  // ── Mark single notification as read ───────────────────────────────────────
  async function markRead(id) {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      const n = notifications.value.find(x => x._id === id);
      if (n) n.read = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch { /* ignore */ }
  }

  // ── Mark all as read ───────────────────────────────────────────────────────
  async function markAllRead() {
    try {
      await api.patch('/api/notifications/read-all');
      notifications.value.forEach(n => { n.read = true; });
      unreadCount.value = 0;
    } catch { /* ignore */ }
  }

  // ── Polling ────────────────────────────────────────────────────────────────
  function startPolling() {
    stopPolling();
    fetchUnreadCount(); // immediate first check
    _pollTimer = setInterval(fetchUnreadCount, 30_000);
  }

  function stopPolling() {
    if (_pollTimer) {
      clearInterval(_pollTimer);
      _pollTimer = null;
    }
  }

  function reset() {
    stopPolling();
    notifications.value = [];
    unreadCount.value = 0;
    loaded.value = false;
  }

  return {
    notifications,
    unreadCount,
    loaded,
    fetchUnreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
    startPolling,
    stopPolling,
    reset,
  };
});
