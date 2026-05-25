<template>
  <main class="flex-1 bg-slate-50 min-h-screen">
    <!-- Loading Screen -->
    <div v-if="loading" class="flex flex-col items-center justify-center min-h-[75vh]">
      <div class="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mb-4" />
      <p class="text-sm font-semibold text-slate-600">Loading quiz details…</p>
    </div>

    <!-- Main Content -->
    <div v-else-if="quiz" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- HEADER -->
      <div class="mb-6 flex items-center justify-between">
        <button @click="$router.back()" class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer">
          <ArrowLeft class="w-3.5 h-3.5" /> Back
        </button>
        <span v-if="state === 'active'" class="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold shadow-xs">
          <Timer class="w-4 h-4 text-indigo-500 animate-pulse" />
          {{ formatTime(timeRemaining) }}
        </span>
      </div>

      <!-- STATE 1: INTRODUCTION -->
      <div v-if="state === 'intro'" class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white relative">
          <div class="absolute -right-16 -top-16 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div class="relative flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <BookOpen class="w-6 h-6 text-white" />
            </div>
            <div>
              <span class="text-xs font-bold text-indigo-100 uppercase tracking-wider block mb-1">
                {{ quiz.courseId?.code }} &bull; {{ quiz.questions?.length }} Questions
              </span>
              <h1 class="text-2xl font-extrabold leading-tight">{{ quiz.title }}</h1>
              <p class="text-indigo-100 text-xs mt-2 max-w-xl leading-relaxed">{{ quiz.description || 'No description provided.' }}</p>
            </div>
          </div>
        </div>

        <div class="p-8">
          <h2 class="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Quiz Information</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Timer class="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p class="text-xs text-slate-400 font-medium">Duration</p>
                <p class="text-sm font-bold text-slate-800">{{ quiz.durationMinutes || 20 }} Minutes</p>
              </div>
            </div>
            <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Award class="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p class="text-xs text-slate-400 font-medium">Total Marks / Points</p>
                <p class="text-sm font-bold text-slate-800">{{ totalPointsQuiz }} Points</p>
              </div>
            </div>
          </div>

          <div v-if="attempt" class="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <CheckCircle2 class="w-6 h-6 text-indigo-600" />
              <div>
                <p class="text-sm font-bold text-slate-800">You've completed this quiz</p>
                <p class="text-xs text-slate-500">Attempted on {{ new Date(attempt.createdAt).toLocaleDateString() }}</p>
              </div>
            </div>
            <button @click="showResults" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer">
              View Results
            </button>
          </div>

          <div v-else class="flex justify-end">
            <button @click="startQuiz" class="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer hover:-translate-y-0.5">
              Start Quiz <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- STATE 2: ACTIVE QUIZ -->
      <div v-else-if="state === 'active'" class="space-y-6">
        <div v-for="(q, index) in quiz.questions" :key="index" class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div class="flex items-start justify-between gap-4 mb-4">
            <span class="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-extrabold text-slate-500">
              Question {{ index + 1 }}
            </span>
            <span class="text-xs font-bold text-slate-400">
              {{ q.points || 5 }} points
            </span>
          </div>

          <h3 class="text-base font-bold text-slate-800 mb-4 leading-relaxed">{{ q.text }}</h3>

          <!-- MCQ / True-False Choices -->
          <div v-if="q.type === 'mcq' || q.type === 'true_false'" class="grid grid-cols-1 gap-3">
            <button
              v-for="choice in q.options" :key="choice"
              @click="selectAnswer(index, choice)"
              :class="[
                'w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-between cursor-pointer',
                answers[index] === choice
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/10'
              ]"
            >
              <span>{{ choice }}</span>
              <span v-if="answers[index] === choice" class="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Check class="w-3 h-3 text-white" />
              </span>
            </button>
          </div>

          <!-- Short Answer Text Area -->
          <div v-else-if="q.type === 'short_answer'" class="mt-3">
            <textarea
              v-model="answers[index]"
              rows="4"
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none shadow-xs"
              placeholder="Type your answer here..."
            />
            <p class="text-[10px] text-slate-400 mt-1.5">Note: Your answer will be evaluated by Gemini AI upon submission.</p>
          </div>
        </div>

        <!-- Sticky Bottom Bar -->
        <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-md">
          <span class="text-xs text-slate-500 font-medium">
            {{ Object.keys(answers).length }} of {{ quiz.questions.length }} answered
          </span>
          <button @click="submitQuizPrompt" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer">
            Submit Quiz
          </button>
        </div>
      </div>

      <!-- STATE 3: GRADING SCREEN (DURING SUBMISSION) -->
      <div v-else-if="state === 'grading'" class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div class="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 relative">
          <Sparkles class="w-8 h-8 text-indigo-600 animate-pulse" />
          <span class="absolute top-0 right-0 w-3 h-3 bg-pink-500 rounded-full animate-ping"></span>
        </div>
        <h2 class="text-lg font-bold text-slate-900 mb-1">Gemini AI is Grading your Quiz</h2>
        <p class="text-sm text-slate-500 max-w-sm">Please wait while our AI evaluates your written short-answers and computes your score...</p>
        <div class="w-48 h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse rounded-full"></div>
        </div>
      </div>

      <!-- STATE 4: RESULTS VIEW -->
      <div v-else-if="state === 'results' && attempt" class="space-y-6">
        
        <!-- Score Overview Card -->
        <div class="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div class="absolute -right-20 -bottom-20 w-48 h-48 bg-slate-50 rounded-full blur-xl -z-1"></div>
          
          <div class="text-center md:text-left">
            <span class="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold rounded-full">
              Quiz Completed
            </span>
            <h2 class="text-xl font-bold text-slate-800 mt-3">{{ quiz.title }}</h2>
            <p class="text-xs text-slate-400 mt-1">Submitted on {{ new Date(attempt.createdAt).toLocaleDateString() }}</p>
          </div>

          <div class="flex items-center gap-4 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl">
            <div class="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Award class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Score</p>
              <p class="text-2xl font-black text-slate-800">
                {{ attempt.score }} <span class="text-sm text-slate-400 font-bold">/ {{ attempt.totalPoints }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Question Breakdown -->
        <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Question Breakdown</h3>
        
        <div v-for="(q, index) in quiz.questions" :key="index" class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs relative">
          
          <!-- Answered/Correct State Badge -->
          <div class="flex items-start justify-between gap-4 mb-4">
            <span class="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-extrabold text-slate-500">
              Question {{ index + 1 }}
            </span>
            
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-500">
                Points: {{ getEarnedPoints(index) }} / {{ q.points || (q.type === 'short_answer' ? 10 : 5) }}
              </span>
              <span v-if="getIsCorrect(index)" class="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 class="w-3.5 h-3.5" /> Correct
              </span>
              <span v-else-if="q.type === 'mcq' || q.type === 'true_false'" class="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                <XCircle class="w-3.5 h-3.5" /> Incorrect
              </span>
              <span v-else class="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                <AlertCircle class="w-3.5 h-3.5" /> Reviewed
              </span>
            </div>
          </div>

          <h4 class="text-sm font-bold text-slate-800 mb-4 leading-relaxed">{{ q.text }}</h4>

          <!-- User's Answer vs Correct Answer -->
          <div class="space-y-3">
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Answer</p>
              <p class="text-xs font-medium text-slate-700 mt-1 whitespace-pre-wrap">
                {{ getStudentAnswer(index) || '(No Answer)' }}
              </p>
            </div>

            <!-- MCQ Mode: display choices and highlight correct vs selected -->
            <div v-if="q.type === 'mcq' || q.type === 'true_false'" class="grid grid-cols-1 gap-2 mt-2">
              <div
                v-for="choice in q.options" :key="choice"
                :class="[
                  'text-xs px-3 py-2.5 rounded-xl border font-medium flex items-center justify-between',
                  choice === q.correctAnswer
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                    : choice === getStudentAnswer(index)
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-white border-slate-200 text-slate-500'
                ]"
              >
                <span>{{ choice }}</span>
                <span v-if="choice === q.correctAnswer" class="text-[10px] font-extrabold uppercase text-emerald-600">Correct Answer</span>
                <span v-else-if="choice === getStudentAnswer(index)" class="text-[10px] font-extrabold uppercase text-rose-600">Your Selection</span>
              </div>
            </div>

            <!-- Short Answer Mode: Model Answer & AI Feedback -->
            <template v-else-if="q.type === 'short_answer'">
              <div v-if="q.correctAnswer" class="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/50">
                <p class="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Model Answer / Criteria</p>
                <p class="text-xs font-medium text-slate-700 mt-1 whitespace-pre-wrap">
                  {{ q.correctAnswer }}
                </p>
              </div>

              <!-- AI Feedback Card -->
              <div v-if="getFeedback(index)" class="p-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-2xl border border-purple-100 flex items-start gap-3 mt-3">
                <Sparkles class="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-[10px] text-indigo-500 font-black uppercase tracking-wider">AI Evaluation & Critique</p>
                  <p class="text-xs text-slate-600 font-medium leading-relaxed mt-1 whitespace-pre-wrap">{{ getFeedback(index) }}</p>
                </div>
              </div>
            </template>
          </div>

          <div v-if="q.explanation" class="mt-4 text-[11px] text-slate-400 italic">
            <strong>Explanation:</strong> {{ q.explanation }}
          </div>
        </div>

        <div class="flex justify-end py-4">
          <button @click="$router.push(`/courses/${quiz.courseId?.code || ''}`)" class="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer">
            Return to Course
          </button>
        </div>
      </div>
      
    </div>

    <!-- Quiz not found -->
    <div v-else class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 class="text-lg font-bold text-slate-900 mb-1">Quiz Not Found</h2>
      <p class="text-sm text-slate-500 mb-4">The requested quiz may have been removed or is unavailable.</p>
      <button @click="$router.back()" class="px-5 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer">Go Back</button>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  Timer, Award, BookOpen, ChevronRight, AlertCircle,
  CheckCircle2, XCircle, ArrowLeft, Sparkles, Check
} from 'lucide-vue-next';
import { api } from '@/api/client.js';

const route = useRoute();
const quizId = computed(() => route.params.quizId);

const loading = ref(true);
const quiz = ref(null);
const attempt = ref(null);

const state = ref('intro'); // 'intro' | 'active' | 'grading' | 'results'
const answers = ref({}); // questionIndex -> answer
const timeRemaining = ref(0);
let timerInterval = null;

// Total points possible computed locally
const totalPointsQuiz = computed(() => {
  if (!quiz.value) return 0;
  return quiz.value.questions?.reduce((s, q) => s + (q.points || (q.type === 'short_answer' ? 10 : 5)), 0) || 0;
});

onMounted(async () => {
  try {
    const data = await api.get(`/api/quizzes/${quizId.value}`);
    quiz.value = data.quiz;
    attempt.value = data.attempt || null;
    if (attempt.value) {
      state.value = 'results';
    }
  } catch (err) {
    console.error('Failed to load quiz:', err);
  } finally {
    loading.value = false;
  }
});

function startQuiz() {
  state.value = 'active';
  const minutes = quiz.value?.durationMinutes || 20;
  timeRemaining.value = minutes * 60;
  
  timerInterval = setInterval(() => {
    if (timeRemaining.value <= 0) {
      clearInterval(timerInterval);
      submitQuiz(true); // force submit
    } else {
      timeRemaining.value--;
    }
  }, 1000);
}

function selectAnswer(qIndex, choice) {
  answers.value[qIndex] = choice;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function submitQuizPrompt() {
  if (confirm('Are you sure you want to submit this quiz?')) {
    submitQuiz(false);
  }
}

async function submitQuiz(isTimeout = false) {
  clearInterval(timerInterval);
  state.value = 'grading';

  const answersPayload = quiz.value.questions.map((q, index) => ({
    questionIndex: index,
    answer: answers.value[index] || ''
  }));

  try {
    const res = await api.post('/api/quizzes/attempts', {
      quizId: quiz.value._id,
      answers: answersPayload
    });
    attempt.value = res.attempt;
    state.value = 'results';
  } catch (err) {
    console.error('Failed to submit quiz attempt:', err);
    alert(err.message || 'Failed to submit quiz. Please try again.');
    state.value = 'active';
    startQuiz(); // restart timer
  }
}

function showResults() {
  state.value = 'results';
}

// Result getters
function getStudentAnswer(index) {
  if (!attempt.value) return '';
  const ansObj = attempt.value.answers?.find(a => a.questionIndex === index);
  return ansObj?.answer || '';
}

function getEarnedPoints(index) {
  if (!attempt.value) return 0;
  const ansObj = attempt.value.answers?.find(a => a.questionIndex === index);
  return ansObj ? ansObj.pointsEarned : 0;
}

function getIsCorrect(index) {
  if (!attempt.value) return false;
  const ansObj = attempt.value.answers?.find(a => a.questionIndex === index);
  return ansObj ? ansObj.isCorrect : false;
}

function getFeedback(index) {
  if (!attempt.value) return '';
  const ansObj = attempt.value.answers?.find(a => a.questionIndex === index);
  return ansObj?.feedback || '';
}
</script>
