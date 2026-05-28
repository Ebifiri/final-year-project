<template>
  <main class="flex-1 bg-slate-50 p-6 lg:p-8">

    <!-- Page heading -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p class="text-sm text-slate-500 mt-1">Welcome back, {{ auth.user?.name?.split(' ')[0] ?? 'User' }} 👋</p>
    </div>

    <!-- ── LECTURER / ADMIN VIEW ─────────────────────────────────────────────── -->
    <div v-if="isLecturer" class="flex flex-col gap-8">

      <!-- Stats bar -->
      <div class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <BookOpen class="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p class="text-2xl font-extrabold text-slate-900">{{ lecturerCourses.length }}</p>
            <p class="text-xs text-slate-400 font-medium">Courses Teaching</p>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Users class="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p class="text-2xl font-extrabold text-slate-900">{{ lecturerCourses.length > 0 ? '—' : '0' }}</p>
            <p class="text-xs text-slate-400 font-medium">Students Enrolled</p>
          </div>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4 col-span-2 sm:col-span-1">
          <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <GraduationCap class="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-700">{{ auth.user?.name }}</p>
            <p class="text-xs text-slate-400 font-medium capitalize">{{ auth.user?.role }}</p>
          </div>
        </div>
      </div>

      <!-- My Courses section -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Presentation class="w-4 h-4" /> My Courses
          </h2>
          <span class="text-xs text-slate-400">{{ lecturerCourses.length }} course{{ lecturerCourses.length !== 1 ? 's' : '' }}</span>
        </div>

        <!-- Loading skeleton -->
        <div v-if="lecturerLoading" class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div v-for="i in 8" :key="i" class="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse flex flex-col">
            <div class="h-24 bg-slate-200"></div>
            <div class="p-3 space-y-2 flex-grow">
              <div class="h-3.5 bg-slate-200 rounded w-5/6"></div>
              <div class="h-3 bg-slate-100 rounded w-1/3"></div>
              <div class="w-16 h-4 bg-slate-200 rounded-full mt-2"></div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="lecturerCourses.length === 0" class="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 border-dashed text-center">
          <Presentation class="w-10 h-10 text-slate-300 mb-3" />
          <p class="text-sm font-semibold text-slate-600">No courses assigned yet</p>
          <p class="text-xs text-slate-400 mt-1">Contact an administrator to be assigned to courses.</p>
        </div>

        <!-- Course grid -->
        <div v-else class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <RouterLink
            v-for="c in paginatedLecturerCourses"
            :key="c.code"
            :to="'/courses/' + c.code"
            class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all"
          >
            <!-- Colour band -->
            <div :class="['h-24 flex items-end p-3 relative overflow-hidden', c.color]">
              <div class="absolute inset-0 bg-black/10"></div>
              <Presentation class="absolute top-3 right-3 w-5 h-5 text-white/60" />
              <span class="relative text-[11px] font-bold text-white bg-black/25 px-2 py-0.5 rounded">{{ c.code }}</span>
            </div>
            <!-- Body -->
            <div class="p-3">
              <p class="text-xs font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">{{ c.title }}</p>
              <p class="text-[11px] text-slate-400 mt-1 truncate">{{ c.dept }}</p>
              <span class="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                <PenLine class="w-2.5 h-2.5" /> Teaching
              </span>
            </div>
          </RouterLink>
        </div>

        <!-- Pagination -->
        <div v-if="lecturerTotalPages > 1" class="flex items-center justify-center gap-1.5 mt-5">
          <button
            class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            :disabled="lecturerPage === 1"
            @click="lecturerPage--"
          ><ChevronLeft class="w-4 h-4" /></button>
          <button
            v-for="p in lecturerTotalPages"
            :key="p"
            :class="['w-8 h-8 rounded-lg text-sm font-semibold transition-colors', lecturerPage === p ? 'bg-[#1e293b] text-white' : 'text-slate-500 hover:bg-slate-200']"
            @click="lecturerPage = p"
          >{{ p }}</button>
          <button
            class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            :disabled="lecturerPage === lecturerTotalPages"
            @click="lecturerPage++"
          ><ChevronRight class="w-4 h-4" /></button>
        </div>
      </section>
    </div>

    <!-- ── STUDENT VIEW ──────────────────────────────────────────────────────── -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

      <!-- ── LEFT COLUMN (2/3 width) ───────────────────────────── -->
      <div class="xl:col-span-2 flex flex-col gap-8">

        <!-- Recently Accessed -->
        <section>
          <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock class="w-4 h-4" /> Recently Accessed
          </h2>
          <!-- Loading skeleton -->
          <div v-if="enrollmentStore.loading" class="flex gap-4 overflow-x-auto pb-2">
            <div v-for="i in 3" :key="i" class="flex-shrink-0 w-52 sm:w-56 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
              <div class="h-20 bg-slate-200"></div>
              <div class="p-3 space-y-2">
                <div class="h-3.5 bg-slate-200 rounded w-5/6"></div>
                <div class="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
            </div>
          </div>
          <div v-else-if="recentCourses.length === 0" class="flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-slate-200 border-dashed text-center">
            <Clock class="w-8 h-8 text-slate-300 mb-2" />
            <p class="text-sm font-medium text-slate-500">No recently accessed courses</p>
            <RouterLink to="/courses" class="text-xs text-blue-500 hover:underline mt-1">Browse courses →</RouterLink>
          </div>
          <div v-else class="flex gap-4 overflow-x-auto pb-2">
            <RouterLink
              v-for="c in recentCourses"
              :key="c.code"
              :to="'/courses/' + c.code"
              class="flex-shrink-0 w-52 sm:w-56 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
            >
              <div :class="['h-20 flex items-end p-3', c.color]">
                <span class="text-xs font-bold text-white/90 bg-black/20 px-2 py-0.5 rounded">{{ c.code }}</span>
              </div>
              <div class="p-3">
                <p class="text-xs font-semibold text-slate-800 leading-snug line-clamp-2">{{ c.title }}</p>
                <p class="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <Clock class="w-3 h-3" /> {{ c.accessed }}
                </p>
              </div>
            </RouterLink>
          </div>
        </section>

        <!-- Enrolled Courses -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <BookOpen class="w-4 h-4" /> My Courses
            </h2>
            <span class="text-xs text-slate-400">{{ enrolledCourses.length }} courses</span>
          </div>

          <!-- Loading skeleton -->
          <div v-if="enrollmentStore.loading" class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div v-for="i in 4" :key="i" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
              <div class="h-24 bg-slate-200"></div>
              <div class="p-3 space-y-3">
                <div class="h-3.5 bg-slate-200 rounded w-5/6"></div>
                <div class="h-3 bg-slate-100 rounded w-1/3"></div>
                <div class="h-7 bg-slate-200 rounded-lg w-full"></div>
              </div>
            </div>
          </div>
          <div v-else-if="paginatedCourses.length === 0" class="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-slate-200 border-dashed text-center">
            <BookOpen class="w-10 h-10 text-slate-300 mb-3" />
            <p class="text-sm font-semibold text-slate-600">You have no courses enrolled currently</p>
            <p class="text-xs text-slate-400 mt-1">Head to the course catalogue to get started.</p>
            <RouterLink to="/courses" class="mt-3 px-4 py-2 bg-[#1e293b] text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors">Browse Courses</RouterLink>
          </div>

          <div v-else class="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="c in paginatedCourses"
              :key="c.code"
              class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group"
            >
              <RouterLink :to="'/courses/' + c.code">
                <div :class="['h-24 flex items-end p-3 relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity', c.color]">
                  <div class="absolute inset-0 bg-black/10"></div>
                  <MonitorPlay class="absolute top-3 right-3 w-5 h-5 text-white/60" />
                  <span class="relative text-[11px] font-bold text-white bg-black/25 px-2 py-0.5 rounded">{{ c.code }}</span>
                </div>
              </RouterLink>
              <div class="p-3">
                <RouterLink :to="'/courses/' + c.code">
                  <p class="text-xs font-semibold text-slate-800 leading-snug line-clamp-2 hover:text-blue-700 transition-colors">{{ c.title }}</p>
                </RouterLink>
                <p class="text-[11px] text-slate-400 mt-1">{{ c.faculty }}</p>
                <button
                  class="mt-2.5 w-full text-[11px] font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg py-1.5 transition-colors border border-transparent hover:border-red-200"
                  @click="unenroll(c._id)"
                >
                  Unenroll
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-center gap-1.5 mt-5">
            <button class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors disabled:opacity-30 disabled:pointer-events-none" :disabled="coursePage === 1" @click="coursePage--"><ChevronLeft class="w-4 h-4" /></button>
            <button v-for="p in totalPages" :key="p" :class="['w-8 h-8 rounded-lg text-sm font-semibold transition-colors', coursePage === p ? 'bg-[#1e293b] text-white' : 'text-slate-500 hover:bg-slate-200']" @click="coursePage = p">{{ p }}</button>
            <button class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors disabled:opacity-30 disabled:pointer-events-none" :disabled="coursePage === totalPages" @click="coursePage++"><ChevronRight class="w-4 h-4" /></button>
          </div>
        </section>
      </div>

      <!-- ── RIGHT COLUMN (1/3 width) ─────────────────────────── -->
      <div class="flex flex-col gap-8">

        <!-- Mini Calendar -->
        <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-bold text-slate-800">{{ monthName }} {{ year }}</span>
            <div class="flex gap-1">
              <button class="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" @click="prevMonth"><ChevronLeft class="w-4 h-4" /></button>
              <button class="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors" @click="nextMonth"><ChevronRight class="w-4 h-4" /></button>
            </div>
          </div>
          <div class="grid grid-cols-7 mb-1">
            <span v-for="d in ['S','M','T','W','T','F','S']" :key="d" class="text-center text-[10px] font-bold text-slate-400">{{ d }}</span>
          </div>
          <div class="grid grid-cols-7 gap-y-0.5">
            <span v-for="n in startDay" :key="'bl'+n" />
            <button
              v-for="day in daysInMonth"
              :key="day"
              :class="['mx-auto w-7 h-7 rounded-full text-xs flex items-center justify-center transition-colors', dayClass(day)]"
            >{{ day }}</button>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#1e293b] inline-block"></span>Today</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>Urgent / Quiz</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>Medium</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span>Low Priority</span>
          </div>
        </section>

        <!-- Task Timeline -->
        <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ListTodo class="w-4 h-4" /> Upcoming Deadlines
          </h2>
          
          <!-- Upcoming Deadlines Sub-list -->
          <div v-if="upcomingTasks.length === 0" class="flex flex-col items-center py-8 text-center">
            <ListTodo class="w-8 h-8 text-slate-200 mb-2" />
            <p class="text-sm text-slate-400 font-medium">No upcoming deadlines</p>
          </div>
          <div v-else class="relative flex flex-col gap-0">
            <div class="absolute left-[15px] top-4 bottom-4 w-px bg-slate-100"></div>
            <RouterLink
              v-for="t in upcomingTasks" :key="t.id"
              :to="t.type === 'assignment' ? `/assignments/${t.id}/submit` : `/quizzes/${t.id}`"
              class="relative flex gap-4 pb-5 last:pb-0 hover:bg-slate-50/50 rounded-lg -mx-2 px-2 py-1 transition-colors cursor-pointer"
            >
              <div :class="['w-[10px] h-[10px] rounded-full mt-1.5 flex-shrink-0 ml-[10px] border-2 border-white ring-2', urgencyRing[t.urgency]]"></div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 leading-snug">{{ t.title }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ t.course }}</p>
                <div class="flex items-center gap-2 mt-1.5">
                  <span :class="['text-[11px] font-semibold px-2 py-0.5 rounded-full', urgencyBadge[t.urgency]]">
                    {{ t.urgency.charAt(0).toUpperCase() + t.urgency.slice(1) }}
                  </span>
                  <span class="text-[11px] text-slate-400 flex items-center gap-1">
                    <CalendarDays class="w-3 h-3" /> {{ formatDate(t.rawDate) }}
                  </span>
                </div>
              </div>
            </RouterLink>
          </div>

          <!-- Missed Deadlines Sub-list -->
          <div v-if="missedTasks.length > 0" class="border-t border-slate-100 pt-4 mt-4">
            <h3 class="text-xs font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle class="w-3.5 h-3.5" /> Missed Deadlines
            </h3>
            <div class="relative flex flex-col gap-0">
              <div class="absolute left-[15px] top-4 bottom-4 w-px bg-slate-100"></div>
              <div
                v-for="t in missedTasks" :key="t.id"
                class="relative flex items-center justify-between hover:bg-rose-50/30 rounded-lg -mx-2 px-2 py-1.5 transition-colors group/item"
              >
                <RouterLink
                  :to="t.type === 'assignment' ? `/assignments/${t.id}/submit` : `/quizzes/${t.id}`"
                  class="flex-1 flex gap-4 min-w-0 cursor-pointer"
                >
                  <div class="w-[10px] h-[10px] rounded-full mt-1.5 flex-shrink-0 ml-[10px] border-2 border-white ring-2 ring-rose-400 bg-rose-500"></div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-slate-800 leading-snug line-clamp-1 group-hover/item:text-rose-700 transition-colors">{{ t.title }}</p>
                    <p class="text-xs text-slate-400 mt-0.5">{{ t.course }}</p>
                    <div class="flex items-center gap-2 mt-1.5">
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                        Overdue
                      </span>
                      <span class="text-[11px] text-slate-400 flex items-center gap-1">
                        <CalendarDays class="w-3 h-3" /> Missed {{ formatDate(t.rawDate) }}
                      </span>
                    </div>
                  </div>
                </RouterLink>
                <button
                  type="button"
                  class="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-2 cursor-pointer opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                  title="Dismiss missed deadline"
                  @click.stop="dismissDeadline(t.id)"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Clock, BookOpen, ChevronLeft, ChevronRight,
  ListTodo, MonitorPlay, CalendarDays,
  Users, GraduationCap, Presentation, PenLine,
  X, AlertTriangle,
} from 'lucide-vue-next';
import { useEnrollmentStore } from '@/stores/enrollments.js';
import { useAuthStore }       from '@/stores/auth.js';
import { api }                from '@/api/client.js';

const auth            = useAuthStore();
const enrollmentStore = useEnrollmentStore();

const isLecturer = computed(() => ['lecturer', 'admin'].includes(auth.user?.role));
const dismissedDeadlineIds = ref([]);

onMounted(async () => {
  if (auth.user?._id) {
    const saved = localStorage.getItem(`dismissed-deadlines-${auth.user._id}`);
    if (saved) {
      try {
        dismissedDeadlineIds.value = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse dismissed deadlines:', e);
      }
    }
  }

  if (isLecturer.value) {
    await fetchLecturerCourses();
  } else {
    await Promise.all([
      enrollmentStore.fetchEnrollments(),
      fetchDeadlines()
    ]);
  }
});

function dismissDeadline(id) {
  if (!dismissedDeadlineIds.value.includes(id)) {
    dismissedDeadlineIds.value.push(id);
    if (auth.user?._id) {
      localStorage.setItem(`dismissed-deadlines-${auth.user._id}`, JSON.stringify(dismissedDeadlineIds.value));
    }
  }
}

// ── Lecturer courses ───────────────────────────────────────────────────────────
const lecturerCourses  = ref([]);
const lecturerLoading  = ref(false);
const lecturerPage     = ref(1);
const LECTURER_PAGE_SIZE = 12;

const lecturerTotalPages = computed(() =>
  Math.ceil(lecturerCourses.value.length / LECTURER_PAGE_SIZE) || 1
);
const paginatedLecturerCourses = computed(() => {
  const start = (lecturerPage.value - 1) * LECTURER_PAGE_SIZE;
  return lecturerCourses.value.slice(start, start + LECTURER_PAGE_SIZE);
});

async function fetchLecturerCourses() {
  lecturerLoading.value = true;
  try {
    const data = await api.get('/api/courses/my');
    lecturerCourses.value = data.courses ?? [];
  } catch (e) {
    console.error('Failed to load lecturer courses:', e);
    lecturerCourses.value = [];
  } finally {
    lecturerLoading.value = false;
  }
}

// ── Student: recently accessed ────────────────────────────────────────────────
const recentCourses = computed(() =>
  enrollmentStore.recentEnrollments.map(e => ({
    code:     e.course?.code     ?? '',
    title:    e.course?.title    ?? '',
    color:    e.course?.color    ?? 'bg-slate-500',
    accessed: formatRelative(e.lastAccessed),
  }))
);

// ── Student: enrolled courses ─────────────────────────────────────────────────
const enrolledCourses = computed(() =>
  enrollmentStore.enrollments.map(e => ({
    _id:      e._id,
    code:     e.course?.code     ?? '',
    title:    e.course?.title    ?? '',
    faculty:  e.course?.dept     ?? '',
    progress: e.progress         ?? 0,
    color:    e.course?.color    ?? 'bg-slate-500',
  }))
);

const PAGE_SIZE  = 12;
const coursePage = ref(1);
const totalPages = computed(() => Math.ceil(enrolledCourses.value.length / PAGE_SIZE) || 1);
const paginatedCourses = computed(() => {
  const start = (coursePage.value - 1) * PAGE_SIZE;
  return enrolledCourses.value.slice(start, start + PAGE_SIZE);
});

async function unenroll(enrollmentId) {
  await enrollmentStore.unenroll(enrollmentId);
}

// ── Calendar ──────────────────────────────────────────────────────────────────
const today        = new Date();
const currentMonth = ref(today.getMonth());
const currentYear  = ref(today.getFullYear());

const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const monthName = computed(() => MONTHS[currentMonth.value]);
const year      = computed(() => currentYear.value);
const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate());
const startDay    = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay());

const dueDays = computed(() =>
  tasks.value
    .filter(t => {
      const d = new Date(t.rawDate);
      return d.getMonth() === currentMonth.value && d.getFullYear() === currentYear.value;
    })
    .map(t => new Date(t.rawDate).getDate())
);

function isToday(day) {
  return day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value  === today.getFullYear();
}
function hasDue(day) { return dueDays.value.includes(day); }
function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value--; }
  else currentMonth.value--;
}
function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++; }
  else currentMonth.value++;
}

// ── Tasks (empty by default) ──────────────────────────────────────────────────
const tasks = ref([]);

const upcomingTasks = computed(() => {
  return tasks.value.filter(t => {
    if (!t.rawDate) return true;
    return new Date(t.rawDate) >= new Date();
  });
});

const missedTasks = computed(() => {
  return tasks.value.filter(t => {
    if (!t.rawDate) return false;
    const isPast = new Date(t.rawDate) < new Date();
    const isMissed = isPast && !t.hasSubmission;
    const isDismissed = dismissedDeadlineIds.value.includes(t.id);
    return isMissed && !isDismissed;
  });
});

async function fetchDeadlines() {
  try {
    const data = await api.get('/api/users/deadlines');
    tasks.value = (data.deadlines || []).map(d => ({
      id: d._id,
      title: d.title,
      course: `${d.courseCode} — ${d.courseTitle}`,
      urgency: d.urgency, // 'high', 'medium', 'low'
      rawDate: d.dueDate || d.closesAt,
      type: d.type, // 'assignment' or 'quiz'
      hasSubmission: d.hasSubmission,
    }));
  } catch (err) {
    console.error('Failed to fetch deadlines:', err);
  }
}

function getDayTasks(day) {
  return tasks.value.filter(t => {
    if (!t.rawDate) return false;
    const d = new Date(t.rawDate);
    return d.getDate() === day &&
           d.getMonth() === currentMonth.value &&
           d.getFullYear() === currentYear.value;
  });
}

function dayClass(day) {
  if (isToday(day)) {
    return 'bg-[#1e293b] text-white font-bold';
  }
  
  const dayTasks = getDayTasks(day);
  if (dayTasks.length === 0) {
    return 'text-slate-600 hover:bg-slate-100';
  }
  
  if (dayTasks.some(t => t.urgency === 'high')) {
    return 'bg-red-100 text-red-700 font-bold hover:bg-red-200 border border-red-200';
  }
  if (dayTasks.some(t => t.urgency === 'medium')) {
    return 'bg-amber-100 text-amber-700 font-bold hover:bg-amber-200 border border-amber-200';
  }
  return 'bg-green-100 text-green-700 font-bold hover:bg-green-200 border border-green-200';
}

const urgencyRing = {
  high:   'ring-red-400   bg-red-400',
  medium: 'ring-amber-400 bg-amber-400',
  low:    'ring-green-400 bg-green-400',
};
const urgencyBadge = {
  high:   'bg-red-50    text-red-600   border border-red-200',
  medium: 'bg-amber-50  text-amber-600 border border-amber-200',
  low:    'bg-green-50  text-green-600 border border-green-200',
};

function formatDate(raw) {
  if (!raw) return '';
  return new Date(raw).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(dateStr) {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days === 1)  return 'Yesterday';
  return `${days} days ago`;
}
</script>
