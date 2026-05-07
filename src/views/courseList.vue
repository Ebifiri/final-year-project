<template>
  <main class="flex-1 bg-slate-50 p-6 lg:p-8">

    <!-- Page heading + active filter banner -->
    <div class="mb-6">
      <div class="flex flex-wrap items-center gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Course Catalogue</h1>
          <p class="text-sm text-slate-500 mt-0.5">
            {{ filteredCourses.length }} course{{ filteredCourses.length !== 1 ? 's' : '' }} available
          </p>
        </div>

        <!-- Active filter pills -->
        <div class="flex flex-wrap gap-2 ml-auto">
          <span
            v-if="activeDept"
            class="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full"
          >
            {{ activeDept }}
            <button @click="clearDept" class="hover:text-blue-900 transition-colors">
              <X class="w-3 h-3" />
            </button>
          </span>
          <span
            v-if="activeYear"
            class="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full"
          >
            {{ activeYear }}
            <button @click="clearYear" class="hover:text-indigo-900 transition-colors">
              <X class="w-3 h-3" />
            </button>
          </span>
          <button
            v-if="activeDept || activeYear || searchQuery"
            @click="clearAll"
            class="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-300 rounded-full hover:border-slate-400 transition-colors"
          >Clear all</button>
        </div>
      </div>

      <!-- Search bar -->
      <div class="relative mt-4 max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search courses by title, code, or faculty…"
          class="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
        />
      </div>
    </div>

    <!-- Course grid -->
    <div
      v-if="paginatedCourses.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
    >
      <RouterLink
        v-for="c in paginatedCourses"
        :key="c.code"
        :to="'/courses/' + c.code"
        class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all flex flex-col group"
      >
        <!-- Colour header -->
        <div :class="['h-28 relative overflow-hidden p-4 flex flex-col justify-between', c.color]">
          <div class="absolute inset-0 bg-linear-to-br from-black/5 to-black/25"></div>
          <div class="relative flex justify-between items-start">
            <span class="text-[11px] font-bold text-white bg-black/25 px-2 py-0.5 rounded">{{ c.code }}</span>
            <span class="text-[10px] font-semibold text-white/80 bg-black/20 px-2 py-0.5 rounded">{{ c.year }}</span>
          </div>
          <div class="relative">
            <BookOpen class="w-7 h-7 text-white/60" />
          </div>
        </div>

        <!-- Body -->
        <div class="p-4 flex flex-col flex-1">
          <p class="text-sm font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
            {{ c.title }}
          </p>
          <p class="text-xs text-slate-400 mt-1">{{ c.dept }}</p>
          <p class="text-xs text-slate-500 mt-2 line-clamp-2 flex-1">{{ c.description }}</p>

          <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <span class="text-xs text-slate-400">{{ c.credits }} credit{{ c.credits !== 1 ? 's' : '' }}</span>

            <!-- Already enrolled: show unenroll button -->
            <template v-if="isEnrolled(c.code)">
              <span class="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 class="w-3 h-3" /> Enrolled
              </span>
              <button
                class="text-xs font-bold px-3 py-1.5 text-red-500 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                @click.stop="unenrollByCourse(c.code)"
              >
                Unenroll
              </button>
            </template>

            <!-- Enroll button -->
            <button
              v-else
              class="text-xs font-bold px-3 py-1.5 bg-[#1e293b] hover:bg-slate-700 text-white rounded-lg transition-colors"
              @click.stop="enroll(c.code)"
            >
              Enroll
            </button>
          </div>
        </div>
      </RouterLink>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-24 text-center">
      <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <SearchX class="w-7 h-7 text-slate-400" />
      </div>
      <p class="font-semibold text-slate-700">No courses found</p>
      <p class="text-sm text-slate-400 mt-1">Try adjusting your filters or search term.</p>
      <button @click="clearAll" class="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
        Clear filters
      </button>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-center gap-1.5 mt-8">
      <button
        class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        :disabled="page === 1"
        @click="page--"
      ><ChevronLeft class="w-4 h-4" /></button>

      <button
        v-for="p in totalPages"
        :key="p"
        :class="[
          'w-8 h-8 rounded-lg text-sm font-semibold transition-colors',
          page === p ? 'bg-[#1e293b] text-white' : 'text-slate-500 hover:bg-slate-200'
        ]"
        @click="page = p"
      >{{ p }}</button>

      <button
        class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        :disabled="page === totalPages"
        @click="page++"
      ><ChevronRight class="w-4 h-4" /></button>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Search, X, BookOpen, ChevronLeft, ChevronRight,
  CheckCircle2, SearchX,
} from 'lucide-vue-next';
import { useCourseStore }      from '@/stores/courses.js';
import { useEnrollmentStore }  from '@/stores/enrollments.js';

const route   = useRoute();
const router  = useRouter();

const courseStore     = useCourseStore();
const enrollmentStore = useEnrollmentStore();

// ── Reactive filter state (driven by URL query params) ───────────────────────
const searchQuery = ref(route.query.q || '');
const page        = ref(1);

const activeDept = computed(() => route.query.dept || '');
const activeYear = computed(() => route.query.year || '');

// Fetch from API whenever filters change
watch([activeDept, activeYear, searchQuery], () => {
  page.value = 1;
  courseStore.fetchCourses({ search: searchQuery.value, dept: activeDept.value, year: activeYear.value });
}, { immediate: false });

// Keep searchQuery in sync with URL ?q=
watch(() => route.query.q, (val) => { searchQuery.value = val || ''; });

onMounted(() => {
  courseStore.fetchCourses({ search: searchQuery.value, dept: activeDept.value, year: activeYear.value });
  enrollmentStore.fetchEnrollments();
});

function clearDept() { router.push({ query: { ...route.query, dept: undefined } }); }
function clearYear() { router.push({ query: { ...route.query, year: undefined } }); }
function clearAll()  { searchQuery.value = ''; router.push({ query: {} }); }

// ── Enroll / unenroll ────────────────────────────────────────────────────────
function isEnrolled(code) { return enrollmentStore.isEnrolled(code); }

async function enroll(code) {
  await enrollmentStore.enroll(code);
}

async function unenrollByCourse(code) {
  const enrollment = enrollmentStore.enrollments.find(e => e.course?.code === code);
  if (enrollment) await enrollmentStore.unenroll(enrollment._id);
}

// ── Pagination (client-side over API results) ────────────────────────────────
const courses        = computed(() => courseStore.courses);
const PAGE_SIZE      = 12;
const totalPages     = computed(() => Math.max(1, Math.ceil(courses.value.length / PAGE_SIZE)));
const paginatedCourses = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return courses.value.slice(start, start + PAGE_SIZE);
});

// alias for the template "X courses available" count
const filteredCourses = courses;
</script>
