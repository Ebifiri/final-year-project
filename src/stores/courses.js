import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client.js';

export const useCourseStore = defineStore('courses', () => {
  // ── State ────────────────────────────────────────────────────────────────────
  const courses = ref([]);
  const loading = ref(false);
  const error   = ref(null);

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * GET /api/courses
   * Supports optional filters: { search, dept, year }
   */
  async function fetchCourses(params = {}) {
    loading.value = true;
    error.value   = null;
    try {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.dept)   query.set('dept',   params.dept);
      if (params.year)   query.set('year',   params.year);

      const qs   = query.toString();
      const data = await api.get(`/api/courses${qs ? `?${qs}` : ''}`);
      courses.value = data.courses;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  return { courses, loading, error, fetchCourses };
});
