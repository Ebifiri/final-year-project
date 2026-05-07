<template>
  <main class="flex-1 bg-slate-50">

    <!-- HERO SECTION -->
    <section class="relative w-full h-[350px] md:h-[450px] bg-slate-900 overflow-hidden">
      <img
        src="../assets/home/home1.jpg"
        alt="Students looking at laptop"
        class="absolute inset-0 w-full h-full object-cover opacity-70"
      />
      <div class="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent"></div>

      <div class="relative h-full px-6 lg:px-12 flex items-center max-w-7xl mx-auto">
        <div class="bg-white/95 backdrop-blur-sm p-6 md:p-10 rounded-2xl shadow-2xl max-w-lg">
          <div class="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-blue-700 uppercase bg-blue-100 rounded-full">
            Policy Update
          </div>
          <h2 class="text-2xl md:text-3xl font-bold text-slate-900 mb-3 leading-tight">
            Approved PAU Plagiarism Policy
          </h2>
          <p class="text-slate-600 mb-6 text-sm md:text-base leading-relaxed">
            To ensure academic integrity. This applies to all student submissions.
          </p>
          <button class="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-blue-600/30">
            Read the Policy
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>

    <!-- AVAILABLE COURSES SECTION -->
    <section class="px-6 lg:px-12 py-12 max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h3 class="text-2xl font-bold text-slate-900">Available Courses</h3>
          <p class="text-slate-500 mt-1">Explore all programs and modules available to you.</p>
        </div>
        <RouterLink
          to="/courses"
          class="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          View all courses
          <ArrowRight class="w-4 h-4" />
        </RouterLink>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <div v-for="n in 6" :key="n" class="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
          <div class="h-28 bg-slate-200"></div>
          <div class="p-5 space-y-3">
            <div class="h-3 bg-slate-200 rounded w-1/3"></div>
            <div class="h-4 bg-slate-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <RouterLink
          v-for="c in featuredCourses"
          :key="c.code"
          :to="'/courses/' + c.code"
          class="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all flex flex-col h-full"
        >
          <div :class="['h-28 p-5 flex items-end relative overflow-hidden', c.color]">
            <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div class="absolute -bottom-4 -left-4 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>
            <div class="bg-white/20 backdrop-blur-md px-3 py-1 rounded text-white text-xs font-bold tracking-wider relative z-10">
              {{ c.code }}
            </div>
          </div>
          <div class="p-5 flex flex-col flex-grow">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">{{ c.dept }}</span>
            <h4 class="font-bold text-slate-900 leading-snug mb-4 group-hover:text-blue-600 transition-colors">{{ c.title }}</h4>
            <div class="mt-auto pt-4 border-t border-slate-100 flex items-center text-sm font-medium text-blue-600">
              <BookOpen class="w-4 h-4 mr-2" />
              Go to course
            </div>
          </div>
        </RouterLink>
      </div>
    </section>

  </main>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowRight, BookOpen } from 'lucide-vue-next';
import { useCourseStore } from '@/stores/courses.js';
import { useAuthStore }   from '@/stores/auth.js';

const courseStore     = useCourseStore();
const auth            = useAuthStore();
const loading         = computed(() => courseStore.loading);
const featuredCourses = computed(() => courseStore.courses.slice(0, 6));

onMounted(() => {
  if (auth.isLoggedIn) {
    courseStore.fetchCourses();
  }
});
</script>
