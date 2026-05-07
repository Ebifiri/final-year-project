<script setup>
import NavBar    from './components/navBar.vue';
import AppFooter from './components/footer.vue';
import { computed, ref } from 'vue';
import { Download, X, Trash2, Loader2, CheckSquare } from 'lucide-vue-next';
import { useDownloadCart } from '@/stores/downloadCart.js';

const cart = useDownloadCart();

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

async function downloadOne(resource) {
  const url = `${BASE_URL}/api/content/download/${resource._id}`;
  const res  = await fetch(url);
  if (!res.ok) return;
  const blob    = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = blobUrl;
  a.download    = resource.title;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

async function downloadAll() {
  if (downloading.value) return;
  downloading.value  = true;
  downloadDone.value = false;
  for (const resource of cart.items) {
    await downloadOne(resource);
    // Small gap so the browser isn't overwhelmed
    await new Promise(r => setTimeout(r, 600));
  }
  downloading.value  = false;
  downloadDone.value = true;
  setTimeout(() => { downloadDone.value = false; }, 3000);
}
</script>

<template>
  <NavBar>
    <router-view />
    <AppFooter />
  </NavBar>

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
</template>

<style scoped></style>
