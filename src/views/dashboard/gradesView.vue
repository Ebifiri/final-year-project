<template>
  <main class="flex-1 bg-slate-50 p-6 lg:p-8">
    <!-- Page heading -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">My Grades</h1>
        <p class="text-sm text-slate-500 mt-1">Track your performance and progress across all enrolled courses.</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-6">
      <div v-for="i in 3" :key="i" class="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
        <div class="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div class="h-4 bg-slate-100 rounded w-full mb-2"></div>
        <div class="h-4 bg-slate-100 rounded w-3/4"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!courses.length" class="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed text-center">
      <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
        <Award class="w-8 h-8 text-blue-300" />
      </div>
      <p class="text-lg font-bold text-slate-700">No Grades Available</p>
      <p class="text-sm text-slate-400 mt-1 max-w-md">You are not enrolled in any courses or there are no graded assignments/quizzes yet.</p>
      <RouterLink to="/courses" class="mt-4 px-5 py-2.5 bg-[#1e293b] text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition-colors">Browse Courses</RouterLink>
    </div>

    <!-- Grades content -->
    <div v-else class="space-y-8">
      <div
        v-for="course in courses"
        :key="course._id"
        class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <!-- Course header -->
        <div :class="['p-6 text-white relative overflow-hidden', course.color || 'bg-slate-600']">
          <div class="absolute inset-0 bg-black/10"></div>
          <div class="relative flex items-center justify-between">
            <div>
              <span class="text-xs font-extrabold bg-black/20 px-2 py-0.5 rounded uppercase tracking-wider">{{ course.code }}</span>
              <h2 class="text-xl font-bold mt-2">{{ course.title }}</h2>
            </div>
            <!-- Overall Percentage Insight -->
            <div class="flex flex-col items-end">
              <span class="text-sm font-semibold opacity-90">Overall Score</span>
              <div class="text-3xl font-extrabold flex items-baseline gap-1 mt-1">
                <template v-if="course.percentage != null">
                  {{ course.percentage }}<span class="text-lg opacity-80">%</span>
                </template>
                <template v-else>
                  --<span class="text-lg opacity-80">%</span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <!-- Assignments List -->
            <div>
              <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText class="w-4 h-4" /> Assignments
              </h3>
              <div v-if="!course.assignments.length" class="text-sm text-slate-400 italic bg-slate-50 rounded-lg p-4 text-center">
                No assignments available
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="assign in course.assignments"
                  :key="assign._id"
                  class="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <p class="text-sm font-semibold text-slate-800">{{ assign.title }}</p>
                  <div class="flex items-center gap-2">
                    <span v-if="assign.grade != null" :class="['text-sm font-bold px-2.5 py-1 rounded-lg', getGradeColor(assign.grade, assign.totalPoints)]">
                      {{ assign.grade }} / {{ assign.totalPoints }}
                    </span>
                    <span v-else class="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      Not Graded
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quizzes List -->
            <div>
              <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckSquare class="w-4 h-4" /> Quizzes
              </h3>
              <div v-if="!course.quizzes.length" class="text-sm text-slate-400 italic bg-slate-50 rounded-lg p-4 text-center">
                No quizzes available
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="quiz in course.quizzes"
                  :key="quiz._id"
                  class="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <p class="text-sm font-semibold text-slate-800">{{ quiz.title }}</p>
                  <div class="flex items-center gap-2">
                    <span v-if="quiz.score != null" :class="['text-sm font-bold px-2.5 py-1 rounded-lg', getGradeColor(quiz.score, quiz.totalPoints)]">
                      {{ quiz.score }} / {{ quiz.totalPoints }}
                    </span>
                    <span v-else class="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      Not Attempted
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/api/client.js';
import { Award, FileText, CheckSquare } from 'lucide-vue-next';

const loading = ref(true);
const courses = ref([]);

onMounted(async () => {
  try {
    const data = await api.get('/api/users/grades');
    courses.value = data.courses || [];
  } catch (error) {
    console.error('Failed to load grades:', error);
  } finally {
    loading.value = false;
  }
});

function getGradeColor(score, total) {
  if (total === 0) return 'text-slate-600 bg-slate-100';
  const percentage = score / total;
  if (percentage >= 0.7) return 'text-emerald-700 bg-emerald-100 border border-emerald-200';
  if (percentage >= 0.4) return 'text-amber-700 bg-amber-100 border border-amber-200';
  return 'text-rose-700 bg-rose-100 border border-rose-200';
}
</script>
