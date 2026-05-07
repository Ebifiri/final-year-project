<template>
  <!-- Login page — fills the NavBar shell slot -->
  <div class="flex-1 overflow-y-auto relative flex items-center justify-center p-4">

    <!-- Background image -->
    <img
      src="../assets/home/home2.jpg"
      alt=""
      class="absolute inset-0 w-full h-full object-cover opacity-70"
    />
    <!-- Dark overlay -->
    <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>

    <!-- Login card -->
    <div class="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden">

      <img src="../assets/pau-logo.png" alt="" class="h-20 mx-auto my-5">

      <!-- Two-column body -->
      <div class="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-100 px-8 pb-10 gap-8">

        <!-- LEFT: Email/password form -->
        <div class="flex flex-col gap-5 pt-2">
          <!-- Email -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-slate-700">Email Address</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@pau.edu.ng"
              class="border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-slate-700">Password</label>
              <a href="#" class="text-xs font-medium text-blue-600 hover:text-blue-700 transition">Lost password?</a>
            </div>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
            />
          </div>

          <!-- Error message -->
          <p v-if="auth.error" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {{ auth.error }}
          </p>
          <p v-if="oauthError === 'not_configured'" class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            OAuth sign-in hasn't been configured on this server yet. Please use email/password.
          </p>
          <p v-else-if="oauthError" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            OAuth sign-in failed. Please try again or use email/password.
          </p>

          <!-- Login button -->
          <button
            class="flex items-center justify-center gap-2 w-full py-3 bg-[#1e293b] hover:bg-slate-700 text-white font-bold rounded-xl transition-colors shadow-lg mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="auth.loading"
            @click="handleLogin"
          >
            <Loader2 v-if="auth.loading" class="w-4 h-4 animate-spin" />
            <template v-else>
              Log in
              <ArrowRight class="w-4 h-4" />
            </template>
          </button>
        </div>

        <!-- RIGHT: SSO options -->
        <div class="flex flex-col gap-4 pt-2 sm:pl-8">
          <p class="text-sm text-slate-500 text-center">Or log in with your PAU account:</p>

          <!-- Microsoft 365 -->
          <button
            class="flex items-center justify-center gap-3 w-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl py-3 px-4 transition-colors shadow-sm"
            @click="oauthSignIn('microsoft')"
          >
            <!-- MS logo SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
              <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            <span class="text-sm font-semibold text-slate-700">Microsoft 365</span>
          </button>

          <!-- Google -->
          <button
            class="flex items-center justify-center gap-3 w-full border border-slate-200 hover:border-red-200 hover:bg-red-50 rounded-xl py-3 px-4 transition-colors shadow-sm"
            @click="oauthSignIn('google')"
          >
            <!-- Google logo SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            <span class="text-sm font-semibold text-slate-700">Google</span>
          </button>

          <!-- Divider -->
          <div class="flex items-center gap-3 my-1">
            <div class="flex-1 h-px bg-slate-100"></div>
            <span class="text-xs font-bold text-slate-400 tracking-widest uppercase">New Student?</span>
            <div class="flex-1 h-px bg-slate-100"></div>
          </div>

          <!-- Create account -->
          <RouterLink
            to="/register"
            class="block w-full text-center border-2 border-slate-800 hover:bg-slate-800 hover:text-white text-slate-800 font-bold rounded-xl py-3 px-4 transition-colors"
          >
            Create new account
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import { ArrowRight, Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.js';

const router      = useRouter();
const route       = useRoute();
const auth        = useAuthStore();
const email       = ref('');
const password    = ref('');
const oauthError = computed(() => {
  const e = route.query.error;
  if (e === 'oauth_not_configured') return 'not_configured';
  if (e === 'oauth') return 'failed';
  return null;
});

async function handleLogin() {
  const ok = await auth.login(email.value, password.value);
  if (ok) {
    const destination = route.query.redirect || '/dashboard/home';
    router.push(destination);
  }
}

function oauthSignIn(provider) {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  window.location.href = `${base}/api/auth/${provider}`;
}
</script>
