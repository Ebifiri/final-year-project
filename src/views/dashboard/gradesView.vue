<template>
  <main class="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8">

    <!-- ── STUDENT VIEW ────────────────────────────────────────────── -->
    <template v-if="auth.user?.role === 'student'">
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
      <div v-else-if="!studentCourses.length" class="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed text-center">
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
          v-for="course in studentCourses"
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
    </template>

    <!-- ── LECTURER / ADMIN VIEW — Progress Reports ────────────────── -->
    <template v-else>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">Student Progress Reports</h1>
        <p class="text-sm text-slate-500 mt-1">Monitor student performance, identify weak areas, and send guidance.</p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-6">
        <div v-for="i in 3" :key="i" class="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
          <div class="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div class="h-4 bg-slate-100 rounded w-full mb-2"></div>
          <div class="h-4 bg-slate-100 rounded w-2/3"></div>
        </div>
      </div>

      <!-- No courses -->
      <div v-else-if="!lecturerCourses.length" class="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed text-center">
        <div class="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <Users class="w-8 h-8 text-blue-300" />
        </div>
        <p class="text-lg font-bold text-slate-700">No Courses Found</p>
        <p class="text-sm text-slate-400 mt-1 max-w-md">You are not assigned as a lecturer for any courses.</p>
      </div>

      <!-- Course tabs + content -->
      <template v-else>
        <!-- Course Tabs -->
        <div class="flex items-center gap-2 mb-6">
          <button
            @click="prevPage"
            :disabled="currentPage === 0"
            class="p-2 shrink-0 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>

          <div class="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            <button
              v-for="c in paginatedCourses"
              :key="c._id"
              :class="[
                'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all truncate',
                activeCourseId === c._id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
              ]"
              @click="selectCourse(c._id)"
              :title="c.title"
            >
              <BookOpen class="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span class="truncate">{{ c.code }}</span>
            </button>
          </div>

          <button
            @click="nextPage"
            :disabled="currentPage >= totalPages - 1"
            class="p-2 shrink-0 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>

        <!-- Loading progress data -->
        <div v-if="progressLoading" class="space-y-4 animate-pulse">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <div class="h-5 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div class="space-y-3">
              <div v-for="i in 5" :key="i" class="h-12 bg-slate-100 rounded-xl"></div>
            </div>
          </div>
        </div>

        <!-- Progress content -->
        <template v-else-if="progressData">
          <!-- Class Summary Stats -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div class="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p class="text-2xl font-extrabold text-slate-900">{{ progressData.students.length }}</p>
              <p class="text-xs font-medium text-slate-500 mt-1">Enrolled</p>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p class="text-2xl font-extrabold text-emerald-600">{{ classAverage }}%</p>
              <p class="text-xs font-medium text-slate-500 mt-1">Class Average</p>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p class="text-2xl font-extrabold text-amber-600">{{ atRiskCount }}</p>
              <p class="text-xs font-medium text-slate-500 mt-1">At Risk (&lt;50%)</p>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p class="text-2xl font-extrabold text-blue-600">{{ topPerformers }}</p>
              <p class="text-xs font-medium text-slate-500 mt-1">Top (&ge;80%)</p>
            </div>
          </div>

          <!-- Two-column: Student List + Detail -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Left: Student List -->
            <div class="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 class="text-sm font-bold text-slate-700">Students</h3>
              </div>
              <div class="max-h-[65vh] overflow-y-auto divide-y divide-slate-50">
                <button
                  v-for="s in sortedStudents"
                  :key="s.user._id"
                  :class="[
                    'w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors',
                    selectedStudent?.user._id === s.user._id
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  ]"
                  @click="selectStudent(s)"
                >
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-800 truncate">{{ s.user.name }}</p>
                    <p class="text-[10px] text-slate-400 truncate">{{ s.user.email }}</p>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <span :class="['text-xs font-extrabold px-2 py-0.5 rounded-full', getPercentageBadge(s.overallPercentage)]">
                      {{ s.overallPercentage != null ? s.overallPercentage + '%' : '—' }}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <!-- Right: Student Detail -->
            <div class="lg:col-span-2 space-y-6">
              <!-- No student selected -->
              <div v-if="!selectedStudent" class="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Users class="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p class="text-sm font-bold text-slate-700">Select a student</p>
                <p class="text-xs text-slate-400 mt-1">Click a student from the list to view their detailed progress report.</p>
              </div>

              <template v-else>
                <!-- Student header -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div class="flex items-start justify-between">
                    <div>
                      <h3 class="text-lg font-bold text-slate-900">{{ selectedStudent.user.name }}</h3>
                      <p class="text-xs text-slate-500 mt-0.5">{{ selectedStudent.user.email }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-3xl font-extrabold" :class="getPercentageTextColor(selectedStudent.overallPercentage)">
                        {{ selectedStudent.overallPercentage != null ? selectedStudent.overallPercentage + '%' : '—' }}
                      </p>
                      <p class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Overall</p>
                    </div>
                  </div>
                </div>

                <!-- Quiz Breakdown -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div class="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare class="w-4 h-4" /> Quiz Performance
                    </h4>
                  </div>
                  <div v-if="!selectedStudent.quizzes.length" class="p-6 text-sm text-slate-400 italic text-center">
                    No quizzes in this course
                  </div>
                  <div v-else class="divide-y divide-slate-50">
                    <div v-for="q in selectedStudent.quizzes" :key="q.quizId" class="p-4">
                      <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-semibold text-slate-800">{{ q.title }}</p>
                        <span v-if="q.attempted" :class="['text-xs font-bold px-2 py-0.5 rounded-full', getGradeColor(q.score, q.totalPoints)]">
                          {{ q.score }} / {{ q.totalPoints }}
                        </span>
                        <span v-else class="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Not Attempted
                        </span>
                      </div>
                      <!-- Question-level breakdown for attempted quizzes -->
                      <div v-if="q.attempted && q.answers.length" class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                        <div
                          v-for="(ans, idx) in q.answers"
                          :key="idx"
                          :class="[
                            'flex items-start gap-2 px-3 py-2 rounded-lg text-xs',
                            ans.isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                          ]"
                        >
                          <component :is="ans.isCorrect ? CheckCircle : XCircle" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span class="line-clamp-2">Q{{ ans.questionIndex + 1 }}: {{ q.questions[ans.questionIndex]?.text?.substring(0, 60) }}{{ q.questions[ans.questionIndex]?.text?.length > 60 ? '…' : '' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Assignment Breakdown -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div class="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <FileText class="w-4 h-4" /> Assignment Grades
                    </h4>
                  </div>
                  <div v-if="!selectedStudent.assignments.length" class="p-6 text-sm text-slate-400 italic text-center">
                    No assignments in this course
                  </div>
                  <div v-else class="divide-y divide-slate-50">
                    <div v-for="a in selectedStudent.assignments" :key="a.assignmentId" class="flex items-center justify-between p-4">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-800">{{ a.title }}</p>
                        <p v-if="a.feedback" class="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">Feedback: {{ a.feedback }}</p>
                      </div>
                      <span v-if="a.grade != null" :class="['text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0', getGradeColor(a.grade, a.totalPoints)]">
                        {{ a.grade }} / {{ a.totalPoints }}
                      </span>
                      <span v-else-if="!a.submitted" class="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        Not Submitted
                      </span>
                      <span v-else class="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>

                <!-- AI Weakness Insights -->
                <div class="bg-gradient-to-br from-violet-50 via-blue-50 to-pink-50 rounded-2xl border border-blue-200/60 shadow-sm overflow-hidden">
                  <div class="p-4 border-b border-blue-100 flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles class="w-4 h-4 text-white" />
                    </div>
                    <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Performance Insights</h4>
                  </div>
                  <div class="p-5">
                    <div v-if="insightsLoading" class="flex items-center gap-3 text-sm text-slate-500">
                      <span class="w-4 h-4 border-2 border-blue-400 border-t-blue-600 rounded-full animate-spin"></span>
                      Analysing student performance…
                    </div>
                    <div v-else-if="insightsError" class="text-sm text-red-600">
                      {{ insightsError }}
                    </div>
                    <div v-else-if="insightsText" class="prose prose-sm prose-slate max-w-none text-sm text-slate-700 leading-relaxed" v-html="renderMarkdown(insightsText)"></div>
                    <div v-else class="text-sm text-slate-400 italic">
                      Select a student with quiz data to see AI-generated insights.
                    </div>
                  </div>
                </div>

                <!-- Send Guidance -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Send class="w-4 h-4" /> Send Guidance
                  </h4>
                  <textarea
                    v-model="guidanceMessage"
                    rows="3"
                    class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none text-slate-800 placeholder:text-slate-400"
                    placeholder="Write personalised study guidance for this student…"
                  ></textarea>
                  <div class="flex items-center justify-between mt-3">
                    <p class="text-[10px] text-slate-400">This will appear in the student's Messages inbox.</p>
                    <button
                      @click="sendGuidance"
                      :disabled="!guidanceMessage.trim() || guidanceSending"
                      class="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send class="w-3.5 h-3.5" />
                      {{ guidanceSending ? 'Sending…' : 'Send' }}
                    </button>
                  </div>
                  <div v-if="guidanceSuccess" class="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle class="w-3.5 h-3.5" /> Guidance sent successfully!
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>
      </template>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '@/api/client.js';
import { useAuthStore } from '@/stores/auth.js';
import {
  Award, FileText, CheckSquare, BookOpen, Users, Sparkles, Send,
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
} from 'lucide-vue-next';

const auth = useAuthStore();
const loading = ref(true);

// ── Student data ──────────────────────────────────────────────────────────────
const studentCourses = ref([]);

// ── Lecturer data ─────────────────────────────────────────────────────────────
const lecturerCourses = ref([]);
const activeCourseId = ref(null);
const progressLoading = ref(false);
const progressData = ref(null);
const selectedStudent = ref(null);

// Pagination state
const currentPage = ref(0);
const itemsPerPage = 10;

const totalPages = computed(() => Math.ceil(lecturerCourses.value.length / itemsPerPage));

const paginatedCourses = computed(() => {
  const start = currentPage.value * itemsPerPage;
  return lecturerCourses.value.slice(start, start + itemsPerPage);
});

function prevPage() {
  if (currentPage.value > 0) currentPage.value--;
}

function nextPage() {
  if (currentPage.value < totalPages.value - 1) currentPage.value++;
}

// AI insights
const insightsLoading = ref(false);
const insightsText = ref('');
const insightsError = ref('');

// Guidance
const guidanceMessage = ref('');
const guidanceSending = ref(false);
const guidanceSuccess = ref(false);

// ── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    if (auth.user?.role === 'student') {
      const data = await api.get('/api/users/grades');
      studentCourses.value = data.courses || [];
    } else {
      // Lecturer: load their courses
      const data = await api.get('/api/courses');
      const allCourses = data.courses || data || [];
      lecturerCourses.value = allCourses.filter(c =>
        c.lecturers?.some(l => {
          const lid = typeof l === 'object' ? l._id : l;
          return lid === auth.user?._id;
        })
      );
      if (lecturerCourses.value.length > 0) {
        selectCourse(lecturerCourses.value[0]._id);
      }
    }
  } catch (err) {
    console.error('Failed to load grades/progress:', err);
  } finally {
    loading.value = false;
  }
});

// ── Lecturer helpers ──────────────────────────────────────────────────────────
async function selectCourse(courseId) {
  activeCourseId.value = courseId;
  selectedStudent.value = null;
  insightsText.value = '';
  insightsError.value = '';
  progressLoading.value = true;
  try {
    progressData.value = await api.get(`/api/progress/${courseId}`);
  } catch (err) {
    console.error('Failed to load progress:', err);
    progressData.value = null;
  } finally {
    progressLoading.value = false;
  }
}

function selectStudent(s) {
  selectedStudent.value = s;
  guidanceMessage.value = '';
  guidanceSuccess.value = false;
  fetchInsights(s);
}

async function fetchInsights(student) {
  // Only fetch if the student has attempted at least one quiz or has grades
  const hasData = student.quizzes.some(q => q.attempted) || student.assignments.some(a => a.grade != null);
  if (!hasData) {
    insightsText.value = '';
    insightsError.value = '';
    return;
  }

  insightsLoading.value = true;
  insightsText.value = '';
  insightsError.value = '';
  try {
    const res = await api.post(`/api/progress/${activeCourseId.value}/insights`, {
      studentId: student.user._id,
      studentName: student.user.name,
      quizzes: student.quizzes,
      assignments: student.assignments,
    });
    insightsText.value = res.insights;
  } catch (err) {
    insightsError.value = err.message || 'Failed to generate insights. Please try again.';
  } finally {
    insightsLoading.value = false;
  }
}

async function sendGuidance() {
  if (!selectedStudent.value || !guidanceMessage.value.trim()) return;
  guidanceSending.value = true;
  guidanceSuccess.value = false;
  try {
    await api.post(`/api/progress/${activeCourseId.value}/guidance`, {
      studentId: selectedStudent.value.user._id,
      message: guidanceMessage.value.trim(),
    });
    guidanceSuccess.value = true;
    guidanceMessage.value = '';
    setTimeout(() => { guidanceSuccess.value = false; }, 4000);
  } catch (err) {
    console.error('Failed to send guidance:', err);
  } finally {
    guidanceSending.value = false;
  }
}

// ── Computed ──────────────────────────────────────────────────────────────────
const sortedStudents = computed(() => {
  if (!progressData.value?.students) return [];
  return [...progressData.value.students].sort((a, b) => {
    if (a.overallPercentage == null && b.overallPercentage == null) return 0;
    if (a.overallPercentage == null) return 1;
    if (b.overallPercentage == null) return -1;
    return a.overallPercentage - b.overallPercentage; // lowest first (at-risk at top)
  });
});

const classAverage = computed(() => {
  if (!progressData.value?.students?.length) return 0;
  const withScores = progressData.value.students.filter(s => s.overallPercentage != null);
  if (!withScores.length) return 0;
  const sum = withScores.reduce((acc, s) => acc + s.overallPercentage, 0);
  return Math.round(sum / withScores.length);
});

const atRiskCount = computed(() => {
  if (!progressData.value?.students) return 0;
  return progressData.value.students.filter(s => s.overallPercentage != null && s.overallPercentage < 50).length;
});

const topPerformers = computed(() => {
  if (!progressData.value?.students) return 0;
  return progressData.value.students.filter(s => s.overallPercentage != null && s.overallPercentage >= 80).length;
});

// ── Shared helpers ────────────────────────────────────────────────────────────
function getGradeColor(score, total) {
  if (total === 0) return 'text-slate-600 bg-slate-100';
  const percentage = score / total;
  if (percentage >= 0.7) return 'text-emerald-700 bg-emerald-100 border border-emerald-200';
  if (percentage >= 0.4) return 'text-amber-700 bg-amber-100 border border-amber-200';
  return 'text-rose-700 bg-rose-100 border border-rose-200';
}

function getPercentageBadge(pct) {
  if (pct == null) return 'text-slate-500 bg-slate-100';
  if (pct >= 80) return 'text-emerald-700 bg-emerald-100';
  if (pct >= 50) return 'text-amber-700 bg-amber-100';
  return 'text-rose-700 bg-rose-100';
}

function getPercentageTextColor(pct) {
  if (pct == null) return 'text-slate-400';
  if (pct >= 80) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-600';
  return 'text-rose-600';
}

function renderMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-xs font-bold mt-3 mb-1 text-slate-700">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-sm font-bold mt-3 mb-1 text-slate-800">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-sm font-bold mt-3 mb-1 text-slate-900">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-3 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-3 list-decimal text-sm">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
</script>
