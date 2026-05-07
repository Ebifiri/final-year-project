<template>
  <main class="flex-1 bg-slate-50 p-6 lg:p-8">

    <!-- Page heading -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p class="text-sm text-slate-500 mt-1">Welcome back, Ayebaebifiri 👋</p>
    </div>

    <!-- Two-column grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

      <!-- ── LEFT COLUMN (2/3 width) ───────────────────────────── -->
      <div class="xl:col-span-2 flex flex-col gap-8">

        <!-- Recently Accessed -->
        <section>
          <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock class="w-4 h-4" /> Recently Accessed
          </h2>
          <div class="flex gap-4 overflow-x-auto pb-2">
            <RouterLink
              v-for="c in recentCourses"
              :key="c.code"
              :to="'/courses/' + c.code"
              class="flex-shrink-0 w-56 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
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

          <!-- 4-column grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <RouterLink
              v-for="c in paginatedCourses"
              :key="c.code"
              :to="'/courses/' + c.code"
              class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
            >
              <!-- Top colour band -->
              <div :class="['h-24 flex items-end p-3 relative overflow-hidden', c.color]">
                <div class="absolute inset-0 bg-black/10"></div>
                <MonitorPlay class="absolute top-3 right-3 w-5 h-5 text-white/60" />
                <span class="relative text-[11px] font-bold text-white bg-black/25 px-2 py-0.5 rounded">{{ c.code }}</span>
              </div>
              <!-- Body -->
              <div class="p-3">
                <p class="text-xs font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">{{ c.title }}</p>
                <p class="text-[11px] text-slate-400 mt-1">{{ c.faculty }}</p>
                <!-- Progress -->
                <div class="mt-2.5 flex items-center gap-2">
                  <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div :class="['h-full rounded-full', c.color]" :style="{ width: c.progress + '%' }"></div>
                  </div>
                  <span class="text-[11px] text-slate-400 font-medium shrink-0">{{ c.progress }}%</span>
                </div>
              </div>
            </RouterLink>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-center gap-1.5 mt-5">
            <button
              class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              :disabled="coursePage === 1"
              @click="coursePage--"
            ><ChevronLeft class="w-4 h-4" /></button>

            <button
              v-for="p in totalPages"
              :key="p"
              :class="[
                'w-8 h-8 rounded-lg text-sm font-semibold transition-colors',
                coursePage === p
                  ? 'bg-[#1e293b] text-white'
                  : 'text-slate-500 hover:bg-slate-200'
              ]"
              @click="coursePage = p"
            >{{ p }}</button>

            <button
              class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              :disabled="coursePage === totalPages"
              @click="coursePage++"
            ><ChevronRight class="w-4 h-4" /></button>
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
              <button
                class="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                @click="prevMonth"
              ><ChevronLeft class="w-4 h-4" /></button>
              <button
                class="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                @click="nextMonth"
              ><ChevronRight class="w-4 h-4" /></button>
            </div>
          </div>

          <!-- Day headers -->
          <div class="grid grid-cols-7 mb-1">
            <span
              v-for="d in ['S','M','T','W','T','F','S']"
              :key="d"
              class="text-center text-[10px] font-bold text-slate-400"
            >{{ d }}</span>
          </div>

          <!-- Day cells -->
          <div class="grid grid-cols-7 gap-y-0.5">
            <span v-for="n in startDay" :key="'bl'+n" />
            <button
              v-for="day in daysInMonth"
              :key="day"
              :class="[
                'mx-auto w-7 h-7 rounded-full text-xs flex items-center justify-center transition-colors',
                isToday(day)
                  ? 'bg-[#1e293b] text-white font-bold'
                  : hasDue(day)
                    ? 'bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200'
                    : 'text-slate-600 hover:bg-slate-100',
              ]"
            >{{ day }}</button>
          </div>

          <div class="flex gap-3 mt-3 text-[11px] text-slate-500">
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#1e293b] inline-block"></span>Today</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-200 inline-block"></span>Due</span>
          </div>
        </section>

        <!-- Task Timeline -->
        <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ListTodo class="w-4 h-4" /> Upcoming Deadlines
          </h2>

          <div class="relative flex flex-col gap-0">
            <!-- Timeline line -->
            <div class="absolute left-[15px] top-4 bottom-4 w-px bg-slate-100"></div>

            <div
              v-for="t in tasks"
              :key="t.id"
              class="relative flex gap-4 pb-5 last:pb-0"
            >
              <!-- Dot -->
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
            </div>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  Clock, BookOpen, ChevronLeft, ChevronRight,
  ListTodo, MonitorPlay, CalendarDays,
} from 'lucide-vue-next';

// ── Recently Accessed ────────────────────────────────────────────────────────
const recentCourses = [
  { code: 'CYB 201', title: 'Cybersecurity Fundamentals',            color: 'bg-rose-500',    accessed: '2 hours ago' },
  { code: 'DAT 401', title: 'Advanced Data Analytics',               color: 'bg-amber-500',   accessed: 'Yesterday'   },
  { code: 'BUS 302', title: 'Business Ethics & Law',                 color: 'bg-blue-500',    accessed: '3 days ago'  },
  { code: 'FMS 204', title: 'Digital Media Production',              color: 'bg-purple-500',  accessed: '5 days ago'  },
];

// ── Enrolled Courses ─────────────────────────────────────────────────────────
const enrolledCourses = [
  { code: 'CYB 201', title: 'Cybersecurity Fundamentals',               faculty: 'SST',              progress: 68, color: 'bg-rose-500'    },
  { code: 'DAT 401', title: 'Advanced Data Analytics',                  faculty: 'ISMS',             progress: 45, color: 'bg-amber-500'   },
  { code: 'BUS 302', title: 'Business Ethics & Law',                    faculty: 'SMSS',             progress: 80, color: 'bg-blue-500'    },
  { code: 'FMS 204', title: 'Digital Media Production',                 faculty: 'Film & Multimedia',progress: 30, color: 'bg-purple-500'  },
  { code: 'MCM 302', title: 'Media Law & Ethics',                       faculty: 'MassComm',         progress: 55, color: 'bg-teal-500'    },
  { code: 'STR 101', title: 'Introduction to Strategic Communication',  faculty: 'SST',              progress: 90, color: 'bg-emerald-500' },
];

const PAGE_SIZE  = 12; // 4 cols × 3 rows
const coursePage = ref(1);
const totalPages = computed(() => Math.ceil(enrolledCourses.length / PAGE_SIZE));
const paginatedCourses = computed(() => {
  const start = (coursePage.value - 1) * PAGE_SIZE;
  return enrolledCourses.slice(start, start + PAGE_SIZE);
});

// ── Calendar ─────────────────────────────────────────────────────────────────
const today        = new Date();
const currentMonth = ref(today.getMonth());
const currentYear  = ref(today.getFullYear());

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const monthName    = computed(() => MONTHS[currentMonth.value]);
const year         = computed(() => currentYear.value);
const daysInMonth  = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate());
const startDay     = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay());

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

// ── Tasks ────────────────────────────────────────────────────────────────────
const tasks = ref([
  { id: 1, title: 'Cybersecurity Lab Report',        course: 'CYB 201', rawDate: '2026-04-03', urgency: 'high'   },
  { id: 2, title: 'Data Analytics Assignment 3',     course: 'DAT 401', rawDate: '2026-04-07', urgency: 'medium' },
  { id: 3, title: 'Business Ethics Essay',           course: 'BUS 302', rawDate: '2026-04-10', urgency: 'medium' },
  { id: 4, title: 'Media Production Final Project',  course: 'FMS 204', rawDate: '2026-04-18', urgency: 'low'    },
  { id: 5, title: 'Media Law Case Study',            course: 'MCM 302', rawDate: '2026-04-22', urgency: 'low'    },
]);

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
  return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
</script>
