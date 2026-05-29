/**
 * Notification store — manages in-app notifications with polling.
 * Polls /api/notifications/unread-count every 30s when the user is logged in.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api/client.js';

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([]);
  const unreadAlertsCount   = ref(0);
  const unreadMessagesCount = ref(0);
  const loaded        = ref(false);

  const alerts = computed(() => notifications.value.filter(n => n.type !== 'feedback'));
  const messages = computed(() => notifications.value.filter(n => n.type === 'feedback'));

  let _pollTimer = null;

  // ── Fetch unread count (lightweight — for badge) ───────────────────────────
  async function fetchUnreadCount() {
    try {
      const data = await api.get('/api/notifications/unread-count');
      unreadAlertsCount.value = data.unreadAlerts ?? 0;
      unreadMessagesCount.value = data.unreadMessages ?? 0;
    } catch {
      // silently ignore — user might be logged out
    }
  }

  // ── Fetch full notification list ───────────────────────────────────────────
  async function fetchNotifications() {
    try {
      const data = await api.get('/api/notifications');
      notifications.value = data.notifications ?? [];
      unreadAlertsCount.value = alerts.value.filter(n => !n.read).length;
      unreadMessagesCount.value = messages.value.filter(n => !n.read).length;
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
      if (n) {
        n.read = true;
        if (n.type === 'feedback') {
          unreadMessagesCount.value = Math.max(0, unreadMessagesCount.value - 1);
        } else {
          unreadAlertsCount.value = Math.max(0, unreadAlertsCount.value - 1);
        }
      }
    } catch { /* ignore */ }
  }

  // ── Mark all as read ───────────────────────────────────────────────────────
  async function markAllRead() {
    try {
      await api.patch('/api/notifications/read-all');
      notifications.value.forEach(n => { n.read = true; });
      unreadAlertsCount.value = 0;
      unreadMessagesCount.value = 0;
    } catch { /* ignore */ }
  }

  // ── Clear all ──────────────────────────────────────────────────────────────
  async function clearAll(type = null) {
    try {
      const qs = type ? `?type=${type}` : (type === false ? '?excludeType=feedback' : '');
      await api.delete(`/api/notifications${qs}`);
      
      if (type === 'feedback') {
        notifications.value = notifications.value.filter(n => n.type !== 'feedback');
        unreadMessagesCount.value = 0;
      } else if (type === false) {
        notifications.value = notifications.value.filter(n => n.type === 'feedback');
        unreadAlertsCount.value = 0;
      } else {
        notifications.value = [];
        unreadAlertsCount.value = 0;
        unreadMessagesCount.value = 0;
      }
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
    unreadAlertsCount.value = 0;
    unreadMessagesCount.value = 0;
    loaded.value = false;
  }

  return {
    notifications,
    alerts,
    messages,
    unreadAlertsCount,
    unreadMessagesCount,
    loaded,
    fetchUnreadCount,
    fetchNotifications,
    markRead,
    markAllRead,
    clearAll,
    startPolling,
    stopPolling,
    reset,
  };
});
