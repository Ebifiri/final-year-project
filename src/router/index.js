import { createRouter, createWebHistory } from 'vue-router'
import home          from '@/views/homeView.vue'
import login         from '@/views/login.vue'
import register      from '@/views/register.vue'
import OAuthCallback from '@/views/OAuthCallback.vue'
import dashboardHome from '@/views/dashboard/dashboardHome.vue'
import courseList    from '@/views/courseList.vue'
import coursePage    from '@/views/dashboard/coursePage.vue'
import aiStudy       from '@/views/dashboard/aiStudy.vue'

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
      path: '/register',
      name: 'register',
      component: register,
    },
    {
      path: '/auth/callback',
      name: 'oauth-callback',
      component: OAuthCallback,
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
      // public — no auth required to browse
    },
    {
      path: '/courses/:code',
      name: 'course',
      component: coursePage,
    },
    {
      path: '/dashboard/ai',
      name: 'ai-study',
      component: aiStudy,
      meta: { requiresAuth: true },
    },
    {
      path: '/assignments/:assignmentId/submit',
      name: 'submitAssignment',
      component: () => import('@/views/dashboard/assignmentSubmission.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/quizzes/:quizId',
      name: 'quiz',
      component: () => import('@/views/dashboard/quizView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/grades',
      name: 'grades',
      component: () => import('@/views/dashboard/gradesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard/admin',
      redirect: '/dashboard/home',
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

  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return { name: 'dashboard' };
  }
});

export default router
