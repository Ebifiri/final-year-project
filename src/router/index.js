import { createRouter, createWebHistory } from 'vue-router'
import home from '@/views/homeView.vue'
import login from '@/views/login.vue'
import dashboardHome from '@/views/dashboard/dashboardHome.vue'
import courseList from '@/views/courseList.vue'
import coursePage from '@/views/dashboard/coursePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: home,
    },
    {
      path: '/login',
      name: 'login',
      component: login,
    },
    {
      path: '/dashboard/home',
      name: 'dashboard',
      component: dashboardHome,
      meta: { requiresAuth: true },
    },
    {
      path: '/courses',
      name: 'courses',
      component: courseList,
      meta: { requiresAuth: true },
    },
    {
      path: '/courses/:code',
      name: 'course',
      component: coursePage,
      meta: { requiresAuth: true },
    },
  ],
})

// ── Auth guard ────────────────────────────────────────────────────────────────
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true;

  // Lazy-import to avoid circular dependency
  const { useAuthStore } = await import('@/stores/auth.js');
  const auth = useAuthStore();

  // Re-hydrate user on first protected load (e.g. page refresh)
  if (auth.token && !auth.user) {
    await auth.fetchMe();
  }

  if (!auth.isLoggedIn) {
    return { name: 'login' };
  }
});

export default router
