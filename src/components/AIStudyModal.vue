<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="$emit('update:modelValue', false)" />

        <!-- Panel -->
        <div class="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          <!-- Header -->
          <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-shrink-0">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles class="w-5 h-5 text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="text-sm font-bold text-slate-900">AI Study Assistant</h2>
              <p class="text-xs text-slate-500 truncate">{{ resource?.title }}</p>
            </div>
            <button
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              @click="$emit('update:modelValue', false)"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2 px-5 py-3 border-b border-slate-100 flex-shrink-0 overflow-x-auto">
            <button
              v-for="act in ACTIONS" :key="act.id"
              :class="[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                action === act.id
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-400 hover:text-violet-600'
              ]"
              :disabled="loading"
              @click="run(act.id)"
            >
              <component :is="act.icon" class="w-3.5 h-3.5" />
              {{ act.label }}
            </button>
          </div>

          <!-- Content area -->
          <div class="flex-1 overflow-y-auto px-5 py-4">

            <!-- Idle -->
            <div v-if="!action && !result && !loading" class="flex flex-col items-center justify-center py-12 text-center">
              <div class="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
                <Sparkles class="w-7 h-7 text-violet-400" />
              </div>
              <p class="text-sm font-semibold text-slate-700">What would you like to generate?</p>
              <p class="text-xs text-slate-400 mt-1">Choose an action above to analyse this material.</p>
            </div>

            <!-- Loading -->
            <div v-else-if="loading" class="flex flex-col items-center justify-center py-12">
              <div class="w-10 h-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin mb-4" />
              <p class="text-sm text-slate-500">Analysing with Gemini AI…</p>
              <p class="text-xs text-slate-400 mt-1">This may take a few seconds</p>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              <p class="font-semibold mb-1">Error</p>
              <p>{{ error }}</p>
            </div>

            <!-- Summary / Key Points (markdown text) -->
            <div v-else-if="result && (action === 'summary' || action === 'keypoints')"
              class="prose prose-sm max-w-none text-slate-700"
              v-html="renderedMarkdown"
            />

            <!-- Quiz -->
            <div v-else-if="result && action === 'quiz' && Array.isArray(result)">
              <p class="text-xs text-slate-500 mb-4">{{ result.length }} questions generated</p>
              <div v-for="(q, i) in result" :key="i" class="mb-5 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <p class="text-sm font-semibold text-slate-800 mb-3">{{ i + 1 }}. {{ q.question }}</p>
                <div class="space-y-1.5">
                  <div
                    v-for="(choice, ci) in q.choices" :key="ci"
                    :class="[
                      'text-xs px-3 py-2 rounded-lg border transition-colors',
                      revealed.has(i)
                        ? ci === q.correct ? 'bg-green-50 border-green-400 text-green-800 font-semibold' : 'bg-white border-slate-200 text-slate-500'
                        : 'bg-white border-slate-200 text-slate-700'
                    ]"
                  >{{ choice }}</div>
                </div>
                <div class="mt-2 flex items-center justify-between">
                  <button
                    class="text-xs text-violet-600 hover:underline font-medium"
                    @click="reveal(i)"
                  >{{ revealed.has(i) ? 'Hide answer' : 'Show answer' }}</button>
                  <p v-if="revealed.has(i)" class="text-xs text-slate-500 italic max-w-xs text-right">{{ q.explanation }}</p>
                </div>
              </div>
            </div>

            <!-- Flashcards -->
            <div v-else-if="result && action === 'flashcards' && Array.isArray(result)">
              <p class="text-xs text-slate-500 mb-4">{{ result.length }} flashcards — click to flip</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  v-for="(card, i) in result" :key="i"
                  class="relative h-28 cursor-pointer"
                  @click="flipCard(i)"
                >
                  <!-- Front -->
                  <div :class="['absolute inset-0 rounded-xl border-2 p-3 flex items-center justify-center text-center transition-all duration-300',
                    flipped.has(i) ? 'opacity-0 pointer-events-none' : 'opacity-100',
                    'bg-violet-50 border-violet-200']">
                    <p class="text-xs font-semibold text-violet-900">{{ card.front }}</p>
                  </div>
                  <!-- Back -->
                  <div :class="['absolute inset-0 rounded-xl border-2 p-3 flex items-center justify-center text-center transition-all duration-300',
                    flipped.has(i) ? 'opacity-100' : 'opacity-0 pointer-events-none',
                    'bg-slate-800 border-slate-700']">
                    <p class="text-xs text-slate-100">{{ card.back }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Raw text fallback -->
            <div v-else-if="result" class="text-sm text-slate-700 whitespace-pre-wrap">{{ result }}</div>
          </div>

          <!-- Footer -->
          <div v-if="result" class="flex items-center justify-between px-5 py-3 border-t border-slate-100 flex-shrink-0">
            <p class="text-xs text-slate-400">Generated by Gemini Flash</p>
            <button
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              @click="copy"
            >
              <Copy class="w-3.5 h-3.5" />
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Sparkles, X, FileText, ListChecks, Layers, BookOpen, Copy } from 'lucide-vue-next';
import { api } from '@/api/client.js';

const props  = defineProps({ modelValue: Boolean, resource: Object, initialAction: { type: String, default: '' } });
const emit   = defineEmits(['update:modelValue']);

const ACTIONS = [
  { id: 'summary',    label: 'Summary',    icon: FileText   },
  { id: 'keypoints',  label: 'Key Points', icon: ListChecks },
  { id: 'quiz',       label: 'Quiz',       icon: Layers     },
  { id: 'flashcards', label: 'Flashcards', icon: BookOpen   },
];

const action  = ref('');
const result  = ref(null);
const loading = ref(false);
const error   = ref('');
const revealed = ref(new Set());
const flipped  = ref(new Set());
const copied   = ref(false);

// Reset when opened with a new resource; auto-run initialAction if provided
watch(() => props.modelValue, (v) => {
  if (v) {
    action.value = ''; result.value = null; error.value = '';
    revealed.value = new Set(); flipped.value = new Set();
    if (props.initialAction) run(props.initialAction);
  }
});

async function run(act) {
  action.value  = act;
  result.value  = null;
  error.value   = '';
  loading.value = true;
  revealed.value = new Set();
  flipped.value  = new Set();
  try {
    const data = await api.post('/api/ai/analyze', { resourceId: props.resource._id, action: act });
    result.value = data.data;
  } catch (e) {
    error.value = e.message || 'AI analysis failed';
  } finally {
    loading.value = false;
  }
}

function reveal(i) {
  const s = new Set(revealed.value);
  s.has(i) ? s.delete(i) : s.add(i);
  revealed.value = s;
}

function flipCard(i) {
  const s = new Set(flipped.value);
  s.has(i) ? s.delete(i) : s.add(i);
  flipped.value = s;
}

// Very simple markdown → HTML (bold, headings, bullets)
const renderedMarkdown = computed(() => {
  if (!result.value || typeof result.value !== 'string') return '';
  return result.value
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mt-4 mb-1 text-slate-800">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-base font-bold mt-5 mb-2 text-slate-900">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-lg font-extrabold mt-5 mb-2 text-slate-900">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm,   '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '<br/><br/>');
});

async function copy() {
  const text = typeof result.value === 'string'
    ? result.value
    : JSON.stringify(result.value, null, 2);
  await navigator.clipboard.writeText(text).catch(() => {});
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}
</script>
