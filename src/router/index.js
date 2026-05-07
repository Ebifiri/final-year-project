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
    },
    {
      path: '/courses',
      name: 'courses',
      component: courseList,
    },
    {
      path: '/courses/:code',
      name: 'course',
      component: coursePage,
    },
  ],
})

export default router
