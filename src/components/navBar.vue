<template>
  <!-- Full-page layout shell: [sidebar] + [header + slot content] -->
  <div class="flex min-h-screen bg-slate-50 font-sans text-slate-800">

    <!-- ── MOBILE OVERLAY ─────────────────────────────────────── -->
    <Transition name="overlay">
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
        @click="isSidebarOpen = false"
      ></div>
    </Transition>

    <!-- ── DESKTOP SIDEBAR ────────────────────────────────────── -->
    <Transition name="desktop-sidebar">
      <aside
        v-if="!isDesktopSidebarClosed"
        class="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col shrink-0 sticky top-0 h-screen overflow-hidden"
      >
        <SidebarContents :on-close="() => isDesktopSidebarClosed = true" />
      </aside>
    </Transition>

    <!-- ── MOBILE SIDEBAR ─────────────────────────────────────── -->
    <Transition name="sidebar-slide">
      <aside
        v-if="isSidebarOpen"
        class="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col h-full shadow-2xl lg:hidden"
      >
        <SidebarContents :on-close="() => isSidebarOpen = false" />
      </aside>
    </Transition>

    <!-- ── MAIN COLUMN: header + page content ─────────────────── -->
    <div class="flex-1 flex flex-col">

      <!-- HEADER -->
      <header class="bg-[#1e293b] text-white shrink-0 sticky top-0 z-20">
        <div class="px-4 lg:px-8 py-3 flex justify-between items-center border-b border-slate-700/50">

          <!-- Left: hamburger + logo -->
          <div class="flex items-center gap-4">
            <button
              class="p-2 -ml-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              @click="toggleSidebar"
              aria-label="Toggle sidebar"
            >
              <Menu class="w-6 h-6" />
            </button>

            <RouterLink to="/" class="flex items-center gap-3">
              <img src="../assets/pau-logo-light.png" alt="" class="w-30">
            </RouterLink>
          </div>

          <!-- Right: search + notifications -->
          <div class="flex items-center gap-2 sm:gap-4">
            <div class="hidden md:flex items-center bg-slate-800/50 rounded-lg px-3 py-1.5 border border-slate-700 focus-within:border-blue-500 transition-colors mr-2">
              <Search class="w-4 h-4 text-slate-400" />
              <input
                v-model="navSearch"
                type="text"
                placeholder="Search courses..."
                class="bg-transparent border-none outline-none text-sm text-white placeholder-slate-400 ml-2 w-48"
                @keyup.enter="handleNavSearch"
              />
            </div>

            <div class="flex items-center gap-2 sm:gap-4 sm:border-l border-slate-700 sm:pl-4">
              <!-- Notification bell -->
              <div v-if="isLoggedIn" class="relative" ref="bellRef">
                <button
                  class="relative p-2 text-slate-300 hover:bg-slate-800 rounded-full transition-colors"
                  @click="toggleNotifPanel"
                >
                  <Bell class="w-5 h-5" />
                  <span
                    v-if="notifStore.unreadAlertsCount > 0"
                    class="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#1e293b] px-0.5"
                  >{{ notifStore.unreadAlertsCount > 99 ? '99+' : notifStore.unreadAlertsCount }}</span>
                </button>

                <!-- Notification dropdown panel -->
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 translate-y-2 scale-95"
                  enter-to-class="opacity-100 translate-y-0 scale-100"
                  leave-active-class="transition-all duration-150 ease-in"
                  leave-from-class="opacity-100 translate-y-0 scale-100"
                  leave-to-class="opacity-0 translate-y-2 scale-95"
                >
                  <div
                    v-if="isNotifOpen"
                    class="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-2rem)] xs:w-80 sm:w-96 max-w-[24rem] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                    style="right: -8px;"
                  >
                    <!-- Panel header -->
                    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <h3 class="text-sm font-bold text-slate-800">Notifications</h3>
                      <div class="flex items-center gap-3">
                        <button
                          v-if="notifStore.unreadAlertsCount > 0"
                          class="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors cursor-pointer"
                          @click="handleMarkAllRead"
                        >
                          Mark all read
                        </button>
                        <button
                          v-if="notifStore.alerts.length > 0"
                          class="text-xs text-red-600 hover:text-red-800 font-semibold transition-colors cursor-pointer"
                          @click="notifStore.clearAll(false)"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    <!-- Notification list -->
                    <div class="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      <div
                        v-if="!notifStore.loaded"
                        class="flex items-center justify-center py-8"
                      >
                        <div class="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      </div>

                      <div v-else-if="!notifStore.alerts.length" class="py-10 text-center">
                        <Bell class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p class="text-sm text-slate-400">No notifications yet</p>
                      </div>

                      <template v-else>
                        <button
                          v-for="n in notifStore.alerts.slice(0, 15)"
                          :key="n._id"
                          class="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                          :class="n.read ? 'opacity-60' : ''"
                          @click="handleNotifClick(n)"
                        >
                          <!-- Type icon -->
                          <div
                            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            :class="notifIconClass(n.type, n.dueDate)"
                          >
                            <component :is="notifIcon(n.type)" class="w-4 h-4" />
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="text-sm font-medium text-slate-800 truncate" :class="{ 'font-bold': !n.read }">{{ n.title }}</p>
                            <p v-if="n.courseId?.title" class="text-[11px] text-indigo-500 font-medium truncate mt-0.5">{{ n.courseId.code }} — {{ n.courseId.title }}</p>
                            <p v-if="n.body" class="text-xs text-slate-500 truncate mt-0.5">{{ n.body }}</p>
                            <p class="text-[10px] text-slate-400 mt-1">{{ timeAgo(n.createdAt) }}</p>
                          </div>
                          <!-- Unread dot -->
                          <div v-if="!n.read" class="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                        </button>
                      </template>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Mail bell -->
              <div v-if="isLoggedIn" class="relative" ref="mailRef">
                <button
                  class="relative p-2 text-slate-300 hover:bg-slate-800 rounded-full transition-colors"
                  @click="toggleMailPanel"
                >
                  <Mail class="w-5 h-5" />
                  <span
                    v-if="notifStore.unreadMessagesCount > 0"
                    class="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#1e293b] px-0.5"
                  >{{ notifStore.unreadMessagesCount > 99 ? '99+' : notifStore.unreadMessagesCount }}</span>
                </button>

                <!-- Mail dropdown panel -->
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 translate-y-2 scale-95"
                  enter-to-class="opacity-100 translate-y-0 scale-100"
                  leave-active-class="transition-all duration-150 ease-in"
                  leave-from-class="opacity-100 translate-y-0 scale-100"
                  leave-to-class="opacity-0 translate-y-2 scale-95"
                >
                  <div
                    v-if="isMailOpen"
                    class="absolute right-0 sm:right-0 mt-2 w-[calc(100vw-2rem)] xs:w-80 sm:w-96 max-w-[24rem] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                    style="right: -8px;"
                  >
                    <!-- Panel header -->
                    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <h3 class="text-sm font-bold text-slate-800">Messages & Feedback</h3>
                      <button
                        v-if="notifStore.messages.length > 0"
                        class="text-xs text-red-600 hover:text-red-800 font-semibold transition-colors cursor-pointer"
                        @click="notifStore.clearAll('feedback')"
                      >
                        Clear All
                      </button>
                    </div>

                    <!-- Message list -->
                    <div class="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      <div
                        v-if="!notifStore.loaded"
                        class="flex items-center justify-center py-8"
                      >
                        <div class="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      </div>

                      <div v-else-if="!notifStore.messages.length" class="py-10 text-center">
                        <Mail class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p class="text-sm text-slate-400">No messages</p>
                      </div>

                      <template v-else>
                        <button
                          v-for="n in notifStore.messages.slice(0, 15)"
                          :key="n._id"
                          class="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                          :class="n.read ? 'opacity-60' : ''"
                          @click="handleMailClick(n)"
                        >
                          <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-sky-50 text-sky-600 border border-sky-100">
                            <Mail class="w-4 h-4" />
                          </div>
                          <div class="min-w-0 flex-1">
                            <p class="text-sm font-medium text-slate-800 truncate" :class="{ 'font-bold': !n.read }">{{ n.title }}</p>
                            <p v-if="n.courseId?.title" class="text-[11px] text-indigo-500 font-medium truncate mt-0.5">{{ n.courseId.code }} — {{ n.courseId.title }}</p>
                            <p v-if="n.body" class="text-xs text-slate-500 truncate mt-0.5">{{ n.body }}</p>
                            <p class="text-[10px] text-slate-400 mt-1">{{ timeAgo(n.createdAt) }}</p>
                          </div>
                          <!-- Unread dot -->
                          <div v-if="!n.read" class="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                        </button>
                      </template>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Login button (guest only) -->
              <RouterLink
                v-if="!isLoggedIn"
                to="/login"
                class="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-white text-[#1e293b] text-sm font-bold rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
              >
                <LogIn class="w-4 h-4" />
                Log in
              </RouterLink>

              <!-- User avatar (logged in) — clicking goes to dashboard, NOT logout -->
              <RouterLink
                v-if="isLoggedIn"
                to="/dashboard/home"
                class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                <img
                  :src="avatarUrl"
                  class="w-6 h-6 rounded-full"
                  alt="avatar"
                />
                <span class="text-sm font-medium text-white">{{ auth.user?.name?.split(' ')[0] }}</span>
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Secondary nav bar -->
        <div class="hidden lg:flex px-8 items-center gap-8 overflow-visible border-b border-slate-700/30">
          <RouterLink to="/"><HeaderNavItem title="Home" :has-dropdown="false" /></RouterLink>
          <HeaderNavItem title="Faculties &amp; Schools" :has-dropdown="true" :dropdown-items="facultiesDropdown" />
          <HeaderNavItem title="Programs &amp; Admissions" :has-dropdown="true" :dropdown-items="programsDropdown" />
          <HeaderNavItem title="PAU Website" :has-dropdown="false" href="https://pau.edu.ng" />
          <HeaderNavItem title="Apply to PAU" :has-dropdown="false" href="https://apply.pau.edu.ng" />
        </div>
      </header>

      <!-- PAGE CONTENT + FOOTER -->
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineComponent, h, watch, onMounted, onUnmounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import {
  Bell, Mail, ChevronDown, ChevronRight, Search, Menu, LogIn,
  LayoutDashboard, Home as HomeIcon,
  Calendar, BookMarked, MonitorPlay, Shield,
  X, Settings, LogOut, Sparkles,
  FileText, ClipboardList, HelpCircle, Megaphone, Award,
} from 'lucide-vue-next';
import { useAuthStore }         from '@/stores/auth.js';
import { useEnrollmentStore }   from '@/stores/enrollments.js';
import { useNotificationStore } from '@/stores/notifications.js';

// ── Auth ───────────────────────────────────────────────────────────────────────
const auth            = useAuthStore();
const enrollmentStore = useEnrollmentStore();
const notifStore      = useNotificationStore();
const router          = useRouter();
const isLoggedIn      = computed(() => auth.isLoggedIn);
const avatarUrl       = computed(() => {
  const name = encodeURIComponent(auth.user?.name || 'User');
  return `https://ui-avatars.com/api/?name=${name}&background=cbd5e1&color=1e293b&size=128`;
});

function handleLogout() {
  auth.logout();
  enrollmentStore.clear();
  notifStore.reset();
  router.push('/');
}

// ── Notification panel ────────────────────────────────────────────────────────
const isNotifOpen = ref(false);
const isMailOpen  = ref(false);
const bellRef     = ref(null);
const mailRef     = ref(null);

function toggleNotifPanel() {
  isNotifOpen.value = !isNotifOpen.value;
  isMailOpen.value = false;
  if (isNotifOpen.value && !notifStore.loaded) {
    notifStore.fetchNotifications();
  }
}

function toggleMailPanel() {
  isMailOpen.value = !isMailOpen.value;
  isNotifOpen.value = false;
  if (isMailOpen.value && !notifStore.loaded) {
    notifStore.fetchNotifications();
  }
}

function handleNotifClick(n) {
  if (!n.read) notifStore.markRead(n._id);
  isNotifOpen.value = false;
  if (n.link) router.push(n.link);
}

function handleMailClick(n) {
  if (!n.read) notifStore.markRead(n._id);
  isMailOpen.value = false;
  if (n.link) router.push(n.link);
}

function handleMarkAllRead() {
  notifStore.markAllRead();
}

// Close dropdown when clicking outside
function onDocClick(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) {
    isNotifOpen.value = false;
  }
  if (mailRef.value && !mailRef.value.contains(e.target)) {
    isMailOpen.value = false;
  }
}

// Notification type helpers
function notifIcon(type) {
  const map = { resource: FileText, assignment: ClipboardList, quiz: HelpCircle, announcement: Megaphone };
  return map[type] || Bell;
}
function notifIconClass(type, dueDate) {
  if (type === 'quiz') {
    return 'bg-red-50 text-red-600 border border-red-100 font-semibold';
  }
  if (type === 'assignment') {
    if (!dueDate) return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    const hoursLeft = (new Date(dueDate) - new Date()) / (1000 * 60 * 60);
    if (hoursLeft <= 24) {
      return 'bg-red-50 text-red-600 border border-red-200 font-semibold animate-pulse';
    } else if (hoursLeft <= 72) {
      return 'bg-amber-50 text-amber-600 border border-amber-200';
    } else {
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    }
  }
  const map = {
    resource:     'bg-blue-50 text-blue-600 border border-blue-50',
    announcement: 'bg-violet-50 text-violet-600 border border-violet-50',
  };
  return map[type] || 'bg-slate-100 text-slate-500';
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── Lifecycle: start/stop polling ───────────────────────────────────────────
watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) notifStore.startPolling();
  else notifStore.reset();
}, { immediate: true });

onMounted(() => {
  document.addEventListener('click', onDocClick);
});
onUnmounted(() => {
  document.removeEventListener('click', onDocClick);
  notifStore.stopPolling();
});

// ── Reactive state ──────────────────────────────────────────────────────────
const isSidebarOpen = ref(false);
const isDesktopSidebarClosed = ref(true);

// ── Navbar search ────────────────────────────────────────────────────────────
const navSearch = ref('');
function handleNavSearch() {
  const q = navSearch.value.trim();
  if (!q) return;
  router.push({ path: '/courses', query: { q } });
  navSearch.value = '';
}

function toggleSidebar() {
  if (window.matchMedia('(min-width: 1024px)').matches) {
    isDesktopSidebarClosed.value = !isDesktopSidebarClosed.value;
  } else {
    isSidebarOpen.value = true;
  }
}

// ── Dropdown data ───────────────────────────────────────────────────────────
const facultiesDropdown = [
  {
    label: 'Professional Education',
    subItems: ['2025 Set'],
  },
  {
    label: 'Film and Multimedia Studies',
    subItems: ['Year 1 Semester 2', 'Year 2 Semester 2', 'Year 3 Semester 2'],
  },
  {
    label: 'Strategic Communication',
    subItems: ['Year 1 Semester 2'],
  },
  {
    label: 'School of Science & Tech (SST)',
    subItems: ['Year 1 Semester 2', 'Year 2 Semester 2', 'Year 3 Semester 2', 'Year 4 Semester 2', 'Year 5 Semester 2'],
  },
  {
    label: 'School of Media & Comm (MassComm)',
    subItems: ['Year 1 Semester 2', 'Year 2 Semester 2', 'Year 3 Semester 2', 'Year 4 Semester 2'],
  },
  {
    label: 'School of Mgt & Social Sci (SMSS)',
    subItems: ['Year 1 Semester 2', 'Year 2 Semester 2', 'Year 3 Semester 2', 'Year 4 Semester 2'],
  },
  {
    label: 'ISMS',
    subItems: ['Year 1 Semester 2', 'Year 2 Semester 2', 'Year 3 Semester 2', 'Year 4 Semester 2'],
  },
  {
    label: 'Institute of Humanities (IoH)',
    subItems: ['Year 1 Semester 2', 'Year 2 Semester 2', 'Year 3 Semester 2'],
  },
];

const programsDropdown = [
  {
    label: 'Summer Programs',
    subItems: ['2024/2025 Session'],
  },
  {
    label: 'Post Graduate Studies',
    subItems: [
      'MSc-Data Science',
      'MSc-Data Science Brush Up',
      'MSc-Economics',
      'MSc-Film Production',
      'MSc-MOD 18',
      'PHD4 SMSS',
      'PHD5 SMSS',
      'PHD 6 SMSS',
      'PHD 7 SMC',
      'PHD 8 SMC',
      'PHD 9 SMC',
      'PHD 6 SMC',
    ],
  },
  {
    label: 'Continuous Dev. Program (CDP)',
    subItems: [
      'Career Foundation Programme I',
      'Career Foundation Programme II',
      'Industry Readiness Programme 300 Level',
      'Industry Advancement Programme Final Year',
    ],
  },
];

// ── SidebarContents ─────────────────────────────────────────────────────────
const SidebarItemInner = defineComponent({
  name: 'SidebarItem',
  props: {
    icon: { type: Object, required: true },
    label: { type: String, required: true },
    active: { type: Boolean, default: false },
    isSubItem: { type: Boolean, default: false },
    extraClass: { type: String, default: '' },
  },
  setup(props) {
    return () =>
      h('button', {
        class: [
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
          props.isSubItem ? 'pl-10 text-sm' : 'font-medium text-sm',
          props.active
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          props.extraClass,
        ],
      }, [
        h(props.icon, { class: [props.isSubItem ? 'w-4 h-4' : 'w-5 h-5', props.active ? 'text-blue-600' : 'text-slate-400'] }),
        h('span', { class: 'truncate' }, props.label),
      ]);
  },
});

const SidebarContents = defineComponent({
  name: 'SidebarContents',
  props: { onClose: { type: Function, default: null } },
  setup(props) {
    return () =>
      h('div', { class: 'flex flex-col flex-1 overflow-hidden' }, [
        // Close button
        h('div', { class: 'flex justify-end px-3 pt-3' }, [
          h('button', {
            class: 'p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors',
            onClick: props.onClose,
          }, [h(X, { class: 'w-5 h-5' })]),
        ]),

        isLoggedIn.value
          // ── LOGGED IN: show user profile + navigation ──────────────
          ? h('div', { class: 'flex flex-col flex-1 overflow-hidden' }, [
              // User info
              h('div', { class: 'pb-6 px-6 border-b border-slate-100 flex flex-col items-center text-center bg-slate-50/50' }, [
                h('div', { class: 'relative' }, [
                  h('div', { class: 'w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden mb-3 bg-slate-200' }, [
                    h('img', {
                      src: avatarUrl.value,
                      alt: auth.user?.name || 'User',
                      class: 'w-full h-full object-cover',
                    }),
                  ]),
                  h('div', { class: 'absolute bottom-4 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full' }),
                ]),
                h('h3', { class: 'font-bold text-slate-900 text-lg leading-tight' }, auth.user?.name || 'Student'),
                h('p', { class: 'text-xs font-medium text-slate-500 mt-1' }, `${auth.user?.role ?? 'student'} • PAU`),
              ]),

              // Navigation
              h('div', { class: 'flex-1 overflow-y-auto py-4 px-3' }, [
                h('div', { class: 'space-y-1 mb-8' }, [
                  h(RouterLink, { to: '/',                onClick: props.onClose, class: 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all' }, () => [h(HomeIcon,        { class: 'w-5 h-5 text-slate-400' }), h('span', 'Site home')]),
                  h(RouterLink, { to: '/dashboard/home', onClick: props.onClose, class: 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all' }, () => [h(LayoutDashboard, { class: 'w-5 h-5 text-slate-400' }), h('span', 'Dashboard')]),
                  h(RouterLink, { to: '/courses',        onClick: props.onClose, class: 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all' }, () => [h(BookMarked,      { class: 'w-5 h-5 text-slate-400' }), h('span', 'All courses')]),
                  h(RouterLink, { to: '/grades',         onClick: props.onClose, class: 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all' }, () => [h(Award,           { class: 'w-5 h-5 text-slate-400' }), h('span', 'Grades')]),
                  h(RouterLink, { to: '/dashboard/ai',  onClick: props.onClose, class: 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer' }, () => [h(Sparkles,       { class: 'w-5 h-5 text-blue-500' }), h('span', 'AI Study Assistant')]),
                ]),
                // My enrolled courses
                h('div', { class: 'px-3 mb-2' }, [
                  h('h4', { class: 'text-xs font-bold text-slate-400 uppercase tracking-wider' }, 'My Courses'),
                ]),
                h('div', { class: 'space-y-1' }, enrollmentStore.enrollments.slice(0, 5).map(e =>
                    h(RouterLink, {
                      key: e._id,
                      to: `/courses/${e.course?.code}`,
                      onClick: props.onClose,
                      class: 'w-full flex items-center gap-3 pl-10 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all',
                    }, () => [h(MonitorPlay, { class: 'w-4 h-4 text-slate-400' }), h('span', { class: 'truncate' }, e.course?.code ?? '')])
                  )),
              ]),

              // Footer
              h('div', { class: 'p-4 border-t border-slate-100 space-y-1' }, [
                h('button', {
                  class: 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700',
                  onClick: () => { handleLogout(); props.onClose?.(); },
                }, [h(LogOut, { class: 'w-5 h-5' }), h('span', 'Log out')]),
              ]),
            ])

          // ── GUEST: not logged in ───────────────────────────────────
          : h('div', { class: 'flex flex-col flex-1 items-center justify-center gap-5 px-6 pb-10 text-center' }, [
              h('div', { class: 'w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center' }, [
                h(LogIn, { class: 'w-7 h-7 text-slate-400' }),
              ]),
              h('div', { class: 'space-y-1' }, [
                h('p', { class: 'font-semibold text-slate-800 text-base' }, "You're not logged in"),
                h('p', { class: 'text-sm text-slate-500' }, 'Log in to access your courses and dashboard.'),
              ]),
              h(RouterLink, {
                to: '/login',
                onClick: props.onClose,
                class: 'w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1e293b] hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md',
              }, [
                h(LogIn, { class: 'w-4 h-4' }),
                'Log in',
              ]),
            ]),
      ]);
  },
});

// ── HeaderNavItem ───────────────────────────────────────────────────────────
const HeaderNavItem = defineComponent({
  name: 'HeaderNavItem',
  props: {
    title: { type: String, required: true },
    hasDropdown: { type: Boolean, default: false },
    dropdownItems: { type: Array, default: null },
    href: { type: String, default: null },
  },
  setup(props) {
    return () => {
      const items = props.dropdownItems?.length
        ? props.dropdownItems.map((item, idx) => {
            const isStr = typeof item === 'string';
            const label = isStr ? item : item.label;
            const subItems = isStr ? null : item.subItems;

            return h('div', { key: idx, class: 'relative group/item' }, [
              h('a', {
                href: `/courses?dept=${encodeURIComponent(label)}`,
                class: 'flex items-center justify-between w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors',
              }, [label, subItems ? h(ChevronRight, { class: 'w-4 h-4 opacity-50' }) : null]),

              subItems ? h('div', {
                class: 'absolute top-0 left-full ml-1 w-52 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 z-50 -translate-x-2 group-hover/item:translate-x-0 overflow-hidden',
              }, [
                h('div', { class: 'py-2' },
                  subItems.map((sub, si) =>
                    h('a', {
                      key: si,
                      href: `/courses?dept=${encodeURIComponent(label)}&year=${encodeURIComponent(sub)}`,
                      class: 'block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors',
                    }, sub)
                  )
                ),
              ]) : null,
            ]);
          })
        : [];

      // If an external href is provided, render the label as a plain anchor
      const trigger = props.href
        ? h('a', {
            href: props.href,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors',
          }, [props.title])
        : h('button', {
            class: 'flex items-center gap-1.5 text-sm font-medium text-slate-300 group-hover:text-white transition-colors',
          }, [
            props.title,
            props.hasDropdown ? h(ChevronDown, { class: 'w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity' }) : null,
          ]);

      return h('div', { class: 'relative group py-3' }, [
        trigger,
        items.length ? h('div', {
          class: 'absolute top-full left-0 mt-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 translate-y-2 group-hover:translate-y-0',
        }, [h('div', { class: 'py-2' }, items)]) : null,
      ]);
    };
  },
});
</script>
