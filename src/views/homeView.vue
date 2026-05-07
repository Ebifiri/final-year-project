<template>
  <!-- Scrollable page content — layout shell is provided by NavBar in App.vue -->
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
        <button class="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 text-sm font-semibold rounded-lg shadow-sm transition-all">
          View all courses
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <CourseCard title="Introduction to Strategic Communication" faculty="SST" code="STR 101" color="bg-emerald-500" />
        <CourseCard title="Digital Media Production" faculty="Film & Multimedia" code="FMS 204" color="bg-purple-500" />
        <CourseCard title="Business Ethics & Law" faculty="SMSS" code="BUS 302" color="bg-blue-500" />
        <CourseCard title="Advanced Data Analytics" faculty="ISMS" code="DAT 401" color="bg-amber-500" />
        <CourseCard title="Cybersecurity Fundamentals" faculty="SST" code="CYB 201" color="bg-rose-500" />
        <CourseCard title="Media Law & Ethics" faculty="MassComm" code="MCM 302" color="bg-teal-500" />
      </div>
    </section>

  </main>
</template>

<script setup>
import { defineComponent, h } from 'vue';
import { ArrowRight, BookOpen } from 'lucide-vue-next';

// ── CourseCard ──────────────────────────────────────────────────────────────
const CourseCard = defineComponent({
  name: 'CourseCard',
  props: {
    title: { type: String, required: true },
    faculty: { type: String, required: true },
    code: { type: String, required: true },
    color: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h('div', {
        class: 'group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col h-full',
      }, [
        h('div', { class: `h-28 ${props.color} p-5 flex items-end relative overflow-hidden` }, [
          h('div', { class: 'absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl' }),
          h('div', { class: 'absolute -bottom-4 -left-4 w-20 h-20 bg-black/10 rounded-full blur-xl' }),
          h('div', {
            class: 'bg-white/20 backdrop-blur-md px-3 py-1 rounded text-white text-xs font-bold tracking-wider relative z-10',
          }, props.code),
        ]),
        h('div', { class: 'p-5 flex flex-col flex-grow' }, [
          h('span', { class: 'text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block' }, props.faculty),
          h('h4', { class: 'font-bold text-slate-900 leading-snug mb-4 group-hover:text-blue-600 transition-colors' }, props.title),
          h('div', { class: 'mt-auto pt-4 border-t border-slate-100 flex items-center text-sm font-medium text-blue-600' }, [
            h(BookOpen, { class: 'w-4 h-4 mr-2' }),
            'Go to course',
          ]),
        ]),
      ]);
  },
});
</script>
