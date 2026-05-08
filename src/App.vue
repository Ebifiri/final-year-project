<script setup>
import NavBar    from './components/navBar.vue';
import AppFooter from './components/footer.vue';
import AIStudyModal from './components/AIStudyModal.vue';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Download, X, Trash2, Loader2, CheckSquare, Clock, Sparkles } from 'lucide-vue-next';
import { useDownloadCart } from '@/stores/downloadCart.js';
import { useAuthStore }    from '@/stores/auth.js';

const cart   = useDownloadCart();
const auth   = useAuthStore();
const router = useRouter();

// ── AI from cart ─────────────────────────────────────────────────────────────
const AI_SUPPORTED = new Set([
  'application/pdf',
  'text/plain', 'text/html', 'text/csv', 'text/markdown',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
]);
const showCartAI  = ref(false);
const cartAIItem  = ref(null);

const firstAiItem = computed(() =>
  cart.items.find(r => r.fileUrl && AI_SUPPORTED.has(r.mimeType)) ?? null
);

function openCartAI() {
  if (!firstAiItem.value) return;
  cartAIItem.value = firstAiItem.value;
  showCartAI.value = true;
}

// ── Session-timeout toast ────────────────────────────────────────────────────
const sessionExpiredToast = ref(false);

function showExpiredToast() {
  sessionExpiredToast.value = true;
  setTimeout(() => { sessionExpiredToast.value = false; }, 5000);
}

function handleExpiry() {
  if (auth.isLoggedIn && auth.isSessionExpired()) {
    auth.logout();
    showExpiredToast();
    router.push('/login');
  }
}

// ── Auth re-hydration + inactivity tracking ──────────────────────────────────
let activityTimer  = null;
let expiryInterval = null;

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

function onUserActivity() {
  auth.recordActivity();
}

onMounted(() => {
  auth.fetchMe();

  // Restore from bfcache (back button)
  function onPageShow(e) {
    if (e.persisted) {
      if (auth.isSessionExpired()) {
        auth.logout();
        showExpiredToast();
        router.push('/login');
      } else {
        auth.fetchMe();
      }
    }
  }
  window.addEventListener('pageshow', onPageShow);

  // Track user activity to reset idle timer
  ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, onUserActivity, { passive: true }));

  // Periodic check every 60 s — catches expiry even if the user is just reading
  expiryInterval = setInterval(handleExpiry, 60_000);

  onUnmounted(() => {
    window.removeEventListener('pageshow', onPageShow);
    ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, onUserActivity));
    clearInterval(expiryInterval);
    clearTimeout(activityTimer);
  });
});

const downloading  = ref(false);
const downloadDone = ref(false);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Group items by courseId for the label
const groupLabel = computed(() => {
  const counts = {};
  for (const r of cart.items) {
    const key = r.courseId ?? 'Unknown';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.keys(counts).length > 1
    ? `${cart.count} files from ${Object.keys(counts).length} courses`
    : `${cart.count} file${cart.count !== 1 ? 's' : ''}`;
});

// Batch download: POST all resource IDs to the server, get back a single ZIP.
async function downloadAll() {
  if (downloading.value || !cart.items.length) return;
  downloading.value  = true;
  downloadDone.value = false;

  try {
    const ids = cart.items.map(r => r._id);
    const res = await fetch(`${BASE_URL}/api/content/download-zip`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ resourceIds: ids }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Download failed' }));
      console.error('ZIP download failed:', err.message);
      return;
    }

    const blob    = await res.blob();
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = url;
    a.download    = `course-materials-${cart.count}-files.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    downloadDone.value = true;
    setTimeout(() => { downloadDone.value = false; }, 3000);
  } finally {
    downloading.value = false;
  }
}
</script>

<template>
  <NavBar>
    <router-view />
    <AppFooter />
  </NavBar>

  <!-- ── Session Expired Toast ──────────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="-translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-4 opacity-0"
    >
      <div
        v-if="sessionExpiredToast"
        class="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl shadow-lg"
      >
        <Clock class="w-4 h-4 text-amber-500 flex-shrink-0" />
        <p class="text-sm font-semibold text-amber-800">Your session has expired. Please log in again.</p>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Floating Download Cart ───────────────────────────────────────────── -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="cart.count > 0"
        class="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
      >
        <div class="bg-[#1e293b] text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 px-4 py-3">
          <!-- Icon + label -->
          <div class="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Download class="w-4 h-4" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold leading-tight">{{ groupLabel }}</p>
            <p class="text-[11px] text-slate-400 mt-0.5 truncate">
              {{ cart.items.map(r => r.title).join(', ') }}
            </p>
          </div>

          <!-- AI Study (only when compatible items are in cart) -->
          <button
            v-if="firstAiItem"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors flex-shrink-0"
            :title="'AI Study: ' + firstAiItem.title"
            @click="openCartAI"
          >
            <Sparkles class="w-3.5 h-3.5" />
            AI Study
          </button>

          <!-- Download All -->
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60 flex-shrink-0"
            :disabled="downloading"
            @click="downloadAll"
          >
            <Loader2 v-if="downloading" class="w-3.5 h-3.5 animate-spin" />
            <CheckSquare v-else-if="downloadDone" class="w-3.5 h-3.5" />
            <Download v-else class="w-3.5 h-3.5" />
            {{ downloading ? 'Downloading…' : downloadDone ? 'Done!' : 'Download All' }}
          </button>

          <!-- Clear selection -->
          <button
            class="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors flex-shrink-0"
            title="Clear selection"
            @click="cart.clear()"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- AI Study Modal from cart -->
  <AIStudyModal v-model="showCartAI" :resource="cartAIItem" />
</template>

<style scoped></style>

