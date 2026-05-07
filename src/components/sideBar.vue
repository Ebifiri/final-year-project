<template>
  
</template>
<script setup>
  import { ref, defineComponent, h } from 'vue';
import {
  Bell,
  Mail,
  ChevronDown,
  ChevronRight,
  Search,
  Menu,
  BookOpen,
  ArrowRight,
  GraduationCap,
  LayoutDashboard,
  Home as HomeIcon,
  Calendar,
  BookMarked,
  MonitorPlay,
  Shield,
  X,
  Settings,
  LogOut,
} from 'lucide-vue-next';

// ── Reactive state ──────────────────────────────────────────────────────────
const isSidebarOpen = ref(false);
const isDesktopSidebarClosed = ref(true);

// Toggle for the hamburger button — collapses/expands on desktop, opens overlay on mobile
function toggleSidebar() {
  // Use matchMedia to detect desktop (>=1024px)
  if (window.matchMedia('(min-width: 1024px)').matches) {
    isDesktopSidebarClosed.value = !isDesktopSidebarClosed.value;
  } else {
    isSidebarOpen.value = true;
  }
}

// ── SidebarContents ─────────────────────────────────────────────────────────
// Shared inner markup rendered by both the desktop and mobile sidebars
const SidebarContents = defineComponent({
  name: 'SidebarContents',
  props: {
    onClose: { type: Function, default: null },
  },
  setup(props) {
    return () =>
      h('div', { class: 'flex flex-col flex-1 overflow-hidden' }, [
        // Close button row
        h('div', { class: 'flex justify-end px-3 pt-3' }, [
          h('button', {
            class: 'p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors',
            onClick: props.onClose,
          }, [
            h(X, { class: 'w-5 h-5' }),
          ]),
        ]),

        // User Info
        h('div', { class: 'pb-6 px-6 border-b border-slate-100 flex flex-col items-center text-center bg-slate-50/50' }, [
          h('div', { class: 'relative' }, [
            h('div', { class: 'w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden mb-3 bg-slate-200' }, [
              h('img', {
                src: 'https://ui-avatars.com/api/?name=Ayebaebifiri+Ikoli-Spiff&background=cbd5e1&color=1e293b&size=128',
                alt: 'Ayebaebifiri Ikoli-Spiff',
                class: 'w-full h-full object-cover',
              }),
            ]),
            h('div', { class: 'absolute bottom-4 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full' }),
          ]),
          h('h3', { class: 'font-bold text-slate-900 text-lg leading-tight' }, 'Ayebaebifiri Ikoli-Spiff'),
          h('p', { class: 'text-xs font-medium text-slate-500 mt-1' }, 'Student • Computer Science'),
        ]),

        // Navigation
        h('div', { class: 'flex-1 overflow-y-auto py-4 px-3' }, [
          h('div', { class: 'space-y-1 mb-8' }, [
            h(SidebarItemInner, { icon: HomeIcon, label: 'Site home', active: true }),
            h(SidebarItemInner, { icon: LayoutDashboard, label: 'Dashboard' }),
            h(SidebarItemInner, { icon: Calendar, label: 'Calendar' }),
          ]),
          h('div', { class: 'px-3 mb-2' }, [
            h('h4', { class: 'text-xs font-bold text-slate-400 uppercase tracking-wider' }, 'My Courses'),
          ]),
          h('div', { class: 'space-y-1' }, [
            h(SidebarItemInner, { icon: BookMarked, label: 'All courses' }),
            h(SidebarItemInner, { icon: MonitorPlay, label: 'PAU-CSC 310', isSubItem: true }),
            h(SidebarItemInner, { icon: Shield, label: 'CYB 201', isSubItem: true }),
          ]),
        ]),

        // Footer
        h('div', { class: 'p-4 border-t border-slate-100 space-y-1' }, [
          h(SidebarItemInner, { icon: Settings, label: 'Preferences' }),
          h(SidebarItemInner, { icon: LogOut, label: 'Log out', extraClass: 'text-red-600 hover:bg-red-50 hover:text-red-700' }),
        ]),
      ]);
  },
});

// ── SidebarItem (renamed internally to avoid lint noise) ────────────────────
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
      h(
        'button',
        {
          class: [
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
            props.isSubItem ? 'pl-10 text-sm' : 'font-medium text-sm',
            props.active
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            props.extraClass,
          ],
        },
        [
          h(props.icon, {
            class: [
              props.isSubItem ? 'w-4 h-4' : 'w-5 h-5',
              props.active ? 'text-blue-600' : 'text-slate-400',
            ],
          }),
          h('span', { class: 'truncate' }, props.label),
        ]
      );
  },
});
</script>
