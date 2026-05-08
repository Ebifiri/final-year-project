<template>
  <div class="flex-1 overflow-y-auto bg-slate-50">

    <!-- Page header -->
    <div class="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white px-6 py-10">
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold">AI Study Assistant</h1>
            <p class="text-violet-200 text-sm">Powered by Google Gemini Flash</p>
          </div>
        </div>
        <p class="text-violet-100 text-sm max-w-xl mt-2">
          Analyse your course materials or ask the AI anything in the chat below.
        </p>
        <!-- Capability chips -->
        <div class="flex flex-wrap gap-2 mt-4">
          <span v-for="cap in CAPABILITIES" :key="cap.label"
            class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium text-white backdrop-blur-sm">
            <component :is="cap.icon" class="w-3.5 h-3.5" />
            {{ cap.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="max-w-4xl mx-auto px-4 py-8 space-y-8">

      <!-- Not logged in -->
      <div v-if="!auth.isLoggedIn" class="text-center py-16">
        <Sparkles class="w-12 h-12 text-violet-300 mx-auto mb-4" />
        <p class="text-slate-700 font-semibold mb-2">Log in to use AI Study Assistant</p>
        <RouterLink to="/login" class="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors">
          Log in
        </RouterLink>
      </div>

      <template v-else>
        <!-- Loading enrollments -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>

        <template v-else>
          <!-- ── AI CHATBOT SECTION ────────────────────────────────────── -->
          <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <!-- Chat header -->
            <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare class="w-4 h-4 text-white" />
              </div>
              <div>
                <p class="text-sm font-bold text-slate-800">Ask the AI</p>
                <p class="text-xs text-slate-500">Ask any study or academic question</p>
              </div>
              <button
                v-if="chatHistory.length"
                class="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                @click="clearChat"
              >
                <Trash2 class="w-3 h-3" />
                Clear
              </button>
            </div>

            <!-- Messages -->
            <div ref="chatScrollEl" class="flex flex-col gap-4 px-5 py-5 min-h-[220px] max-h-[420px] overflow-y-auto">
              <!-- Welcome state -->
              <div v-if="!chatHistory.length" class="flex flex-col items-center justify-center flex-1 py-8 text-center">
                <div class="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
                  <Sparkles class="w-6 h-6 text-violet-400" />
                </div>
                <p class="text-sm font-semibold text-slate-700">Ask me anything about your studies</p>
                <p class="text-xs text-slate-400 mt-1 max-w-xs">Explain a concept, help with an essay, summarise a topic, or answer a question.</p>
                <!-- Suggestion chips -->
                <div class="flex flex-wrap gap-2 mt-4 justify-center">
                  <button
                    v-for="s in SUGGESTIONS"
                    :key="s"
                    class="text-xs px-3 py-1.5 rounded-full border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                    @click="sendSuggestion(s)"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <!-- Chat messages -->
              <template v-else>
                <div
                  v-for="(msg, i) in chatHistory"
                  :key="i"
                  :class="['flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start']"
                >
                  <!-- AI avatar -->
                  <div v-if="msg.role === 'model'" class="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles class="w-3.5 h-3.5 text-white" />
                  </div>
                  <div
                    :class="[
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    ]"
                    v-html="msg.role === 'model' ? renderMarkdown(msg.text) : escapeHtml(msg.text)"
                  />
                  <!-- User avatar -->
                  <div v-if="msg.role === 'user'" class="w-7 h-7 rounded-xl bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-slate-600">
                    {{ auth.user?.name?.[0]?.toUpperCase() ?? 'U' }}
                  </div>
                </div>

                <!-- Typing indicator -->
                <div v-if="chatLoading" class="flex gap-2.5 justify-start">
                  <div class="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles class="w-3.5 h-3.5 text-white" />
                  </div>
                  <div class="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                    <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay:0ms" />
                    <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay:150ms" />
                    <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay:300ms" />
                  </div>
                </div>

                <!-- Chat error -->
                <div v-if="chatError" class="flex gap-2.5 justify-start">
                  <div class="bg-red-50 border border-red-200 rounded-2xl px-4 py-2.5 text-xs text-red-700 max-w-[80%]">
                    {{ chatError }}
                  </div>
                </div>
              </template>
            </div>

            <!-- Input area -->
            <div class="px-4 pb-4 pt-2 border-t border-slate-100">
              <div class="flex gap-2 items-end">
                <textarea
                  v-model="chatInput"
                  rows="2"
                  class="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-slate-800 placeholder:text-slate-400"
                  placeholder="Ask a study question…"
                  :disabled="chatLoading"
                  @keydown.enter.exact.prevent="sendChat"
                />
                <button
                  class="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  :disabled="chatLoading || !chatInput.trim()"
                  @click="sendChat"
                >
                  <Send class="w-4 h-4 text-white" />
                </button>
              </div>
              <p class="text-[10px] text-slate-400 mt-1.5 text-right">Enter to send · Shift+Enter for new line</p>
            </div>
          </section>

          <!-- ── MATERIAL ANALYSIS SECTION ────────────────────────────── -->
          <section>
            <h2 class="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Analyse Course Materials</h2>

            <!-- No courses enrolled -->
            <div v-if="!enrollments.length" class="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <BookOpen class="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p class="text-slate-600 font-semibold">You're not enrolled in any courses yet</p>
              <RouterLink to="/courses" class="mt-3 inline-flex items-center gap-2 text-sm text-violet-600 hover:underline font-medium">
                Browse courses →
              </RouterLink>
            </div>

            <!-- Course list with AI resources -->
            <div v-else class="space-y-4">
              <div v-for="enroll in enrollments" :key="enroll._id" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

                <!-- Course header -->
                <button
                  class="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                  @click="toggleCourse(enroll.course?._id)"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                      <BookOpen class="w-5 h-5 text-violet-600" />
                    </div>
                    <div class="text-left">
                      <p class="font-semibold text-slate-900 text-sm">{{ enroll.course?.name }}</p>
                      <p class="text-xs text-slate-500">{{ enroll.course?.code }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span v-if="courseContent[enroll.course?._id]?.loading"
                      class="w-4 h-4 border-2 border-violet-400 border-t-violet-600 rounded-full animate-spin" />
                    <span v-else-if="aiResourceCount(enroll.course?._id) > 0"
                      class="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                      {{ aiResourceCount(enroll.course?._id) }} file{{ aiResourceCount(enroll.course?._id) !== 1 ? 's' : '' }}
                    </span>
                    <ChevronDown
                      class="w-4 h-4 text-slate-400 transition-transform duration-200"
                      :class="openCourses.has(enroll.course?._id) ? 'rotate-180' : ''"
                    />
                  </div>
                </button>

                <!-- Resources list -->
                <Transition
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 -translate-y-2"
                  enter-to-class="opacity-100 translate-y-0"
                >
                  <div v-if="openCourses.has(enroll.course?._id)" class="border-t border-slate-100">
                    <div v-if="courseContent[enroll.course?._id]?.loading" class="px-5 py-4 text-sm text-slate-400">
                      Loading materials…
                    </div>
                    <div v-else-if="!aiResourceCount(enroll.course?._id)" class="px-5 py-4 text-sm text-slate-400 italic">
                      No supported files found. AI works with PDF, text, image files.
                    </div>
                    <div v-else class="divide-y divide-slate-50">
                      <div
                        v-for="res in aiResources(enroll.course?._id)"
                        :key="res._id"
                        class="flex items-center justify-between px-5 py-3 hover:bg-violet-50/50 transition-colors group"
                      >
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <FileText class="w-4 h-4 text-slate-400" />
                          </div>
                          <div class="min-w-0">
                            <p class="text-sm font-medium text-slate-800 truncate">{{ res.title }}</p>
                            <p class="text-xs text-slate-400">{{ res.mimeType }}</p>
                          </div>
                        </div>
                        <!-- Action buttons -->
                        <div class="flex items-center gap-1.5 flex-shrink-0 ml-3">
                          <button
                            v-for="act in ACTIONS"
                            :key="act.id"
                            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all opacity-0 group-hover:opacity-100"
                            :class="act.cls"
                            @click="openAI(res, act.id)"
                          >
                            <component :is="act.icon" class="w-3 h-3" />
                            {{ act.label }}
                          </button>
                          <!-- Always-visible sparkle for mobile -->
                          <button
                            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-violet-300 text-violet-700 bg-violet-50 hover:bg-violet-100 transition-all sm:hidden"
                            @click="openAI(res, 'summary')"
                          >
                            <Sparkles class="w-3 h-3" />
                            AI
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </section>
        </template>
      </template>
    </div>

    <!-- AI Modal (for material analysis) -->
    <AIStudyModal v-model="showModal" :resource="activeResource" :initial-action="initialAction" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Sparkles, BookOpen, FileText, ChevronDown, Send, MessageSquare, Trash2,
  FileText as SummaryIcon, ListChecks, Layers, BookOpen as FlashIcon,
} from 'lucide-vue-next';
import AIStudyModal from '@/components/AIStudyModal.vue';
import { useAuthStore }      from '@/stores/auth.js';
import { useEnrollmentStore } from '@/stores/enrollments.js';
import { api } from '@/api/client.js';

const auth            = useAuthStore();
const enrollmentStore = useEnrollmentStore();
const loading         = ref(false);

const enrollments = computed(() => enrollmentStore.enrollments);

onMounted(async () => {
  if (auth.isLoggedIn && !enrollmentStore.enrollments.length) {
    loading.value = true;
    await enrollmentStore.fetchEnrollments?.().catch(() => {});
    loading.value = false;
  }
});

// ── Open/close course panels ─────────────────────────────────────────────────
const openCourses   = ref(new Set());
const courseContent = reactive({});

const AI_SUPPORTED = new Set([
  'application/pdf',
  'text/plain', 'text/html', 'text/csv', 'text/markdown',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
]);

function aiResources(courseId) {
  const sections = courseContent[courseId]?.sections ?? [];
  return sections.flatMap(s => s.resources ?? []).filter(r => r.fileUrl && AI_SUPPORTED.has(r.mimeType));
}
function aiResourceCount(courseId) { return aiResources(courseId).length; }

async function toggleCourse(courseId) {
  if (!courseId) return;
  const s = new Set(openCourses.value);
  if (s.has(courseId)) { s.delete(courseId); openCourses.value = s; return; }
  s.add(courseId);
  openCourses.value = s;

  if (courseContent[courseId]) return;

  const enroll = enrollments.value.find(e => e.course?._id === courseId);
  if (!enroll?.course?.code) return;

  courseContent[courseId] = { loading: true, sections: [] };
  try {
    const data = await api.get(`/api/content/${encodeURIComponent(enroll.course.code)}`);
    courseContent[courseId] = { loading: false, sections: data.sections ?? [] };
  } catch {
    courseContent[courseId] = { loading: false, sections: [] };
  }
}

// ── AI Modal (material analysis) ─────────────────────────────────────────────
const showModal      = ref(false);
const activeResource = ref(null);
const initialAction  = ref('');

function openAI(resource, action) {
  activeResource.value = resource;
  initialAction.value  = action;
  showModal.value      = true;
}

// ── AI Chatbot ────────────────────────────────────────────────────────────────
// History: [{ role: 'user' | 'model', text: string }]
const chatHistory = ref([]);
const chatInput   = ref('');
const chatLoading = ref(false);
const chatError   = ref('');
const chatScrollEl = ref(null);

async function scrollToBottom() {
  await nextTick();
  if (chatScrollEl.value) {
    chatScrollEl.value.scrollTop = chatScrollEl.value.scrollHeight;
  }
}

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text || chatLoading.value) return;

  chatInput.value = '';
  chatError.value = '';

  // Append user message
  chatHistory.value = [...chatHistory.value, { role: 'user', text }];
  await scrollToBottom();

  chatLoading.value = true;
  try {
    // Send message + full history (excluding the message we just added to the array)
    const historyForApi = chatHistory.value.slice(0, -1);
    const data = await api.post('/api/ai/chat', { message: text, history: historyForApi });
    chatHistory.value = [...chatHistory.value, { role: 'model', text: data.reply }];
    await scrollToBottom();
  } catch (e) {
    chatError.value = e.message || 'Something went wrong. Please try again.';
  } finally {
    chatLoading.value = false;
  }
}

function sendSuggestion(text) {
  chatInput.value = text;
  sendChat();
}

function clearChat() {
  chatHistory.value = [];
  chatError.value   = '';
  chatInput.value   = '';
}

// Simple markdown renderer for AI responses
function renderMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-xs font-bold mt-3 mb-1 text-slate-700">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-sm font-bold mt-3 mb-1 text-slate-800">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-sm font-bold mt-3 mb-1 text-slate-900">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em>$1</em>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-3 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-3 list-decimal text-sm">$2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Static config ─────────────────────────────────────────────────────────────
const CAPABILITIES = [
  { label: 'Summaries',   icon: SummaryIcon },
  { label: 'Key Points',  icon: ListChecks  },
  { label: 'Quiz',        icon: Layers      },
  { label: 'Flashcards',  icon: FlashIcon   },
  { label: 'Chat',        icon: MessageSquare },
];

const ACTIONS = [
  { id: 'summary',    label: 'Summarise', icon: SummaryIcon, cls: 'border-slate-200 text-slate-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 bg-white' },
  { id: 'quiz',       label: 'Quiz',      icon: Layers,      cls: 'border-slate-200 text-slate-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 bg-white' },
  { id: 'keypoints',  label: 'Key Points',icon: ListChecks,  cls: 'border-slate-200 text-slate-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 bg-white' },
  { id: 'flashcards', label: 'Flashcards',icon: FlashIcon,   cls: 'border-slate-200 text-slate-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 bg-white' },
];

const SUGGESTIONS = [
  'Explain what machine learning is',
  'How do I write a good essay?',
  'What is the difference between RAM and ROM?',
  'Give me tips for exam revision',
];
</script>
