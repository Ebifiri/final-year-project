<template>
  <footer class="bg-[#1e293b] text-white">
    <!-- Main footer content -->
    <div class="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

      <!-- Column 1: Mission Statement -->
      <div class="lg:col-span-1">
        <img src="../assets/pau-logo-light.png" alt="PAU Logo" class="h-10 mb-5 opacity-90" />
        <p class="text-sm leading-relaxed text-blue-100 italic mt-2">
          "To form competent and committed professionals and encourage them to serve with personal initiative and
          social responsibility the community in which they work, thereby helping to build a better society in
          Nigeria and Africa at large."
        </p>
      </div>

      <!-- Column 2: Info links -->
      <div>
        <h3 class="text-base font-bold tracking-wide mb-5 text-white">Info</h3>
        <ul class="space-y-3">
          <li>
            <a
              href="https://servicedesk.pau.edu.ng"
              target="_blank" rel="noopener noreferrer"
              class="text-sm text-blue-200 hover:text-white transition-colors hover:underline underline-offset-2"
            >PAU Servicedesk</a>
          </li>
          <li>
            <router-link
              to="/privacy-policy"
              class="text-sm text-blue-200 hover:text-white transition-colors hover:underline underline-offset-2"
            >Privacy Policy</router-link>
          </li>
        </ul>
      </div>

      <!-- Column 3: Contact Us -->
      <div>
        <h3 class="text-base font-bold tracking-wide mb-5 text-white">Contact Us</h3>
        <div class="space-y-4 text-sm text-blue-100">
          <!-- Address -->
          <div class="flex items-start gap-2">
            <MapPin class="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
            <p class="leading-relaxed">
              Km 52, Lekki-Epe Expressway, Ibeju Lekki,<br />
              PO Box 73688, Lagos, Nigeria
            </p>
          </div>
          <!-- Phone -->
          <div class="flex items-start gap-2">
            <Phone class="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
            <p>(+234) 708 864 1465 &nbsp;(+234) 701 782 5427</p>
          </div>
          <!-- Email -->
          <div class="flex items-start gap-2">
            <Mail class="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
            <a
              href="mailto:admissions@pau.edu.ng"
              class="text-blue-200 hover:text-white transition-colors hover:underline underline-offset-2"
            >admissions@pau.edu.ng</a>
          </div>
        </div>
      </div>

      <!-- Column 4: Follow Us -->
      <div>
        <h3 class="text-base font-bold tracking-wide mb-5 text-white">Follow Us</h3>
        <div class="flex flex-wrap gap-3">
          <!-- X / Twitter -->
          <a
            href="https://twitter.com/PAUniversity_ng"
            target="_blank" rel="noopener noreferrer"
            aria-label="X (Twitter)"
            class="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <!-- X logo SVG -->
            <svg viewBox="0 0 24 24" class="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.26 5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"/>
            </svg>
          </a>

          <!-- LinkedIn -->
          <a
            href="https://linkedin.com/school/pan-atlantic-university"
            target="_blank" rel="noopener noreferrer"
            aria-label="LinkedIn"
            class="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <Linkedin class="w-5 h-5 text-white" />
          </a>

          <!-- YouTube -->
          <a
            href="https://youtube.com/@PAUniversity"
            target="_blank" rel="noopener noreferrer"
            aria-label="YouTube"
            class="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <Youtube class="w-5 h-5 text-white" />
          </a>

          <!-- Facebook -->
          <a
            href="https://facebook.com/PAUniversity"
            target="_blank" rel="noopener noreferrer"
            aria-label="Facebook"
            class="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <Facebook class="w-5 h-5 text-white" />
          </a>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="border-t border-white/10">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-blue-200/60">
        <span>© {{ new Date().getFullYear() }} Pan-Atlantic University. All rights reserved.</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { Mail, Phone, MapPin, Linkedin, Youtube, Facebook } from 'lucide-vue-next';
</script>
