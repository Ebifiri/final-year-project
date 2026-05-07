import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api/client.js';

export const useEnrollmentStore = defineStore('enrollments', () => {
  // ── State ────────────────────────────────────────────────────────────────────
  const enrollments = ref([]);
  const loading     = ref(false);
  const error       = ref(null);

  // ── Getters ──────────────────────────────────────────────────────────────────

  /** Set of enrolled course codes for quick lookup */
  const enrolledCodes = computed(() =>
    new Set(enrollments.value.map(e => e.course?.code))
  );

  /** Sorted by lastAccessed desc — for "Recently Accessed" */
  const recentEnrollments = computed(() =>
    [...enrollments.value]
      .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
      .slice(0, 6)
  );

  function isEnrolled(courseCode) {
    return enrolledCodes.value.has(courseCode);
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** GET /api/enrollments */
  async function fetchEnrollments() {
    loading.value = true;
    error.value   = null;
    try {
      const data = await api.get('/api/enrollments');
      enrollments.value = data.enrollments;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  /** POST /api/enrollments */
  async function enroll(courseCode) {
    try {
      const data = await api.post('/api/enrollments', { courseCode });
      enrollments.value.push(data.enrollment);
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  }

  /** DELETE /api/enrollments/:id */
  async function unenroll(enrollmentId) {
    try {
      await api.delete(`/api/enrollments/${enrollmentId}`);
      enrollments.value = enrollments.value.filter(e => e._id !== enrollmentId);
      return true;
    } catch (err) {
      error.value = err.message;
      return false;
    }
  }

  /** PATCH /api/enrollments/:id */
  async function updateProgress(enrollmentId, progress) {
    try {
      const data = await api.patch(`/api/enrollments/${enrollmentId}`, { progress });
      const idx  = enrollments.value.findIndex(e => e._id === enrollmentId);
      if (idx !== -1) enrollments.value[idx] = data.enrollment;
    } catch (err) {
      error.value = err.message;
    }
  }

  /** Clear on logout */
  function clear() {
    enrollments.value = [];
  }

  return {
    enrollments, loading, error,
    enrolledCodes, recentEnrollments,
    isEnrolled, fetchEnrollments, enroll, unenroll, updateProgress, clear,
  };
});
