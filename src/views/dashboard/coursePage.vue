<template>
  <main class="flex-1 bg-slate-50">

    <!-- Course Hero Banner -->
    <div v-if="course" :class="['relative overflow-hidden px-6 lg:px-10 pt-8 pb-8', course.color]">
      <div class="absolute inset-0 bg-linear-to-br from-black/20 to-black/50"></div>
      <div class="relative max-w-6xl mx-auto flex items-start justify-between gap-4">
        <div>
          <span class="inline-block text-xs font-bold text-white/70 uppercase tracking-widest mb-2">
            {{ course.dept }} &bull; {{ course.year }}
          </span>
          <h1 class="text-2xl lg:text-3xl font-extrabold text-white leading-snug">
            {{ course.code }}: {{ course.title }}
          </h1>
        </div>

        <!-- Unenroll button (only when enrolled) -->
        <button
          v-if="enrolled"
          class="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 mt-6 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/30 transition-colors backdrop-blur-sm"
          :disabled="enrolling"
          @click="handleUnenroll"
        >
          <UserMinus class="w-3.5 h-3.5" />
          {{ enrolling ? 'Unenrolling…' : 'Unenroll' }}
        </button>
      </div>
    </div>

    <!-- Not found -->
    <div v-else-if="!loading && course === null" class="flex flex-col items-center justify-center py-24 text-center">
      <p class="font-semibold text-slate-700">Course not found</p>
      <RouterLink to="/courses" class="mt-3 text-sm text-blue-600 hover:underline">← Back to catalogue</RouterLink>
    </div>

    <!-- Page body -->
    <div v-if="course" class="max-w-6xl mx-auto px-6 lg:px-10 py-8 flex flex-col gap-10">

      <!-- ── NOT LOGGED IN GATE ──────────────────────────────────── -->
      <div v-if="!auth.isLoggedIn" class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <LogIn class="w-7 h-7 text-slate-400" />
        </div>
        <h2 class="text-lg font-bold text-slate-900">Log in to access this course</h2>
        <p class="text-sm text-slate-500 mt-2 max-w-sm">
          You need to be logged in to view or enroll in
          <span class="font-semibold">{{ course.code }}: {{ course.title }}</span>.
        </p>
        <RouterLink
          :to="{ name: 'login', query: { redirect: '/courses/' + course.code } }"
          class="mt-6 flex items-center gap-2 px-6 py-3 bg-[#1e293b] hover:bg-slate-700 text-white font-bold rounded-xl transition-colors shadow-md"
        >
          <LogIn class="w-4 h-4" />
          Log in to continue
        </RouterLink>
      </div>

      <!-- ── NOT ENROLLED GATE (students only) ─────────────────────── -->
      <div
        v-else-if="!enrolled && auth.user?.role === 'student'"
        class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm"
      >
        <div :class="['w-16 h-16 rounded-2xl flex items-center justify-center mb-4', course.color]">
          <BookLock class="w-7 h-7 text-white" />
        </div>
        <h2 class="text-lg font-bold text-slate-900">You are not enrolled in this course</h2>
        <p class="text-sm text-slate-500 mt-2 max-w-sm">
          Enroll to access lecture slides, lab resources, assignments and more for
          <span class="font-semibold">{{ course.code }}: {{ course.title }}</span>.
        </p>
        <button
          class="mt-6 flex items-center gap-2 px-6 py-3 bg-[#1e293b] hover:bg-slate-700 text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-60"
          :disabled="enrolling"
          @click="handleEnroll"
        >
          <Loader2 v-if="enrolling" class="w-4 h-4 animate-spin" />
          <BookOpen v-else class="w-4 h-4" />
          {{ enrolling ? 'Enrolling…' : 'Enrol in this course' }}
        </button>
      </div>

      <!-- ── COURSE CONTENT (enrolled students + lecturers/admin) ─── -->
      <section v-else>

        <!-- Loading skeleton -->
        <div v-if="contentLoading" class="flex flex-col gap-4">
          <div v-for="i in 3" :key="i" class="bg-white rounded-2xl border border-slate-200 h-24 animate-pulse" />
        </div>

        <template v-else>
          <!-- Toolbar -->
          <div class="flex items-center justify-between mb-5">
            <p class="text-sm text-slate-500">
              {{ sections.length }} section{{ sections.length !== 1 ? 's' : '' }}
              &bull;
              {{ totalResources }} resource{{ totalResources !== 1 ? 's' : '' }}
            </p>
            <div class="flex items-center gap-3">
              <!-- Add section button (lecturer/admin only) -->
              <button
                v-if="canManage"
                class="flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 transition-colors"
                @click="showAddSection = true"
              >
                <Plus class="w-3.5 h-3.5" /> Add Section
              </button>
              <button
                class="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                @click="allExpanded = !allExpanded"
              >{{ allExpanded ? 'Collapse all' : 'Expand all' }}</button>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!sections.length" class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <FolderOpen class="w-10 h-10 text-slate-300 mb-3" />
            <p class="text-sm font-semibold text-slate-500">No content yet</p>
            <p v-if="canManage" class="text-xs text-slate-400 mt-1">Add a section to get started.</p>
          </div>

          <!-- Section cards grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
            <div
              v-for="sec in sections"
              :key="sec._id"
              class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <!-- Section header -->
              <button
                class="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                @click="toggleSection(sec._id)"
              >
                <div class="flex items-center gap-3">
                  <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', course.color]">
                    <component :is="sectionIcon(sec.type)" class="w-4 h-4 text-white" />
                  </div>
                  <div class="text-left">
                    <p class="text-sm font-bold text-slate-800">{{ sec.title }}</p>
                    <p class="text-[11px] text-slate-400">{{ sec.resources.length }} item{{ sec.resources.length !== 1 ? 's' : '' }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <!-- Add resource button (lecturer/admin only) -->
                  <span
                    v-if="canManage"
                    role="button"
                    tabindex="0"
                    class="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Add resource to this section"
                    @click.stop="openAddResource(sec)"
                    @keydown.enter.stop="openAddResource(sec)"
                  >
                    <PlusCircle class="w-4 h-4" />
                  </span>
                  <!-- Delete section button (lecturer/admin only) -->
                  <span
                    v-if="canManage"
                    role="button"
                    tabindex="0"
                    class="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete this section"
                    @click.stop="confirmDelete('section', sec)"
                    @keydown.enter.stop="confirmDelete('section', sec)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </span>
                  <ChevronDown
                    :class="['w-4 h-4 text-slate-400 transition-transform flex-shrink-0', (expandedSections[sec._id] ?? allExpanded) ? 'rotate-180' : '']"
                  />
                </div>
              </button>

              <!-- Resources list -->
              <div v-show="expandedSections[sec._id] ?? allExpanded" class="divide-y divide-slate-50">
                <div
                  v-for="res in sec.resources"
                  :key="res._id"
                  class="flex items-start gap-3 px-5 py-3 hover:bg-blue-50 group transition-colors"
                >
                  <!-- Clickable file/link area -->
                  <a
                    :href="res.fileUrl || res.externalUrl || '#'"
                    :target="res.fileUrl || res.externalUrl ? '_blank' : undefined"
                    rel="noopener noreferrer"
                    class="flex items-start gap-3 flex-1 min-w-0"
                    @click="res.fileUrl || res.externalUrl ? undefined : $event.preventDefault()"
                  >
                    <div :class="['w-7 h-7 mt-0.5 rounded-lg flex items-center justify-center flex-shrink-0', resourceIconBg(res.type)]">
                      <component :is="resourceIcon(res.type)" :class="['w-3.5 h-3.5', resourceIconColor(res.type)]" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm text-blue-600 group-hover:text-blue-800 group-hover:underline underline-offset-2 transition-colors leading-snug block truncate">
                        {{ res.title }}
                      </span>
                      <span class="text-[10px] text-slate-400 mt-0.5 block">
                        Uploaded {{ formatDate(res.createdAt) }}
                      </span>
                    </div>
                  </a>
                  <!-- Right-side icons -->
                  <div class="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <AlertCircle v-if="res.type === 'assignment'" class="w-3.5 h-3.5 text-amber-500" />
                    <ExternalLink v-else-if="res.externalUrl" class="w-3 h-3 text-slate-300" />
                    <!-- Delete resource (lecturer/admin, visible on hover) -->
                    <button
                      v-if="canManage"
                      class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                      title="Delete resource"
                      @click.prevent="confirmDelete('resource', res)"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p v-if="!sec.resources.length" class="px-5 py-4 text-sm text-slate-400 italic">No resources yet.</p>
              </div>
            </div>
          </div>
        </template>
      </section>
    </div>

    <!-- ── ADD SECTION MODAL ──────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showAddSection"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="showAddSection = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h3 class="font-bold text-slate-800 mb-4 text-base">Add Section</h3>
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Title</label>
              <input
                v-model="newSection.title"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="e.g. Week 1 – Introduction"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
              <select
                v-model="newSection.type"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="general">General</option>
                <option value="week">Week</option>
                <option value="module">Module</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-5">
            <button class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" @click="showAddSection = false">Cancel</button>
            <button
              class="px-4 py-2 text-sm font-bold bg-[#1e293b] text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60"
              :disabled="savingSection || !newSection.title.trim()"
              @click="saveSection"
            >
              {{ savingSection ? 'Saving…' : 'Add Section' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── ADD RESOURCE MODAL ─────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showAddResource"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="showAddResource = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <h3 class="font-bold text-slate-800 mb-1 text-base">Add Resource</h3>
          <p class="text-xs text-slate-400 mb-4">→ {{ activeSection?.title }}</p>
          <div class="flex flex-col gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Title</label>
              <input
                v-model="newResource.title"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="e.g. Lecture Slides Week 1"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-600 mb-1 block">Type</label>
              <select
                v-model="newResource.type"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="slides">Slides</option>
                <option value="lab">Lab</option>
                <option value="video">Video</option>
                <option value="reading">Reading</option>
                <option value="document">Document</option>
                <option value="link">Link</option>
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="announcement">Announcement</option>
                <option value="other">Other (code, data, etc.)</option>
              </select>
            </div>
            <div v-if="newResource.type === 'link'">
              <label class="text-xs font-semibold text-slate-600 mb-1 block">External URL</label>
              <input
                v-model="newResource.externalUrl"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="https://…"
              />
            </div>
            <div v-else>
              <label class="text-xs font-semibold text-slate-600 mb-1 block">File (optional)</label>
              <input
                type="file"
                class="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                @change="onFileChange($event)"
              />
              <p class="text-[10px] text-slate-400 mt-1">Any file type accepted &bull; max 50 MB</p>
              <p v-if="resourceUploadError" class="text-[11px] text-red-500 mt-1">{{ resourceUploadError }}</p>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-5">
            <button class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors" @click="showAddResource = false">Cancel</button>
            <button
              class="px-4 py-2 text-sm font-bold bg-[#1e293b] text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60"
              :disabled="savingResource || !newResource.title.trim() || !!resourceUploadError"
              @click="saveResource"
            >
              {{ savingResource ? 'Uploading…' : 'Add Resource' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── CONFIRM DELETE MODAL ──────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showConfirmDelete"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="showConfirmDelete = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <Trash2 class="w-4 h-4 text-red-500" />
            </div>
            <h3 class="font-bold text-slate-800 text-base">Confirm Delete</h3>
          </div>
          <p class="text-sm text-slate-600 mb-1">
            Are you sure you want to delete
            <span class="font-semibold">"{{ deleteTarget?.title }}"</span>?
          </p>
          <p v-if="deleteType === 'section'" class="text-xs text-red-500 mt-1">
            ⚠ This will also delete all resources inside this section.
          </p>
          <div class="flex justify-end gap-2 mt-5">
            <button
              class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              @click="showConfirmDelete = false"
            >Cancel</button>
            <button
              class="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60"
              :disabled="deleting"
              @click="executeDelete"
            >
              {{ deleting ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import {
  ChevronDown, BookOpen, Calendar, FileText,
  Link2, ClipboardList, Megaphone, AlertCircle,
  FlaskConical, Video, BookLock, UserMinus, Loader2, LogIn,
  Plus, PlusCircle, FolderOpen, ExternalLink, Trash2, Package,
} from 'lucide-vue-next';
import { api }                   from '@/api/client.js';
import { useEnrollmentStore }    from '@/stores/enrollments.js';
import { useAuthStore }          from '@/stores/auth.js';

const route           = useRoute();
const enrollmentStore = useEnrollmentStore();
const auth            = useAuthStore();

const code     = decodeURIComponent(route.params.code ?? '').toUpperCase();
const course   = ref(null);
const loading  = ref(true);
const enrolling = ref(false);

// ── Enrollment state ──────────────────────────────────────────────────────────
const enrolled = computed(() => enrollmentStore.isEnrolled(code));

// ── Access level ──────────────────────────────────────────────────────────────
const canManage = computed(() =>
  auth.isLoggedIn && ['lecturer', 'admin'].includes(auth.user?.role)
);

// ── Content is visible to enrolled students + any lecturer/admin ──────────────
const canViewContent = computed(() =>
  auth.isLoggedIn && (enrolled.value || canManage.value)
);

onMounted(async () => {
  // Fetch course details
  try {
    const data = await api.get(`/api/courses/${encodeURIComponent(code)}`);
    course.value = data.course;
  } catch {
    course.value = null;
  } finally {
    loading.value = false;
  }

  // Ensure enrollments are loaded
  if (auth.isLoggedIn && !enrollmentStore.enrollments.length) {
    await enrollmentStore.fetchEnrollments();
  }

  // Load sections + resources if user can view
  if (canViewContent.value) {
    await loadContent();
  }
});

async function handleEnroll() {
  enrolling.value = true;
  await enrollmentStore.enroll(code);
  enrolling.value = false;
  // Load content after enroll
  await loadContent();
}

async function handleUnenroll() {
  enrolling.value = true;
  const enrollment = enrollmentStore.enrollments.find(e => e.course?.code === code);
  if (enrollment) await enrollmentStore.unenroll(enrollment._id);
  enrolling.value = false;
}

// ── Sections from API ─────────────────────────────────────────────────────────
const sections        = ref([]);
const contentLoading  = ref(false);

async function loadContent() {
  contentLoading.value = true;
  try {
    const data = await api.get(`/api/content/${encodeURIComponent(code)}`);
    sections.value = data.sections ?? [];
  } catch {
    sections.value = [];
  } finally {
    contentLoading.value = false;
  }
}

const totalResources = computed(() => sections.value.reduce((n, s) => n + (s.resources?.length ?? 0), 0));

// ── Expand / collapse ─────────────────────────────────────────────────────────
const allExpanded      = ref(true);
const expandedSections = ref({});

function toggleSection(id) {
  expandedSections.value[id] = !(expandedSections.value[id] ?? allExpanded.value);
}

// ── Icon helpers ──────────────────────────────────────────────────────────────
function sectionIcon(type) {
  return { general: Megaphone, week: Calendar, module: FileText, announcement: Megaphone }[type] ?? Calendar;
}

const RESOURCE_META = {
  slides:       { bg: 'bg-indigo-50', color: 'text-indigo-500', icon: BookOpen },
  lab:          { bg: 'bg-rose-50',   color: 'text-rose-500',   icon: FlaskConical },
  video:        { bg: 'bg-purple-50', color: 'text-purple-500', icon: Video },
  reading:      { bg: 'bg-green-50',  color: 'text-green-500',  icon: Link2 },
  assignment:   { bg: 'bg-amber-50',  color: 'text-amber-500',  icon: ClipboardList },
  quiz:         { bg: 'bg-orange-50', color: 'text-orange-500', icon: ClipboardList },
  announcement: { bg: 'bg-blue-50',   color: 'text-blue-500',   icon: Megaphone },
  link:         { bg: 'bg-teal-50',   color: 'text-teal-500',   icon: Link2 },
  document:     { bg: 'bg-slate-100', color: 'text-slate-500',  icon: FileText },
  other:        { bg: 'bg-slate-100', color: 'text-slate-500',  icon: Package },
};

function resourceIcon(type)      { return (RESOURCE_META[type] ?? RESOURCE_META.document).icon; }
function resourceIconBg(type)    { return (RESOURCE_META[type] ?? RESOURCE_META.document).bg; }
function resourceIconColor(type) { return (RESOURCE_META[type] ?? RESOURCE_META.document).color; }

// ── Date formatter ────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Add Section modal ─────────────────────────────────────────────────────────
const showAddSection = ref(false);
const savingSection  = ref(false);
const newSection     = ref({ title: '', type: 'week' });

async function saveSection() {
  if (!newSection.value.title.trim()) return;
  savingSection.value = true;
  try {
    await api.post(`/api/content/${encodeURIComponent(code)}/sections`, {
      title: newSection.value.title.trim(),
      type:  newSection.value.type,
    });
    showAddSection.value = false;
    newSection.value = { title: '', type: 'week' };
    await loadContent();
  } catch (e) {
    console.error('Add section failed:', e);
  } finally {
    savingSection.value = false;
  }
}

// ── Add Resource modal ────────────────────────────────────────────────────────
const showAddResource = ref(false);
const savingResource  = ref(false);
const activeSection   = ref(null);
const newResource     = ref({ title: '', type: 'slides', externalUrl: '', file: null });
const resourceUploadError = ref('');

function openAddResource(sec) {
  activeSection.value  = sec;
  newResource.value    = { title: '', type: 'slides', externalUrl: '', file: null };
  resourceUploadError.value = '';
  showAddResource.value = true;
}

// Client-side file validation
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB
function onFileChange(e) {
  const file = e.target.files[0] || null;
  resourceUploadError.value = '';
  if (file && file.size > MAX_SIZE) {
    resourceUploadError.value = `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 50 MB.`;
    newResource.value.file = null;
    e.target.value = '';
    return;
  }
  newResource.value.file = file;
}

async function saveResource() {
  if (!newResource.value.title.trim() || !activeSection.value) return;
  savingResource.value = true;
  try {
    const fd = new FormData();
    fd.append('title', newResource.value.title.trim());
    fd.append('type',  newResource.value.type);
    if (newResource.value.externalUrl) fd.append('externalUrl', newResource.value.externalUrl);
    if (newResource.value.file)        fd.append('file', newResource.value.file);

    await api.postForm(`/api/content/sections/${activeSection.value._id}/resources`, fd);
    showAddResource.value = false;
    await loadContent();
  } catch (e) {
    console.error('Add resource failed:', e);
  } finally {
    savingResource.value = false;
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const showConfirmDelete = ref(false);
const deleting          = ref(false);
const deleteType        = ref('');   // 'section' | 'resource'
const deleteTarget      = ref(null); // the section or resource object

function confirmDelete(type, item) {
  deleteType.value   = type;
  deleteTarget.value = item;
  showConfirmDelete.value = true;
}

async function executeDelete() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    if (deleteType.value === 'section') {
      await api.delete(`/api/content/sections/${deleteTarget.value._id}`);
    } else {
      await api.delete(`/api/content/resources/${deleteTarget.value._id}`);
    }
    showConfirmDelete.value = false;
    deleteTarget.value = null;
    await loadContent();
  } catch (e) {
    console.error('Delete failed:', e);
  } finally {
    deleting.value = false;
  }
}
</script>
