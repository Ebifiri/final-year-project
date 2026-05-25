<template>
  <main class="flex-1 bg-slate-50 min-h-screen">

    <!-- Loading Skeleton -->
    <div v-if="loading" class="w-full animate-pulse">
      <!-- Skeleton Hero Banner -->
      <div class="bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 text-white px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-6 sm:pb-8">
        <div class="max-w-4xl mx-auto">
          <div class="w-10 h-4 bg-slate-400/60 rounded mb-3"></div>
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-400/60 flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-6 bg-slate-400/60 rounded w-1/2"></div>
              <div class="h-4 bg-slate-400/40 rounded w-3/4"></div>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 mt-4">
            <div class="w-20 h-6 bg-slate-400/50 rounded-full"></div>
            <div class="w-32 h-6 bg-slate-400/50 rounded-full"></div>
            <div class="w-24 h-6 bg-slate-400/50 rounded-full"></div>
          </div>
        </div>
      </div>
      <!-- Skeleton Main Content -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div class="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-16 sm:p-24 flex flex-col items-center justify-center text-center">
          <div class="w-16 h-16 rounded-2xl bg-slate-200 mb-4"></div>
          <div class="w-48 h-4 bg-slate-200 rounded mb-2"></div>
          <div class="w-32 h-3 bg-slate-200 rounded mb-4"></div>
          <div class="w-36 h-10 bg-slate-300 rounded-xl"></div>
        </div>
      </div>
    </div>

    <!-- Assignment not found -->
    <div v-else-if="!assignment" class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <FileX class="w-8 h-8 text-slate-400" />
      </div>
      <h2 class="text-lg font-bold text-slate-900 mb-1">Assignment Not Found</h2>
      <p class="text-sm text-slate-500 mb-4">This assignment may have been removed.</p>
      <RouterLink to="/dashboard/home" class="text-sm text-blue-600 hover:underline">← Back to Dashboard</RouterLink>
    </div>

    <template v-else>
      <!-- Hero Banner -->
      <div class="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-6 sm:pb-8">
        <div class="absolute inset-0 bg-linear-to-br from-black/10 to-black/30"></div>
        <div class="relative max-w-4xl mx-auto">
          <button @click="$router.back()" class="flex items-center gap-1 text-white/70 hover:text-white text-xs font-medium mb-3 transition-colors">
            <ArrowLeft class="w-3.5 h-3.5" /> Back
          </button>
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <FileUp class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-xl sm:text-2xl font-extrabold leading-snug">{{ assignment.title }}</h1>
              <p v-if="assignment.description" class="text-amber-100 text-sm mt-1 max-w-xl">{{ assignment.description }}</p>
            </div>
          </div>

          <!-- Meta chips -->
          <div class="flex flex-wrap gap-2 mt-4">
            <span v-if="assignment.totalPoints" class="flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-xs font-medium text-white backdrop-blur-sm">
              <Award class="w-3.5 h-3.5" /> {{ assignment.totalPoints }} points
            </span>
            <span v-if="assignment.opensAt" class="flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-xs font-medium text-white backdrop-blur-sm">
              <Clock class="w-3.5 h-3.5" /> Opens: {{ formatDate(assignment.opensAt) }}
            </span>
            <span v-if="assignment.closesAt || assignment.dueDate" class="flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 text-xs font-medium text-white backdrop-blur-sm">
              <Clock class="w-3.5 h-3.5" /> Closes: {{ formatDate(assignment.closesAt || assignment.dueDate) }}
            </span>
            <span :class="['flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm', statusClass]">
              <component :is="statusIcon" class="w-3.5 h-3.5" />
              {{ statusLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">

        <!-- Portal Closed Banner -->
        <div v-if="portalStatus === 'not-open'" class="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
          <Clock class="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p class="text-sm font-semibold text-amber-800">Submissions not open yet</p>
            <p class="text-xs text-amber-600 mt-0.5">Opens {{ formatDate(assignment.opensAt) }}</p>
          </div>
        </div>
        <div v-else-if="portalStatus === 'closed'" class="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
          <XCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p class="text-sm font-semibold text-red-800">Submissions are closed</p>
            <p class="text-xs text-red-600 mt-0.5">Closed {{ formatDate(assignment.closesAt) }}</p>
          </div>
        </div>

        <!-- Student View -->
        <template v-if="!isLecturer">
          <!-- Previous Submission -->
          <div v-if="existingSubmission" class="mb-6 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle class="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p class="text-sm font-bold text-slate-800">You've already submitted</p>
                <p class="text-xs text-slate-500">{{ formatDate(existingSubmission.createdAt) }}</p>
              </div>
              <span v-if="existingSubmission.grade != null" class="ml-auto text-sm font-bold text-green-600">
                {{ existingSubmission.grade }}/{{ assignment.totalPoints }}
              </span>
            </div>
            <div class="space-y-1.5">
              <div v-for="f in existingSubmission.files" :key="f.url" class="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                <FileText class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span class="truncate">{{ f.name }}</span>
                <span class="text-slate-400 ml-auto flex-shrink-0">{{ formatSize(f.size) }}</span>
              </div>
            </div>
            <p v-if="existingSubmission.feedback" class="mt-3 text-xs text-slate-600 bg-blue-50 px-3 py-2 rounded-lg">
              <strong>Feedback:</strong> {{ existingSubmission.feedback }}
            </p>
          </div>

          <!-- Drop zone -->
          <div
            v-if="portalStatus === 'open'"
            :class="[
              'relative rounded-2xl border-2 border-dashed transition-all duration-300',
              isDragOver
                ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                : 'border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50/30'
            ]"
            @dragenter.prevent="isDragOver = true"
            @dragover.prevent="isDragOver = true"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="handleDrop"
          >
            <div class="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center">
              <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors', isDragOver ? 'bg-blue-100' : 'bg-slate-100']">
                <Upload :class="['w-8 h-8 transition-colors', isDragOver ? 'text-blue-500' : 'text-slate-400']" />
              </div>
              <h3 class="text-lg font-bold text-slate-800 mb-1">
                {{ isDragOver ? 'Drop files here' : 'Drag & drop your files' }}
              </h3>
              <p class="text-sm text-slate-500 mb-4">or click to browse</p>
              <button
                class="px-5 py-2.5 bg-[#1e293b] hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md cursor-pointer"
                @click="$refs.fileInput.click()"
              >
                Browse Files
              </button>
              <input
                ref="fileInput"
                type="file"
                multiple
                class="hidden"
                @change="handleFileSelect"
              />
              <p class="text-xs text-slate-400 mt-3">Any file type • Max 50 MB per file</p>
            </div>
          </div>

          <!-- Selected files -->
          <div v-if="selectedFiles.length" class="mt-5 space-y-2">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {{ selectedFiles.length }} file{{ selectedFiles.length !== 1 ? 's' : '' }} selected
            </p>
            <div
              v-for="(file, i) in selectedFiles"
              :key="i"
              class="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-sm group"
            >
              <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText class="w-4 h-4 text-blue-600" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-800 truncate">{{ file.name }}</p>
                <p class="text-xs text-slate-400">{{ formatSize(file.size) }}</p>
              </div>
              <button
                class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                title="Remove"
                @click="removeFile(i)"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Submit button -->
          <div v-if="selectedFiles.length && portalStatus === 'open'" class="mt-6 flex items-center gap-3">
            <button
              class="flex items-center gap-2 px-6 py-3 bg-[#1e293b] hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              :disabled="submitting"
              @click="submitAssignment"
            >
              <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
              <Send v-else class="w-4 h-4" />
              {{ submitting ? 'Submitting…' : 'Submit Assignment' }}
            </button>
            <button
              class="px-4 py-3 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              @click="selectedFiles = []"
            >
              Clear all
            </button>
          </div>

          <!-- Submit success -->
          <div v-if="submitSuccess" class="mt-6 p-4 rounded-2xl bg-green-50 border border-green-200 flex items-center gap-3">
            <CheckCircle class="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p class="text-sm font-semibold text-green-800">Assignment submitted successfully!</p>
              <p class="text-xs text-green-600 mt-0.5">Your files have been uploaded.</p>
            </div>
          </div>

          <!-- Submit error -->
          <div v-if="submitError" class="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3">
            <XCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
            <p class="text-sm text-red-700">{{ submitError }}</p>
          </div>
        </template>

        <!-- Lecturer View -->
        <template v-else>
          <div class="mt-2">
            <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Submissions Dashboard</h2>

            <!-- Loading spinner -->
            <div v-if="submissionsLoading" class="flex items-center justify-center py-12">
              <Loader2 class="w-8 h-8 text-indigo-600 animate-spin" />
            </div>

            <!-- Empty State -->
            <div v-else-if="!submissions.length" class="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <FileText class="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p class="text-sm font-bold text-slate-700">No submissions yet</p>
              <p class="text-xs text-slate-400 mt-1">Students have not uploaded any files for this assignment.</p>
            </div>

            <!-- Grid Layout -->
            <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              
              <!-- Left Column: Student List -->
              <div class="md:col-span-1 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                <button
                  v-for="sub in submissions" :key="sub._id"
                  @click="selectSubmission(sub)"
                  :class="[
                    'w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer shadow-xs',
                    selectedSubmission?._id === sub._id
                      ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/10 text-slate-700'
                  ]"
                >
                  <div class="flex items-start justify-between gap-2 w-full">
                    <p class="text-xs font-bold truncate leading-tight">{{ sub.studentId?.name }}</p>
                    <span v-if="sub.grade != null" class="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex-shrink-0">
                      {{ sub.grade }} marks
                    </span>
                    <span v-else class="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex-shrink-0">
                      Pending
                    </span>
                  </div>
                  <p class="text-[10px] text-slate-400 truncate">{{ sub.studentId?.email }}</p>
                  <p class="text-[9px] text-slate-400 mt-1 font-medium">Submitted {{ formatDate(sub.createdAt) }}</p>
                </button>
              </div>

              <!-- Right Column: Submission Details & Grading Form -->
              <div class="md:col-span-2">
                <div v-if="selectedSubmission" class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                  
                  <!-- Student Info Header -->
                  <div class="border-b border-slate-100 pb-4">
                    <h3 class="text-base font-bold text-slate-800">{{ selectedSubmission.studentId?.name }}</h3>
                    <p class="text-xs text-slate-500 mt-0.5">{{ selectedSubmission.studentId?.email }}</p>
                    <p class="text-[10px] text-slate-400 mt-2">Submitted on {{ formatDate(selectedSubmission.createdAt) }}</p>
                  </div>

                  <!-- Submitted Files List -->
                  <div>
                    <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Submitted Files</h4>
                    <div class="space-y-2">
                      <a
                        v-for="file in selectedSubmission.files" :key="file.url"
                        :href="file.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-200 transition-all group"
                      >
                        <FileText class="w-5 h-5 text-indigo-500" />
                        <div class="flex-1 min-w-0">
                          <p class="text-xs font-semibold text-slate-700 group-hover:text-indigo-600 truncate">{{ file.name }}</p>
                          <p class="text-[10px] text-slate-400 mt-0.5">{{ formatSize(file.size) }}</p>
                        </div>
                        <span class="text-[10px] text-indigo-500 font-bold group-hover:underline">Download</span>
                      </a>
                    </div>
                  </div>

                  <!-- Grading Form -->
                  <div class="border-t border-slate-100 pt-5 space-y-4">
                    <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Evaluation & Grading</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                      <div class="sm:col-span-1">
                        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Grade Score</label>
                        <div class="relative">
                          <input
                            v-model.number="gradeInput"
                            type="number"
                            min="0"
                            :max="assignment.totalPoints || 100"
                            class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                            placeholder="Score"
                          />
                          <span class="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">/ {{ assignment.totalPoints || 100 }}</span>
                        </div>
                      </div>
                      <div class="sm:col-span-2">
                        <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Feedback / Critique</label>
                        <textarea
                          v-model="feedbackInput"
                          rows="4"
                          class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all resize-none"
                          placeholder="Provide constructive feedback to the student..."
                        />
                      </div>
                    </div>
                    <div class="flex justify-end pt-2">
                      <button
                        @click="submitGrade"
                        class="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer"
                        :disabled="grading"
                      >
                        <Loader2 v-if="grading" class="w-3.5 h-3.5 animate-spin" />
                        Save Grade & Feedback
                      </button>
                    </div>
                  </div>

                </div>
                <div v-else class="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400 shadow-xs">
                  <UserCheck class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p class="text-xs font-semibold">Select a student submission from the list to review and grade.</p>
                </div>
              </div>

            </div>
          </div>
        </template>
      </div>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import {
  FileUp, FileText, FileX, ArrowLeft, Upload, X, Send,
  Loader2, Clock, Award, CheckCircle, XCircle, UserCheck
} from 'lucide-vue-next';
import { api } from '@/api/client.js';
import { useAuthStore } from '@/stores/auth.js';

const route = useRoute();
const assignmentId = computed(() => route.params.assignmentId);

const auth = useAuthStore();
const isLecturer = computed(() => ['lecturer', 'admin'].includes(auth.user?.role));

const loading = ref(true);
const assignment = ref(null);
const existingSubmission = ref(null);
const selectedFiles = ref([]);
const isDragOver = ref(false);
const submitting = ref(false);
const submitSuccess = ref(false);
const submitError = ref('');

const submissions = ref([]);
const selectedSubmission = ref(null);
const grading = ref(false);
const gradeInput = ref('');
const feedbackInput = ref('');
const submissionsLoading = ref(false);

// ── Load assignment + submissions ────────────────────────────────────
onMounted(async () => {
  try {
    const data = await api.get(`/api/assignments/${assignmentId.value}`);
    assignment.value = data.assignment;
    
    if (isLecturer.value) {
      await fetchSubmissions();
    } else {
      existingSubmission.value = data.submission || null;
    }
  } catch (err) {
    console.error('Failed to load assignment:', err);
  } finally {
    loading.value = false;
  }
});

async function fetchSubmissions() {
  submissionsLoading.value = true;
  try {
    const res = await api.get(`/api/assignments/${assignmentId.value}/submissions`);
    submissions.value = res.submissions || [];
  } catch (err) {
    console.error('Failed to load submissions:', err);
  } finally {
    submissionsLoading.value = false;
  }
}

function selectSubmission(sub) {
  selectedSubmission.value = sub;
  gradeInput.value = sub.grade != null ? sub.grade : '';
  feedbackInput.value = sub.feedback || '';
}

async function submitGrade() {
  if (!selectedSubmission.value) return;
  grading.value = true;
  try {
    const res = await api.patch(`/api/assignments/${assignmentId.value}/submissions/${selectedSubmission.value._id}`, {
      grade: Number(gradeInput.value),
      feedback: feedbackInput.value
    });
    // Update local submissions list
    const idx = submissions.value.findIndex(s => s._id === selectedSubmission.value._id);
    if (idx !== -1) {
      submissions.value[idx] = { ...submissions.value[idx], ...res.submission };
    }
    selectedSubmission.value = { ...selectedSubmission.value, ...res.submission };
    alert('Grade submitted successfully!');
  } catch (err) {
    alert(err.message || 'Failed to submit grade.');
  } finally {
    grading.value = false;
  }
}

// ── Portal status ────────────────────────────────────────────────────────────
const portalStatus = computed(() => {
  if (!assignment.value) return 'closed';
  const now = new Date();
  if (assignment.value.opensAt && now < new Date(assignment.value.opensAt)) return 'not-open';
  if (assignment.value.closesAt && now > new Date(assignment.value.closesAt)) return 'closed';
  return 'open';
});

const statusLabel = computed(() => {
  if (portalStatus.value === 'not-open') return 'Not Open Yet';
  if (portalStatus.value === 'closed') return 'Closed';
  return 'Open for Submissions';
});
const statusClass = computed(() => {
  if (portalStatus.value === 'open') return 'bg-green-500/20 text-green-100';
  if (portalStatus.value === 'not-open') return 'bg-amber-500/20 text-amber-100';
  return 'bg-red-500/20 text-red-100';
});
const statusIcon = computed(() => {
  if (portalStatus.value === 'open') return CheckCircle;
  if (portalStatus.value === 'not-open') return Clock;
  return XCircle;
});

// ── File handling ────────────────────────────────────────────────────────────
function handleDrop(e) {
  isDragOver.value = false;
  const files = Array.from(e.dataTransfer.files);
  addFiles(files);
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files);
  addFiles(files);
  e.target.value = ''; // reset input
}

function addFiles(files) {
  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
  for (const f of files) {
    if (f.size > MAX_SIZE) {
      submitError.value = `"${f.name}" exceeds the 50 MB limit.`;
      continue;
    }
    // Avoid duplicates by name
    if (!selectedFiles.value.find(s => s.name === f.name && s.size === f.size)) {
      selectedFiles.value.push(f);
    }
  }
}

function removeFile(index) {
  selectedFiles.value.splice(index, 1);
}

// ── Submit ───────────────────────────────────────────────────────────────────
async function submitAssignment() {
  submitting.value = true;
  submitError.value = '';
  submitSuccess.value = false;

  try {
    const fd = new FormData();
    fd.append('assignmentId', assignmentId.value);
    for (const f of selectedFiles.value) {
      fd.append('files', f);
    }

    const data = await api.postForm('/api/submissions', fd);
    existingSubmission.value = data.submission;
    selectedFiles.value = [];
    submitSuccess.value = true;
  } catch (err) {
    submitError.value = err.message || 'Failed to submit assignment.';
  } finally {
    submitting.value = false;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
</script>
