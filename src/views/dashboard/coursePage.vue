<template>
  <main class="flex-1 bg-slate-50">

    <!-- Course Hero Banner -->
    <div v-if="course" :class="['relative overflow-hidden px-6 lg:px-10 pt-8 pb-8', course.color]">
      <div class="absolute inset-0 bg-linear-to-br from-black/20 to-black/50"></div>
      <div class="relative max-w-6xl mx-auto">
        <span class="inline-block text-xs font-bold text-white/70 uppercase tracking-widest mb-2">
          {{ course.dept }} &bull; {{ course.year }}
        </span>
        <h1 class="text-2xl lg:text-3xl font-extrabold text-white leading-snug">
          {{ course.code }}: {{ course.title }}
        </h1>
        <p class="text-sm text-white/60 mt-2">{{ course.credits }} credit{{ course.credits !== 1 ? 's' : '' }}</p>
      </div>
    </div>

    <!-- Not found -->
    <div v-else class="flex flex-col items-center justify-center py-24 text-center">
      <p class="font-semibold text-slate-700">Course not found</p>
      <RouterLink to="/courses" class="mt-3 text-sm text-blue-600 hover:underline">← Back to catalogue</RouterLink>
    </div>

    <!-- Page body -->
    <div class="max-w-6xl mx-auto px-6 lg:px-10 py-8 flex flex-col gap-10">

      <!-- Course sections grid -->
      <section>
        <div class="flex items-center justify-between mb-5">
          <p class="text-sm text-slate-500">{{ sections.length }} sections &bull; {{ totalResources }} resources</p>
          <button
            class="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            @click="allExpanded = !allExpanded"
          >{{ allExpanded ? 'Collapse all' : 'Expand all' }}</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
          <div
            v-for="sec in sections"
            :key="sec.id"
            class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <!-- Section header -->
            <button
              class="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
              @click="toggleSection(sec.id)"
            >
              <div class="flex items-center gap-3">
                <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', course.color]">
                  <component :is="sec.icon" class="w-4 h-4 text-white" />
                </div>
                <div class="text-left">
                  <p class="text-sm font-bold text-slate-800">{{ sec.title }}</p>
                  <p v-if="sec.dateRange" class="text-[11px] text-slate-400">{{ sec.dateRange }}</p>
                </div>
              </div>
              <ChevronDown
                :class="['w-4 h-4 text-slate-400 transition-transform flex-shrink-0', (expandedSections[sec.id] ?? allExpanded) ? 'rotate-180' : '']"
              />
            </button>

            <!-- Resources -->
            <div v-show="expandedSections[sec.id] ?? allExpanded" class="divide-y divide-slate-50">
              <a
                v-for="res in sec.resources"
                :key="res.id"
                href="#"
                class="flex items-center gap-3 px-5 py-3 hover:bg-blue-50 group transition-colors"
                @click.prevent
              >
                <div :class="['w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', res.iconBg]">
                  <component :is="res.icon" :class="['w-3.5 h-3.5', res.iconColor]" />
                </div>
                <span class="text-sm text-blue-600 group-hover:text-blue-800 group-hover:underline underline-offset-2 transition-colors leading-snug flex-1">
                  {{ res.title }}
                </span>
                <AlertCircle v-if="res.type === 'assignment'" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              </a>
              <p v-if="!sec.resources.length" class="px-5 py-4 text-sm text-slate-400 italic">No resources yet.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import {
  ChevronDown, BookOpen, Calendar, FileText,
  Link2, ClipboardList, Megaphone, AlertCircle,
  FlaskConical, Video,
} from 'lucide-vue-next';
import { allCourses } from '@/data/courses.js';

const route  = useRoute();
const code   = decodeURIComponent(route.params.code ?? '');

// Look up the real course from the shared catalogue
const course = allCourses.find(c => c.code === code) ?? null;

// ── Sections ─────────────────────────────────────────────────────────────────
const allExpanded     = ref(true);
const expandedSections = ref({});

function toggleSection(id) {
  expandedSections.value[id] = !(expandedSections.value[id] ?? allExpanded.value);
}

const sections = [
  {
    id: 0, title: 'General', dateRange: null, icon: Megaphone,
    resources: [
      { id: 'g1', title: 'Course Announcements',            type: 'forum',      icon: Megaphone,     iconBg: 'bg-blue-50',   iconColor: 'text-blue-500' },
      { id: 'g2', title: 'Course Outline & Grading Policy', type: 'document',   icon: FileText,      iconBg: 'bg-slate-100', iconColor: 'text-slate-500' },
    ],
  },
  {
    id: 1, title: 'Week 1', dateRange: '2 March – 8 March', icon: Calendar,
    resources: [
      { id: 'w1s', title: 'Lecture Slides for Week 1',      type: 'slides',     icon: BookOpen,      iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
      { id: 'w1l', title: 'Lab Resource for Week 1',        type: 'lab',        icon: FlaskConical,  iconBg: 'bg-rose-50',   iconColor: 'text-rose-500' },
    ],
  },
  {
    id: 2, title: 'Week 2', dateRange: '9 March – 15 March', icon: Calendar,
    resources: [
      { id: 'w2s', title: 'Lecture Slides for Week 2',      type: 'slides',     icon: BookOpen,      iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
      { id: 'w2l', title: 'Lab Resource for Week 2',        type: 'lab',        icon: FlaskConical,  iconBg: 'bg-rose-50',   iconColor: 'text-rose-500' },
      { id: 'w2r', title: 'Reading: Knowledge Discovery',   type: 'reading',    icon: Link2,         iconBg: 'bg-green-50',  iconColor: 'text-green-500' },
    ],
  },
  {
    id: 3, title: 'Week 3', dateRange: '16 March – 22 March', icon: Calendar,
    resources: [
      { id: 'w3s', title: 'Lecture Slides for Week 3',      type: 'slides',     icon: BookOpen,      iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
      { id: 'w3v', title: 'Video Lecture: OSI Model',       type: 'video',      icon: Video,         iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
      { id: 'w3a', title: 'Assignment 1 — Due 22 March',    type: 'assignment', icon: ClipboardList, iconBg: 'bg-amber-50',  iconColor: 'text-amber-500' },
    ],
  },
  {
    id: 4, title: 'Week 4', dateRange: '23 March – 29 March', icon: Calendar,
    resources: [
      { id: 'w4s', title: 'Lecture Slides for Week 4',      type: 'slides',     icon: BookOpen,      iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
      { id: 'w4l', title: 'Lab Resource for Week 4',        type: 'lab',        icon: FlaskConical,  iconBg: 'bg-rose-50',   iconColor: 'text-rose-500' },
    ],
  },
  {
    id: 5, title: 'Week 5', dateRange: '30 March – 5 April', icon: Calendar,
    resources: [
      { id: 'w5s', title: 'Lecture Slides for Week 5',      type: 'slides',     icon: BookOpen,      iconBg: 'bg-indigo-50', iconColor: 'text-indigo-500' },
      { id: 'w5r', title: 'Reading: TCP/IP Deep Dive',      type: 'reading',    icon: Link2,         iconBg: 'bg-green-50',  iconColor: 'text-green-500' },
      { id: 'w5a', title: 'Assignment 2 — Due 5 April',     type: 'assignment', icon: ClipboardList, iconBg: 'bg-amber-50',  iconColor: 'text-amber-500' },
    ],
  },
];

const totalResources = computed(() => sections.reduce((n, s) => n + s.resources.length, 0));
</script>
