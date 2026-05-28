<template>
  <div class="flex-1 flex items-center justify-center bg-slate-100">
    <div class="text-center">
      <div class="w-12 h-12 border-4 border-[#1e293b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-slate-600 font-medium">Signing you in…</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const router = useRouter();
const route  = useRoute();
const auth   = useAuthStore();

onMounted(async () => {
  const token = route.query.token;
  if (!token) {
    router.push('/login?error=oauth');
    return;
  }

  // Store the JWT and fetch the user profile
  auth.token = token;
  localStorage.setItem('pau_token', token);
  localStorage.setItem('pau_active_at', Date.now().toString());
  localStorage.setItem('pau_login_at', Date.now().toString());

  try {
    await auth.fetchMe();
    router.push('/dashboard/home');
  } catch {
    auth.logout();
    router.push('/login?error=oauth');
  }
});
</script>
