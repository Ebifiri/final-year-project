<template>
  <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toastStore.toasts" 
        :key="toast.id"
        class="pointer-events-auto flex items-center gap-3.5 px-5 py-4 rounded-2xl shadow-xl border backdrop-blur-xl transition-all transform w-80 max-w-[90vw]"
        :class="{
          'bg-white/95 border-slate-200 text-slate-700': toast.type === 'info',
          'bg-emerald-50/95 border-emerald-200 text-emerald-800': toast.type === 'success',
          'bg-rose-50/95 border-rose-200 text-rose-800': toast.type === 'error'
        }"
      >
        <div class="flex-shrink-0">
          <CheckCircle2 v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-500" />
          <AlertCircle v-else-if="toast.type === 'error'" class="w-5 h-5 text-rose-500" />
          <Info v-else class="w-5 h-5 text-slate-500" />
        </div>
        <p class="text-sm font-semibold leading-snug break-words flex-1">{{ toast.message }}</p>
        <button @click="toastStore.removeToast(toast.id)" class="ml-1 flex-shrink-0 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded-full p-1 hover:bg-slate-100/50">
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from '@/stores/toast.js';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next';
const toastStore = useToastStore();
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(120%) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>
